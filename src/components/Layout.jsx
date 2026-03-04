import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Upload, RotateCcw, Home } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Topics', icon: Home },
    { to: '/upload', label: 'Upload', icon: Upload },
    { to: '/review', label: 'Review Due', icon: RotateCcw },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-bold text-blue-600 text-lg">
            <BookOpen size={22} />
            StudyTracker
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
