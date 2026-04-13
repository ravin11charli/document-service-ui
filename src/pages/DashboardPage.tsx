import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder, FileText, Activity, Upload, Plus, ArrowLeft, Info, FolderOpen, FilePlus,
  Eye, Download, Tag, Edit2, Move, Copy, History, Trash2, Settings as SettingsIcon, ExternalLink,
} from 'lucide-react';
import { DocRowActions } from '../components/shared/DocRowActions';
import type { TabId } from '../components/shared/ResourceDrawer';
import { useMyDrive, useFolderContents } from '../hooks/useNavigation';
import { useFoldersList, useDeleteFolder } from '../hooks/useFolders';
import { useAllDocuments, useDeleteDocument } from '../hooks/useDocuments';
import { useConfigStore } from '../stores/configStore';
import { useUIStore } from '../stores/uiStore';
import { documentService } from '../api/documentService';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { ContextMenu, type ContextMenuItem } from '../components/ui/ContextMenu';
import { EditTagsModal } from '../components/shared/EditTagsModal';
import { EditAttributesModal } from '../components/shared/EditAttributesModal';
import { ResourceDrawer } from '../components/shared/ResourceDrawer';
import { TagList } from '../components/shared/TagPill';
import type { ResourceResponse, FolderResponse, DocumentResponse } from '../types/api';

function isFolder(r: ResourceResponse): r is FolderResponse & { resourceType?: string } {
  // Discriminator based on existing response shapes:
  //   - folders carry folderName / applicationName
  //   - documents carry documentName
  // Never use folderId — both DTOs serialize that property.
  const x = r as any;
  if (x.documentName !== undefined) return false;
  return x.folderName !== undefined || x.applicationName !== undefined;
}

