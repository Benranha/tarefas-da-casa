import { createClient } from 'next/navigation'
import { createClient as supabaseClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBFA] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-sm border-2 border-[#EEDCDF]">
        <h1 className="text-3xl font-bold text-center text-[#5C4033] mb-8">
          Login dos Pais
        </h1>
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-[#5C4033] outline-none transition-all"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-[#5C4033] outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-[#5C4033] text-white font-bold rounded-2xl hover:bg-[#4A3329] transition-colors shadow-lg"
          >
            Entrar
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Problemas com o acesso? Entre em contato com o administrador.
        </p>
      </div>
    </div>
  )
}
