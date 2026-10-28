import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { getAdmin } from '@/lib/admin';
import { signOut } from '@/app/login/actions';
import Nav from '../pais/Nav';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Admin · Tarefinha', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect('/login');
  // Logado mas fora da allowlist: a área simplesmente não existe.
  if (!(await getAdmin())) notFound();

  return (
    <div className="tf-painel min-h-screen bg-surface flex flex-col md:flex-row">
      <Nav signOut={signOut} isAdmin />
      <main className="tf-main flex-1 min-w-0 px-5 pt-3 md:p-10">{children}</main>
    </div>
  );
}
