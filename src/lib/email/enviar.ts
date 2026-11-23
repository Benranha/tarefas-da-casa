// Envio de e-mail pela Resend (https://resend.com). Sem biblioteca: uma chamada HTTP.
// RESEND_API_KEY e RESEND_FROM estão no README. O remetente precisa ser de um domínio verificado
// na Resend; sem RESEND_FROM, a Resend só entrega ao dono da conta.

export type Envio = {
  to: string
  subject: string
  html: string
  text: string
  headers?: Record<string, string> // por exemplo List-Unsubscribe
}

// "detalhe" é a resposta do Resend (sem o endereço de quem recebe). Só o botão de teste do /admin mostra
// isso, para quem administra ver o motivo; os outros envios mostram uma frase simples.
export type Resultado = { ok: true } | { ok: false; motivo: 'sem-chave' | 'falhou'; detalhe?: string }

export const remetente = () => process.env.RESEND_FROM || 'Tarefinha <onboarding@resend.dev>'

export async function enviarEmail(e: Envio): Promise<Resultado> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, motivo: 'sem-chave' }
  const from = remetente()
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: [e.to], subject: e.subject, html: e.html, text: e.text, headers: e.headers }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`Resend ${res.status} ${(await res.text()).slice(0, 200)}`)
    return { ok: true }
  } catch (err) {
    // Sem o endereço de quem recebe no log.
    const detalhe = err instanceof Error ? err.message : String(err)
    console.error('enviarEmail:', detalhe)
    return { ok: false, motivo: 'falhou', detalhe }
  }
}
