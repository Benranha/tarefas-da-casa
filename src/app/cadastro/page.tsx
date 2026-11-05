import Link from 'next/link'
import GoogleButton from '@/components/GoogleButton'

// A conta é criada só com o Google; logo depois o painel pede o telefone (/telefone).
export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-raised p-8 rounded-[32px] shadow-sm border-2 border-line">
        <h1 className="text-3xl font-bold text-center text-ink mb-2">Criar conta</h1>
        <p className="text-center text-ink-muted mb-8">
          Para pais e responsáveis. Use a sua conta do Google; em seguida pedimos o seu telefone.
        </p>
        <GoogleButton label="Criar conta com o Google" />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Teste grátis por 30 dias, sem cartão de crédito.
        </p>
        <p className="mt-3 text-center text-sm text-ink-muted">
          Já tem conta?{' '}
          <Link href="/login" className="font-bold text-ink">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
