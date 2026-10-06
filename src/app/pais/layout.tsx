import React from 'react';
import { signOut } from '@/app/login/actions';
import Nav from './Nav';

export default function ParentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tf-painel min-h-screen bg-surface flex flex-col md:flex-row">
      <Nav signOut={signOut} />
      <main className="flex-1 p-4 md:p-10 pb-24 md:pb-10">{children}</main>
    </div>
  );
}