function getDocId(d: any): string {
  return d.id || d.documentId;
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number | string; label: string; color: string }) {
  return (
    <div className="card-3d animate-fade-slide-up bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

type CtxState = { open: boolean; x: number; y: number; type: 'folder' | 'document'; data: any } | null;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { workspaceId, tenantId } = useConfigStore();
  const [page, setPage] = useState(0);
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string } | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const openNewDocument = useUIStore((s) => s.openNewDocument);

  // Context menu + drawer + tags + attributes modal state
  const [ctx, setCtx] = useState<CtxState>(null);
  const [drawerItem, setDrawerItem] = useState<{ type: 'folder' | 'document'; data: any } | null>(null);
  const [drawerTab, setDrawerTab] = useState<TabId>('details');
  const [tagsModal, setTagsModal] = useState<{ open: boolean; doc: any }>({ open: false, doc: null });
  const [attrsModal, setAttrsModal] = useState<{ open: boolean; kind: 'document' | 'folder'; data: any } | null>(null);

  const openDocDrawer = (doc: any, tab: TabId = 'details') => {
    setDrawerTab(tab);
    setDrawerItem({ type: 'document', data: doc });
  };

  const openFolderDrawer = (folder: any) => {
    setDrawerTab('details');
    setDrawerItem({ type: 'folder', data: folder });
  };

  const deleteDocument = useDeleteDocument();
  const deleteFolder = useDeleteFolder();

  // My Drive root
  const { data: driveData, isLoading: driveLoading } = useMyDrive(page, 25);
  // Folder drill-down
  const { data: folderData, isLoading: folderLoading } = useFolderContents(currentFolder?.id || '', page, 25);

  // Stats — totalDocs uses the new v1.0 /api/documents/all endpoint to count
  // ALL documents (root + nested) across the workspace, not just root items.
  const { data: allFoldersData } = useFoldersList(0, 1);
  const { data: allDocsData } = useAllDocuments(0, 1);
  const totalFolders = allFoldersData?.data?.totalElements || 0;
  const totalDocs = allDocsData?.data?.totalElements || 0;

  const activeData = currentFolder ? folderData : driveData;
  const isLoading = currentFolder ? folderLoading : driveLoading;
  const items: ResourceResponse[] = activeData?.data?.content || [];
  const totalPages = activeData?.data?.totalPages || 0;
  const totalElements = activeData?.data?.totalElements || 0;

  const folders = items.filter(isFolder);
  const documents = items.filter((r) => !isFolder(r)) as (DocumentResponse & { resourceType?: string })[];
  const lifecycleCount = folders.filter((f) => f.currentLifecycleState).length;

  const openFolder = (f: FolderResponse) => {
    const crumb = { id: f.folderId, name: f.folderName };
    if (currentFolder) setBreadcrumbs([...breadcrumbs, currentFolder]);
    setCurrentFolder(crumb);
    setPage(0);
  };

  const goBack = () => {
    if (breadcrumbs.length > 0) {
      const prev = breadcrumbs[breadcrumbs.length - 1];
      setBreadcrumbs(breadcrumbs.slice(0, -1));
      setCurrentFolder(prev);
    } else {
      setCurrentFolder(null);
    }
    setPage(0);
  };

  const goRoot = () => { setCurrentFolder(null); setBreadcrumbs([]); setPage(0); };

  const handleDownload = async (doc: any) => {
    try {
      const blob = await documentService.download(getDocId(doc));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.documentName || 'download';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  // Right-click handlers
  const onFolderContextMenu = (e: React.MouseEvent, folder: any) => {
    e.preventDefault();
    setCtx({ open: true, x: e.clientX, y: e.clientY, type: 'folder', data: folder });
  };
  const onDocContextMenu = (e: React.MouseEvent, doc: any) => {
    e.preventDefault();
    setCtx({ open: true, x: e.clientX, y: e.clientY, type: 'document', data: doc });
  };

  // Build context menu items
  const folderMenu = (folder: any): ContextMenuItem[] => [
    { label: 'Open', icon: <ExternalLink size={14} />, onClick: () => openFolder(folder) },
    { label: 'View Details', icon: <Info size={14} />, onClick: () => openFolderDrawer(folder) },
    { label: 'Edit Attributes', icon: <Edit2 size={14} />, onClick: () => setAttrsModal({ open: true, kind: 'folder', data: folder }) },
    { label: 'Manage', icon: <SettingsIcon size={14} />, onClick: () => navigate(`/folders/${folder.folderId}`) },
    { label: 'Delete', icon: <Trash2 size={14} />, danger: true, divider: true, onClick: () => {
      if (confirm(`Delete folder "${folder.folderName}"?`)) deleteFolder.mutate(folder.folderId);
    }},
  ];

  const documentMenu = (doc: any): ContextMenuItem[] => [
    { label: 'Preview', icon: <Eye size={14} />, onClick: () => openDocDrawer(doc, 'preview') },
    { label: 'View Details', icon: <Info size={14} />, onClick: () => openDocDrawer(doc, 'details') },
    { label: 'Download', icon: <Download size={14} />, onClick: () => handleDownload(doc) },
    { label: 'Add / Edit Tags', icon: <Tag size={14} />, divider: true, onClick: () => setTagsModal({ open: true, doc }) },
    { label: 'Edit Attributes', icon: <Edit2 size={14} />, onClick: () => setAttrsModal({ open: true, kind: 'document', data: doc }) },
    { label: 'Move', icon: <Move size={14} />, onClick: () => openDocDrawer(doc, 'details') },
    { label: 'Copy', icon: <Copy size={14} />, onClick: () => openDocDrawer(doc, 'details') },
    { label: 'New Version', icon: <History size={14} />, onClick: () => openDocDrawer(doc, 'versions') },
    { label: 'Delete', icon: <Trash2 size={14} />, danger: true, divider: true, onClick: () => {
      if (confirm(`Move "${doc.documentName}" to trash?`)) deleteDocument.mutate(getDocId(doc));
    }},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="text-blue-500" size={28} />
            My Workspace
          </h1>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <Info size={12} />
            <span>Tenant: {tenantId} · Workspace: {workspaceId}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => openNewDocument(currentFolder?.id)} icon={<FilePlus size={16} />}>New Document</Button>
          <Button size="sm" onClick={() => navigate(currentFolder ? `/upload?folderId=${currentFolder.id}` : '/upload')} icon={<Upload size={16} />}>Upload</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/folders')} icon={<Plus size={16} />}>New Folder</Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Folder className="text-blue-600 dark:text-blue-400" size={24} />} value={totalFolders} label="Total Folders" color="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard icon={<FileText className="text-green-600 dark:text-green-400" size={24} />} value={totalDocs} label="Total Documents" color="bg-green-100 dark:bg-green-900/30" />
        <StatCard icon={<Activity className="text-purple-600 dark:text-purple-400" size={24} />} value={lifecycleCount} label="With Lifecycle" color="bg-purple-100 dark:bg-purple-900/30" />
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {currentFolder && <Button variant="ghost" size="sm" onClick={goBack} icon={<ArrowLeft size={14} />}>Back</Button>}
        <button onClick={goRoot} className="text-blue-500 hover:underline font-medium">My Workspace</button>
        {breadcrumbs.map((b) => (
          <span key={b.id} className="flex items-center gap-1">
            <span className="text-gray-400">/</span>
            <button onClick={() => {
              const idx = breadcrumbs.findIndex((x) => x.id === b.id);
              setCurrentFolder(b);
              setBreadcrumbs(breadcrumbs.slice(0, idx));
              setPage(0);
            }} className="text-blue-500 hover:underline">{b.name}</button>
          </span>
        ))}
        {currentFolder && (
          <span className="flex items-center gap-1">
            <span className="text-gray-400">/</span>
            <span className="font-semibold">{currentFolder.name}</span>
          </span>
        )}
      </div>

      {/* Hint */}
      <p className="text-[11px] text-gray-400 -mt-2">Tip: right-click a folder or document for quick actions</p>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : items.length === 0 ? (
        <EmptyState title={currentFolder ? 'This folder is empty' : 'Your workspace is empty'} description="Upload documents or create folders to get started" />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Folders */}
          {folders.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Folders <span className="text-gray-400 font-normal normal-case ml-1">({folders.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger-children">
                {folders.map((folder) => (
                  <div
                    key={folder.folderId}
                    className="card-3d animate-fade-slide-up bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer group hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    onDoubleClick={() => openFolder(folder)}
                    onClick={() => openFolder(folder)}
                    onContextMenu={(e) => onFolderContextMenu(e, folder)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors shrink-0">
                        <Folder className="text-amber-500" size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate" title={folder.folderName}>{folder.folderName || '(unnamed)'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{folder.itemCount || 0} items</p>
                      </div>
                    </div>
                    {(folder.currentLifecycleState || folder.folderTypeName) && (
                      <div className="flex gap-1.5 mt-2.5 flex-wrap">
                        {folder.currentLifecycleState && <Badge variant="info">{folder.currentLifecycleState}</Badge>}
                        {folder.folderTypeName && <Badge variant="default">{folder.folderTypeName}</Badge>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Documents <span className="text-gray-400 font-normal normal-case ml-1">({documents.length})</span>
              </h3>
              <div className="space-y-1 stagger-children">
                {documents.map((doc) => (
                  <div
                    key={getDocId(doc)}
                    className="card-3d animate-fade-slide-up flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 cursor-pointer group hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    onClick={() => openDocDrawer(doc, 'details')}
                    onContextMenu={(e) => onDocContextMenu(e, doc)}
                  >
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
                      <FileText className="text-blue-500" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={(doc as any).documentName}>{(doc as any).documentName || '(unnamed)'}</p>
                      <p className="text-xs text-gray-400">
                        {(doc as any).extension?.toUpperCase()} · {(doc as any).displaySize}
                      </p>
                    </div>
                    <div className="hidden md:flex shrink-0 max-w-[220px] overflow-hidden">
                      <TagList tags={(doc as any).tags} max={2} />
                    </div>
                    <DocRowActions
                      onPreview={() => openDocDrawer(doc, 'preview')}
                      onDetails={() => openDocDrawer(doc, 'details')}
                      onDownload={() => handleDownload(doc)}
                    />
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">
                      {new Date((doc as any).createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />
        </div>
      )}

      {/* Context Menu */}
      <ContextMenu
        open={!!ctx?.open}
        x={ctx?.x || 0}
        y={ctx?.y || 0}
        onClose={() => setCtx(null)}
        items={ctx?.type === 'folder' ? folderMenu(ctx.data) : ctx?.data ? documentMenu(ctx.data) : []}
      />

      {/* Resource Drawer (tabbed) — opens for both folders and documents */}
      <ResourceDrawer
        open={!!drawerItem}
        onClose={() => setDrawerItem(null)}
        resource={drawerItem?.data || null}
        kind={drawerItem?.type === 'folder' ? 'folder' : 'document'}
        initialTab={drawerTab}
        contextMenuItems={
          drawerItem?.type === 'folder'
            ? folderMenu(drawerItem.data)
            : drawerItem?.data
              ? documentMenu(drawerItem.data)
              : []
        }
      />

      {/* Edit Attributes Modal */}
      {attrsModal?.data && (
        <EditAttributesModal
          open={attrsModal.open}
          onClose={() => setAttrsModal(null)}
          kind={attrsModal.kind}
          resourceId={attrsModal.kind === 'document' ? getDocId(attrsModal.data) : attrsModal.data.folderId}
          resourceName={attrsModal.kind === 'document' ? attrsModal.data.documentName : attrsModal.data.folderName}
          typeId={attrsModal.kind === 'document' ? attrsModal.data.documentType?.id : attrsModal.data.folderTypeId}
          schemaOverride={attrsModal.kind === 'document' ? attrsModal.data.documentType?.attributes : undefined}
          currentAttributes={attrsModal.data.attributes}
        />
      )}

      {/* Edit Tags Modal */}
      {tagsModal.doc && (
        <EditTagsModal
          open={tagsModal.open}
          onClose={() => setTagsModal({ open: false, doc: null })}
          documentId={getDocId(tagsModal.doc)}
          documentName={tagsModal.doc.documentName}
          initialTags={tagsModal.doc.tags || []}
        />
      )}

    </div>
  );
}
