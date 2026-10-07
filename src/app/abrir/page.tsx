'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const MODE_KEY = 'tarefinhaMode'
const CODE_KEY = 'totemCode'
const CHILD_KEY = 'filhoCode'

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// Aceita o link completo (…/totem?c=CÓDIGO ou …/filho?c=CÓDIGO) ou só o código.
function extractCode(input: string) {
  const text = input.trim()
  try {
    const fromUrl = new URL(text).searchParams.get('c')
    if (fromUrl) return fromUrl
  } catch {}
  return text.match(/[0-9a-f]{32}/i)?.[0] ?? null
}

function Launcher() {
  const router = useRouter()
  const params = useSearchParams()
  const change = params.get('trocar') === '1'
  const parentalToken = params.get('p') ?? ''
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState<'choose' | 'panel' | 'child'>('choose')
  const [link, setLink] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  // Abre direto no modo já escolhido, a menos que o usuário tenha pedido para trocar.
  useEffect(() => {
    // Reconfigurar um tablet já em modo totem exige o código parental (se os pais definiram um).
    const savedCode = read(CODE_KEY)
    if (change && read(MODE_KEY) === 'totem' && savedCode) {
      fetch(`/api/totem/parental?code=${savedCode}&t=${encodeURIComponent(parentalToken)}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => (d.ok === false ? router.replace('/totem') : setReady(true)))
        .catch(() => router.replace('/totem'))
      return
    }
    if (!change) {
      const mode = read(MODE_KEY)
      if (mode === 'app') return void router.replace('/pais')
      const child = read(CHILD_KEY)
      if (mode === 'filho' && child) return void router.replace(`/filho?c=${child}`)
      if (mode === 'totem' && read(CODE_KEY)) return void router.replace('/totem')
    }
    setReady(true)
  }, [change, parentalToken, router])

  function chooseApp() {
    try {
      localStorage.setItem(MODE_KEY, 'app')
    } catch {}
    router.replace('/pais')
  }

  async function savePanel(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const code = extractCode(link)
    if (!code) return setError('Cole o link do totem (ou o código) que aparece no painel dos pais.')
    setChecking(true)
    try {
      const res = await fetch(`/api/totem/check?code=${code}`, { cache: 'no-store' })
      const data = await res.json()
      if (!data.ok) throw new Error()
      localStorage.setItem(CODE_KEY, code)
      localStorage.setItem(MODE_KEY, 'totem')
      router.replace('/totem')
    } catch {
      setError('Não encontramos esse link. Copie de novo no painel dos pais, em Dashboard.')
      setChecking(false)
    }
  }

  async function saveChild(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const code = extractCode(link)
    if (!code) return setError('Cole o link que seus pais mandaram para você.')
    setChecking(true)
    try {
      const res = await fetch(`/api/filho/info?c=${code}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      localStorage.setItem(CHILD_KEY, code)
      localStorage.setItem(MODE_KEY, 'filho')
      router.replace(`/filho?c=${code}`)
    } catch {
      setError('Não encontramos esse link. Peça aos seus pais para copiar de novo, em Crianças.')
      setChecking(false)
    }
  }

  if (!ready) return null

  const card =
    'w-full p-6 rounded-[32px] border-4 text-left transition-all active:scale-95 bg-surface-raised shadow-sm hover:shadow-md'

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/tarefinha-horizontal-claro.svg" alt="Tarefinha" className="h-14 mx-auto" />
          <p className="text-ink-muted">Como você vai usar este aparelho?</p>
        </div>

        {step === 'choose' ? (
          <div className="space-y-4">
            <button onClick={chooseApp} className={`${card} border-line`}>
              <div className="text-2xl font-bold text-ink">📱 Usar como app</div>
              <p className="text-ink-muted mt-1">Para pais e responsáveis: aprovar tarefas, cadastrar crianças e prêmios.</p>
            </button>
            <button onClick={() => setStep('panel')} className={`${card} border-sun`}>
              <div className="text-2xl font-bold text-ink">🖥️ Usar como painel</div>
              <p className="text-ink-muted mt-1">Para o tablet das crianças: elas marcam as tarefas e pedem prêmios.</p>
            </button>
            <button onClick={() => { setLink(''); setError(null); setStep('child') }} className={`${card} border-brand`}>
              <div className="text-2xl font-bold text-ink">🧒 Sou criança</div>
              <p className="text-ink-muted mt-1">Tenho o link que meus pais me mandaram: vejo minhas tarefas neste aparelho.</p>
            </button>
          </div>
        ) : step === 'child' ? (
          <form onSubmit={saveChild} className="bg-surface-raised p-6 rounded-[32px] border-2 border-line space-y-4">
            <h2 className="text-xl font-bold text-ink">Meu link</h2>
            <p className="text-sm text-ink-muted">
              Cole aqui o link que seus pais mandaram para você (o que tem <strong>/filho</strong> no meio).
            </p>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…/filho?c=…"
              autoFocus
              className="w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none"
            />
            {error && <p className="text-sm text-returned-fg">{error}</p>}
            <button
              disabled={checking}
              className="w-full py-4 bg-brand text-on-brand font-bold rounded-2xl hover:bg-brand-hover disabled:opacity-60"
            >
              {checking ? 'Verificando...' : 'Começar'}
            </button>
            <button type="button" onClick={() => { setError(null); setStep('choose') }} className="w-full text-sm font-bold text-ink">
              Voltar
            </button>
          </form>
        ) : (
          <form onSubmit={savePanel} className="bg-surface-raised p-6 rounded-[32px] border-2 border-line space-y-4">
            <h2 className="text-xl font-bold text-ink">Link do totem</h2>
            <p className="text-sm text-ink-muted">
              Abra o painel dos pais, vá em <strong>Dashboard</strong>, toque em <strong>Copiar link</strong> e cole aqui.
            </p>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…/totem?c=…"
              autoFocus
              className="w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none"
            />
            {error && <p className="text-sm text-returned-fg">{error}</p>}
            <button
              disabled={checking}
              className="w-full py-4 bg-brand text-on-brand font-bold rounded-2xl hover:bg-brand-hover disabled:opacity-60"
            >
              {checking ? 'Verificando...' : 'Começar'}
            </button>
            <button type="button" onClick={() => setStep('choose')} className="w-full text-sm font-bold text-ink">
              Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function OpenPage() {
  return (
    <Suspense fallback={null}>
      <Launcher />
    </Suspense>
  )
}
