import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileNav } from './Sidebar';
import { ToastContainer } from '../ui/Toast';

export function Layout() {
  return (
    // 🌟 bg-bg-primary hata kar bg-transparent kar diya
    <div className="relative flex min-h-screen bg-transparent text-text-primary transition-colors duration-300">
      
      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto pb-20 transition-colors duration-300 lg:pb-0">
        <div className="mx-auto max-w-7xl p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      <MobileNav />
      <ToastContainer />
    </div>
  );
}