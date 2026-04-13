import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText, Info, Search, FilePlus, Upload, Filter, X,
  Eye, Download, Tag, Edit2, Move, Copy, History, Trash2,
} from 'lucide-react';
import { useConfigStore } from '../stores/configStore';
import { useUIStore } from '../stores/uiStore';
import { useDocumentsList, useAllDocuments, useDeleteDocument } from '../hooks/useDocuments';
import { documentService } from '../api/documentService';
import { Pagination } from '../components/ui/Pagination';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ContextMenu, type ContextMenuItem } from '../components/ui/ContextMenu';
import { EditTagsModal } from '../components/shared/EditTagsModal';
import { EditAttributesModal } from '../components/shared/EditAttributesModal';
import { ResourceDrawer, type TabId } from '../components/shared/ResourceDrawer';
import { TagList } from '../components/shared/TagPill';
import { DocRowActions } from '../components/shared/DocRowActions';

function getDocId(d: any): string {
  return d.id || d.documentId;
}

function DocumentsHeader() {
  const { tenantId, workspaceId } = useConfigStore();
  return (
    <div className="flex items-center gap-2">
      <FileText className="text-blue-500" size={28} />
      <h1 className="text-2xl font-bold">All Documents</h1>
      <span className="group relative">
        <Info size={16} className="text-gray-400 cursor-help" />
        <span className="invisible group-hover:visible absolute left-6 top-0 z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          All documents across tenant <b>{tenantId}</b> · workspace <b>{workspaceId}</b>
        </span>
      </span>
    </div>
  );
}

type CtxState = { open: boolean; x: number; y: number; data: any } | null;

