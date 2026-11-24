import React from 'react';
import { NavLink } from 'react-router-dom';
import { ScrollText, ShieldCheck, Users } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  description: string;
}

const tabs = [
  { to: '/admin/auditoria', label: 'Auditoria', icon: ScrollText },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
];

/** Title and tabs shared by the super admin screens. */
export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, description }) => (
  <div className="mb-6">
    <div className="flex flex-wrap items-center gap-3">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/10 to-brand-500/10 text-brand-700 border border-brand-200">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
        Super Admin
      </span>
    </div>
    <p className="text-sm text-slate-500 mt-1">{description}</p>

    <nav className="mt-5 flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit" aria-label="Administração">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              isActive ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`
          }
        >
          <Icon className="w-4 h-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  </div>
);
