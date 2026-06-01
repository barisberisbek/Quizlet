import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Bookmark, BookOpen } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { cn } from '../../lib/utils';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebar } = useUIStore();
  const { bookmarks } = useBookmarkStore();

  const navItems = [
    { path: '/',          label: 'Ana Sayfa', icon: Home },
    { path: '/stats',     label: 'İstatistik', icon: BarChart3 },
    { path: '/bookmarks', label: 'Yer İmleri', icon: Bookmark, badge: bookmarks.length || undefined },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 md:hidden',
        'flex items-center',
        'bg-[oklch(0.14_0.02_250/0.95)] backdrop-blur-md',
        'border-t border-white/5',
        'h-16',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Quiz listesi butonu */}
      <button
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Quizler"
      >
        <BookOpen size={20} />
        <span className="text-[10px] font-medium">Quizler</span>
      </button>

      {/* Nav items */}
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative',
              isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300',
            )}
            aria-label={item.label}
          >
            <div className="relative">
              <item.icon size={20} />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
