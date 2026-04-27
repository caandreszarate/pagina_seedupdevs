import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Usuarios' },
  { href: '/admin/feedback', label: 'Feedback' },
  { href: '/admin/learning-paths', label: 'Contenido' },
  { href: '/admin/teams', label: 'Equipos' },
  { href: '/admin/community', label: 'Comunidad' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen" style={{ background: '#05070D' }}>
        <header
          className="sticky top-0 z-20 border-b border-white/5 px-4 py-3"
          style={{ background: 'rgba(5,7,13,0.95)', backdropFilter: 'blur(12px)' }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-xs font-mono uppercase tracking-widest text-[#00E0FF]">
                Admin
              </span>
              <nav className="flex items-center gap-4">
                {NAV.map(n => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="text-sm text-slate-500 hover:text-slate-200 transition-colors"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
            <Link
              href="/"
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              ← Sitio
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </div>
    </AdminGuard>
  );
}
