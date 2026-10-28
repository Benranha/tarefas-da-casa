import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/login/actions'
import { getFamily } from '@/lib/auth/server'
import { onboardingStatus } from '@/lib/onboarding';
import { getAdmin } from '@/lib/admin';
import Nav from './Nav';

export default async function ParentsLayout({ children }: { children: React.ReactNode }) {
  // Veio de um convite e acabou de entrar/criar a conta: volta para aceitar o convite.
  const invite = (await cookies()).get('tarefinha-convite')?.value;
  if (invite && /^[0-9a-f]{32}$/i.test(invite)) redirect(`/convite?c=${invite}`);

  // Conta nova: só libera o painel depois da primeira criança e da primeira tarefa.
  const family = await getFamily()
  if (family && !(await onboardingStatus(family.ownerId)).done) redirect('/onboarding')

  return (
    <div className="tf-painel min-h-screen bg-surface flex flex-col md:flex-row">
      <Nav signOut={signOut} isAdmin={!!(await getAdmin())} />
      <main className="tf-main flex-1 min-w-0 px-5 pt-3 md:p-10">{children}</main>
    </div>
  );
}
