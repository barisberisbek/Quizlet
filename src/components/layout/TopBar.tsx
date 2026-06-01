import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Home, BarChart3, BookmarkIcon } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const navItems = [
    { path: '/',          label: 'Home',      icon: Home },
    { path: '/stats',     label: 'Stats',     icon: BarChart3 },
    { path: '/bookmarks', label: 'Bookmarks', icon: BookmarkIcon },
  ];

  return (
    <header className="sticky top-0 z-20 glass border-b border-white/5">
      <div className="flex items-center h-14 px-4 gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu size={18} />
        </button>

        {/* Desktop nav — mobilde BottomNav kullanılır */}
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

        {/* Mobilde başlık */}
        <span className="sm:hidden text-sm font-semibold text-slate-300 ml-1">
          CS Quiz
        </span>
      </div>
    </header>
  );
}
