import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Home', path: '/dashboard', icon: '🏠' },
  { label: 'Results', path: '/results', icon: '📈' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/70 backdrop-blur-xl px-4 py-3">
      <div className="mx-auto flex max-w-5xl justify-between gap-2 flex-wrap">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex min-w-[70px] flex-col items-center justify-center rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] transition-colors ${
                isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <span className="text-xl">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
