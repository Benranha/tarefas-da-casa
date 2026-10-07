import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { getAdmin } from '@/lib/admin';
import { signOut } from '@/app/login/actions';
import AdminNav from './Nav';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Admin · Tarefinha', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect('/login');
  // Logado mas fora da allowlist: a área simplesmente não existe.
  if (!(await getAdmin())) notFound();

  return (
    <div className="tf-painel ad-shell">
      <AdminNav signOut={signOut} />
      <main className="ad-main">{children}</main>
    </div>
  );
}
