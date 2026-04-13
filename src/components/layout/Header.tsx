import { Moon, Sun, Search, Upload, FilePlus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useConfigStore } from '../../stores/configStore';
import { useUIStore } from '../../stores/uiStore';

export function Header() {
  const { theme, toggleTheme, tenantId } = useConfigStore();
  const openNewDocument = useUIStore((s) => s.openNewDocument);

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <NavLink
          to="/search"
          className={({ isActive }) =>
            clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors',
              isActive
                ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )
          }
        >
          <Search size={15} />
          <span>Search</span>
        </NavLink>
        <button
          type="button"
          onClick={() => openNewDocument()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <FilePlus size={15} />
          <span>New</span>
        </button>
        <NavLink
          to="/upload"
          className={({ isActive }) =>
            clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors',
              isActive
                ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-500/20'
            )
          }
        >
          <Upload size={15} />
          <span>Upload</span>
        </NavLink>
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-2" />
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          Tenant: <span className="text-gray-700 dark:text-gray-300">{tenantId}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
