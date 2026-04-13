import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Database,
  Trash2,
  Tags,
  FolderCog,
  FileType,
  Settings,
} from 'lucide-react';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Workspace',
    items: [
      { to: '/', label: 'My Workspace', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { to: '/folder-types', label: 'Folder Types', icon: FolderCog },
      { to: '/document-types', label: 'Document Types', icon: FileType },
    ],
  },
  {
    title: 'Content',
    items: [
      { to: '/folders', label: 'Folders', icon: FolderOpen },
      { to: '/documents', label: 'Documents', icon: FileText },
      { to: '/tags', label: 'Tags', icon: Tags },
    ],
  },
  {
    title: 'Admin',
    items: [
      { to: '/bucket-manager', label: 'Bucket Manager', icon: Database },
      { to: '/trash', label: 'Trash', icon: Trash2 },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="text-white font-bold text-sm tracking-tight">TS</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white leading-tight">
              TeamSync <span className="text-blue-500">DMS</span>
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-500 leading-tight uppercase tracking-wider mt-0.5">
              Enterprise
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative',
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-blue-500" />
                      )}
                      <Icon size={16} className={clsx('shrink-0', isActive ? 'text-blue-500' : 'opacity-70 group-hover:opacity-100')} />
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>All systems operational</span>
        </div>
      </div>
    </aside>
  );
}
