import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

export function Layout() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  // Mobilde başlangıçta sidebar kapalı olsun
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-0)]">
      <Sidebar />

      <div
        className={cn(
          'flex flex-1 flex-col min-w-0 transition-all duration-300',
          sidebarOpen ? 'md:ml-72' : 'md:ml-0'
        )}
      >
        <TopBar />
        {/* pb-16 → mobil alt nav için boşluk */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-4xl">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
