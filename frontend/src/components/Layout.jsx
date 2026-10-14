import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/requisitions', label: 'Requisitions', icon: '📋' },
  { path: '/candidates', label: 'Candidates', icon: '👤' },
  { path: '/onboarding', label: 'Onboarding', icon: '✅' },
  { path: '/reports', label: 'Reports', icon: '📈' },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-navy text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold">
            <span className="text-gold">LCS</span> Defense
          </h1>
          <p className="text-sm text-white/60 mt-1">Recruiting Portal</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => {
            const active = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  active
                    ? 'bg-white/10 text-gold border-r-2 border-gold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs text-white/40">
          LCS Defense © 2024
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-light-gray">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
