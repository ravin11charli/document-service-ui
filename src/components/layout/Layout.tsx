import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UploadDock } from '../upload/UploadDock';
import { CreateFromTemplateModal } from '../shared/CreateFromTemplateModal';
import { useUIStore } from '../../stores/uiStore';

export function Layout() {
  const newDocumentOpen = useUIStore((s) => s.newDocumentOpen);
  const newDocumentDefaultFolderId = useUIStore((s) => s.newDocumentDefaultFolderId);
  const closeNewDocument = useUIStore((s) => s.closeNewDocument);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <UploadDock />

      {/* Globally-mounted "Create New Document" modal — triggered from header,
          dashboard, folder detail and documents pages via the UI store. */}
      <CreateFromTemplateModal
        open={newDocumentOpen}
        onClose={closeNewDocument}
        defaultFolderId={newDocumentDefaultFolderId || undefined}
      />
    </div>
  );
}