export default function DocumentsPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [folderId, setFolderId] = useState(searchParams.get('folderId') || '');
  const [filterInput, setFilterInput] = useState(folderId);
  const [filterOpen, setFilterOpen] = useState(!!folderId);
  const navigate = useNavigate();

  const [nameSearch, setNameSearch] = useState('');
  const openNewDocument = useUIStore((s) => s.openNewDocument);

  // Right-click menu + drawer + tags + attributes state
  const [ctx, setCtx] = useState<CtxState>(null);
  const [drawerDoc, setDrawerDoc] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<TabId>('details');
  const [tagsModal, setTagsModal] = useState<{ open: boolean; doc: any }>({ open: false, doc: null });
  const [attrsModal, setAttrsModal] = useState<{ open: boolean; doc: any }>({ open: false, doc: null });

  const openDrawer = (doc: any, tab: TabId = 'details') => {
    setDrawerTab(tab);
    setDrawerDoc(doc);
  };

  const deleteDocument = useDeleteDocument();

  // When no folder filter: use the v1.0 "all documents" endpoint (root + nested).
  // When filtering by folder: fall back to the regular list endpoint.
  const allQuery = useAllDocuments(page, 25);
  const folderQuery = useDocumentsList(folderId || undefined, page, 25);
  const data = folderId ? folderQuery.data : allQuery.data;
  const isLoading = folderId ? folderQuery.isLoading : allQuery.isLoading;
  const allDocs = data?.data?.content || [];
  const documents = allDocs.filter((d) => d.documentName.toLowerCase().includes(nameSearch.toLowerCase()));
  const totalPages = data?.data?.totalPages || 0;
  const totalElements = data?.data?.totalElements || 0;

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

  const onDocContextMenu = (e: React.MouseEvent, doc: any) => {
    e.preventDefault();
    setCtx({ open: true, x: e.clientX, y: e.clientY, data: doc });
  };

  const documentMenu = (doc: any): ContextMenuItem[] => [
    { label: 'Preview', icon: <Eye size={14} />, onClick: () => openDrawer(doc, 'preview') },
    { label: 'View Details', icon: <Info size={14} />, onClick: () => openDrawer(doc, 'details') },
    { label: 'Download', icon: <Download size={14} />, onClick: () => handleDownload(doc) },
    { label: 'Add / Edit Tags', icon: <Tag size={14} />, divider: true, onClick: () => setTagsModal({ open: true, doc }) },
    { label: 'Edit Attributes', icon: <Edit2 size={14} />, onClick: () => setAttrsModal({ open: true, doc }) },
    { label: 'Move', icon: <Move size={14} />, onClick: () => openDrawer(doc, 'details') },
    { label: 'Copy', icon: <Copy size={14} />, onClick: () => openDrawer(doc, 'details') },
    { label: 'New Version', icon: <History size={14} />, onClick: () => openDrawer(doc, 'versions') },
    { label: 'Delete', icon: <Trash2 size={14} />, danger: true, divider: true, onClick: () => {
      if (confirm(`Move "${doc.documentName}" to trash?`)) deleteDocument.mutate(getDocId(doc));
    }},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <DocumentsHeader />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalElements} document{totalElements !== 1 ? 's' : ''} total
            {folderId && <span className="ml-1">· filtered by folder</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/upload')} icon={<Upload size={16} />}>Upload</Button>
          <Button size="sm" variant="secondary" onClick={() => openNewDocument()} icon={<FilePlus size={16} />}>New Document</Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents by name..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>
        <Button
          size="sm"
          variant={filterOpen ? 'primary' : 'secondary'}
          onClick={() => setFilterOpen(!filterOpen)}
          icon={<Filter size={16} />}
        >
          Filter
        </Button>
      </div>

      {filterOpen && (
        <div className="animate-fade-slide-up flex gap-2 items-end p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <Input
              label="Folder ID"
              placeholder="Filter by folder ID..."
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setFolderId(filterInput); setPage(0); }}>Apply</Button>
          {folderId && (
            <Button variant="ghost" size="sm" onClick={() => { setFolderId(''); setFilterInput(''); setPage(0); }} icon={<X size={14} />}>
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Hint */}
      <p className="text-[11px] text-gray-400 -mt-2">Tip: right-click a document for quick actions</p>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : documents.length === 0 ? (
        <EmptyState title="No documents found" description={folderId ? 'No documents in this folder' : 'Upload your first document or create from template'} />
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1 stagger-children">
            {documents.map((doc) => (
              <div
                key={getDocId(doc)}
                onClick={() => openDrawer(doc, 'details')}
                onContextMenu={(e) => onDocContextMenu(e, doc)}
                className="card-3d animate-fade-slide-up flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 cursor-pointer group hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
                  <FileText className="text-blue-500" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" title={doc.documentName}>{doc.documentName || '(unnamed)'}</p>
                  <p className="text-xs text-gray-400">
                    {doc.extension?.toUpperCase()} &middot; {doc.displaySize} &middot; {doc.folderId ? `Folder: ${doc.folderId.slice(0, 8)}...` : 'Root'}
                  </p>
                </div>
                <div className="hidden md:flex shrink-0 max-w-[220px]">
                  <TagList tags={doc.tags} max={2} />
                </div>
                <DocRowActions
                  onPreview={() => openDrawer(doc, 'preview')}
                  onDetails={() => openDrawer(doc, 'details')}
                  onDownload={() => handleDownload(doc)}
                />
                <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />
        </div>
      )}

      {/* Context Menu */}
      <ContextMenu
        open={!!ctx?.open}
        x={ctx?.x || 0}
        y={ctx?.y || 0}
        onClose={() => setCtx(null)}
        items={ctx?.data ? documentMenu(ctx.data) : []}
      />

      {/* Resource Drawer (tabbed) */}
      <ResourceDrawer
        open={!!drawerDoc}
        onClose={() => setDrawerDoc(null)}
        resource={drawerDoc}
        kind="document"
        initialTab={drawerTab}
        contextMenuItems={drawerDoc ? documentMenu(drawerDoc) : []}
      />

      {/* Edit Attributes Modal */}
      {attrsModal.doc && (
        <EditAttributesModal
          open={attrsModal.open}
          onClose={() => setAttrsModal({ open: false, doc: null })}
          kind="document"
          resourceId={getDocId(attrsModal.doc)}
          resourceName={attrsModal.doc.documentName}
          typeId={attrsModal.doc.documentType?.id}
          schemaOverride={attrsModal.doc.documentType?.attributes}
          currentAttributes={attrsModal.doc.attributes}
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
