import { NextResponse, type NextRequest } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { badRequest, unauthorized } from '@/lib/http'
import { AJUDA_SYSTEM_PROMPT } from '@/lib/ajuda'
import { AJUDA_TOOLS, runTool, type Proposal } from '@/lib/ajuda-tools'

export const dynamic = 'force-dynamic'

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
const MAX_MESSAGES = 10
const MAX_CHARS = 500
// Quantas vezes a IA pode pedir ferramentas numa mesma pergunta.
const MAX_STEPS = 4
// Proteção simples da cota gratuita: por responsável, em memória (vale por instância do servidor).
const LIMIT = 20
const WINDOW_MS = 10 * 60 * 1000
const hits = new Map<string, number[]>()

function tooMany(userId: string) {
  const now = Date.now()
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= LIMIT) {
    hits.set(userId, recent)
    return true
  }
  recent.push(now)
  hits.set(userId, recent)
  return false
}

type Msg = { role: 'user' | 'model'; text: string }

function parseMessages(body: unknown): Msg[] | null {
  const raw = (body as { messages?: unknown })?.messages
  if (!Array.isArray(raw) || !raw.length) return null
  const msgs: Msg[] = []
  for (const m of raw.slice(-MAX_MESSAGES)) {
    const role = (m as { role?: unknown })?.role
    const text = (m as { text?: unknown })?.text
    if ((role !== 'user' && role !== 'model') || typeof text !== 'string') return null
    msgs.push({ role, text: text.slice(0, MAX_CHARS) })
  }
  // O Gemini exige que a conversa comece e termine com a pessoa.
  while (msgs.length && msgs[0].role !== 'user') msgs.shift()
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user' || !msgs[msgs.length - 1].text.trim()) return null
  return msgs
}

// Ajuda por IA (Gemini, plano gratuito) só para responsáveis logados. A conversa não é guardada.
export async function POST(request: NextRequest) {
  const family = await getFamily()
  if (!family) return unauthorized()

  const key = process.env.GEMINI_API_KEY
  if (!key) return NextResponse.json({ error: 'A ajuda por IA ainda não foi configurada.' }, { status: 503 })

  const body = await request.json().catch(() => null)
  const msgs = parseMessages(body)
  if (!msgs) return badRequest('Escreva uma pergunta.')

  if (tooMany(family.userId)) {
    return NextResponse.json({ error: 'Você fez muitas perguntas em pouco tempo. Tente de novo em alguns minutos.' }, { status: 429 })
  }

  try {
    type Part = { text?: string; functionCall?: { name: string; args?: Record<string, unknown> } } & Record<string, unknown>
    type Content = { role: string; parts: Part[] }
    const contents: Content[] = msgs.map((m) => ({ role: m.role, parts: [{ text: m.text }] }))

    const call = () =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: AJUDA_SYSTEM_PROMPT }] },
          contents,
          tools: AJUDA_TOOLS,
          generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
        }),
        signal: AbortSignal.timeout(20_000),
      })

    let proposal: Proposal | undefined
    for (let step = 0; step < MAX_STEPS; step++) {
      let res = await call()
      // O Gemini às vezes responde 503 por alta demanda: tenta mais uma vez.
      if (res.status === 503) {
        await new Promise((r) => setTimeout(r, 1000))
        res = await call()
      }
      if (res.status === 429) {
        return NextResponse.json({ error: 'A ajuda está muito procurada agora. Tente de novo daqui a pouco ou veja o Tutorial.' }, { status: 429 })
      }
      if (!res.ok) throw new Error(`Gemini ${res.status}`)
      const data = await res.json()
      const content: Content | undefined = data?.candidates?.[0]?.content
      const parts = content?.parts ?? []
      const calls = parts.filter((p) => p.functionCall)

      if (calls.length === 0) {
        const reply = parts.map((p) => p.text ?? '').join('').trim()
        if (!reply && !proposal) throw new Error('Resposta vazia')
        return NextResponse.json({ reply: reply || 'Confira e confirme abaixo.', proposal })
      }

      // Devolve a vez do modelo como veio (inclui assinaturas de raciocínio) e as respostas das ferramentas.
      contents.push(content!)
      const responses: Part[] = []
      for (const p of calls) {
        const { name, args } = p.functionCall!
        const result = await runTool(family.ownerId, name, args ?? {})
        if (result.proposal) proposal = result.proposal
        responses.push({ functionResponse: { name, response: result.response } })
      }
      contents.push({ role: 'user', parts: responses })
    }
    // Passou do limite de passos: se já há uma proposta, mostra; senão pede para reformular.
    if (proposal) return NextResponse.json({ reply: 'Confira e confirme abaixo.', proposal })
    throw new Error('Passos demais')
  } catch (e) {
    console.error('ajuda:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Não consegui responder agora. Tente de novo ou veja o Tutorial.' }, { status: 502 })
  }
}
