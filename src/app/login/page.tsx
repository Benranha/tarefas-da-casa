import Link from 'next/link'
import GoogleButton from '@/components/GoogleButton'

// Os responsáveis entram só com a conta do Google. Na primeira vez o painel pede o telefone (/telefone).
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-raised p-8 rounded-[32px] shadow-sm border-2 border-line">
        <h1 className="text-3xl font-bold text-center text-ink mb-2">Login dos Pais</h1>
        <p className="text-center text-ink-muted mb-8">Entre com a sua conta do Google.</p>
        <GoogleButton label="Entrar com o Google" />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Primeira vez?{' '}
          <Link href="/cadastro" className="font-bold text-ink">
            Criar conta
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-ink-muted">
          Este aparelho é o tablet das crianças?{' '}
          <Link href="/abrir?trocar=1" className="font-bold text-ink">
            Usar como painel
          </Link>
        </p>
      </div>
    </div>
  )
}
