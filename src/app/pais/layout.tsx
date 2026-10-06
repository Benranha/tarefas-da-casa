import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/login/actions';
import Nav from './Nav';

export default async function ParentsLayout({ children }: { children: React.ReactNode }) {
  // Veio de um convite e acabou de entrar/criar a conta: volta para aceitar o convite.
  const invite = (await cookies()).get('tarefinha-convite')?.value;
  if (invite && /^[0-9a-f]{32}$/i.test(invite)) redirect(`/convite?c=${invite}`);

  return (
    <div className="tf-painel min-h-screen bg-surface flex flex-col md:flex-row">
      <Nav signOut={signOut} />
      <main className="tf-main flex-1 min-w-0 px-5 pt-3 md:p-10">{children}</main>
    </div>
  );
}
