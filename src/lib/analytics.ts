// Eventos do Google Analytics 4 (o gtag.js é carregado no app/layout.tsx).
// Para virar "key event" (conversão), marque o evento no GA4: Admin → Eventos → Marcar como evento principal.

type Params = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export type AnalyticsEvent =
  | 'sign_up' // conta nova (chega ao onboarding pela primeira vez)
  | 'tutorial_complete' // terminou o onboarding (1ª criança + 1ª tarefa)
  | 'add_child' // cadastrou uma criança
  | 'create_task' // criou uma tarefa
  | 'copy_tasks' // copiou tarefas de uma criança para outra
  | 'approve_task' // aprovou uma tarefa feita
  | 'create_reward' // cadastrou um prêmio
  | 'invite_parent' // gerou convite para outro responsável
  | 'app_install_prompt' // abriu o prompt de instalação do PWA
  | 'app_install' // instalou o PWA

export function track(event: AnalyticsEvent, params: Params = {}) {
  if (typeof window === 'undefined') return
  try {
    if (window.gtag) {
      window.gtag('event', event, params)
    } else {
      // gtag ainda não iniciou: enfileira no dataLayer do mesmo jeito que o gtag faria.
      window.dataLayer = window.dataLayer || []
      queue('event', event, params)
    }
  } catch {}
}

// O gtag.js só aceita o objeto `arguments` (não um array) no dataLayer.
function queue(...args: unknown[]): void
function queue() {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer!.push(arguments)
}

/** Dispara o evento só uma vez por navegador (ex.: sign_up). */
export function trackOnce(event: AnalyticsEvent, params: Params = {}) {
  const key = `tf-ga-${event}`
  try {
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
  } catch {}
  track(event, params)
}

const METHOD_KEY = 'tf-auth-method'

/** Guarda como a pessoa está entrando/cadastrando (sobrevive ao redirect do Google). */
export function rememberAuthMethod(method: 'email' | 'google') {
  try {
    sessionStorage.setItem(METHOD_KEY, method)
  } catch {}
}

export function authMethod(): string {
  try {
    return sessionStorage.getItem(METHOD_KEY) || 'email'
  } catch {
    return 'email'
  }
}
