import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Home, BarChart3, BookmarkIcon } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/stats', label: 'Stats', icon: BarChart3 },
    { path: '/bookmarks', label: 'Bookmarks', icon: BookmarkIcon },
  ];

  return (
    <header className="sticky top-0 z-20 glass border-b border-white/5">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb-style nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  )}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile nav */}
        <nav className="flex sm:hidden items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-slate-500 hover:text-slate-300'
                )}
                aria-label={item.label}
              >
                <item.icon size={16} />
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
