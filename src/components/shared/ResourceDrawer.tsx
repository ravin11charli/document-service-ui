import { useEffect, useState, type ReactNode } from 'react';
import {
  X, MoreVertical, FileText, Folder, Info, Sparkles, History, RefreshCw, Download, Eye,
} from 'lucide-react';
import { useVersionsList, useRevertVersion } from '../../hooks/useVersions';
import { useDocumentDetail } from '../../hooks/useDocuments';
import { useFolderDetail } from '../../hooks/useFolders';
import { versionService } from '../../api/versionService';
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AttributesSection } from './AttributesSection';
import { TagList } from './TagPill';
import { FileViewer } from './FileViewer';
import { getResourceAttributes } from '../../utils/resourceAttributes';

type Kind = 'document' | 'folder';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Document or folder object */
  resource: any | null;
  kind: Kind;
  /** Right-click action items — same as the listing's context menu */
  contextMenuItems?: ContextMenuItem[];
  width?: number;
  /** Which tab to open initially. Defaults to 'details'. */
  initialTab?: TabId;
}

export type TabId = 'details' | 'preview' | 'attributes' | 'versions';

function getDocId(d: any): string | undefined {
  if (!d) return undefined;
  return d.id || d.documentId;
}

function getFolderId(f: any): string | undefined {
  return f?.folderId;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-sm text-right break-all min-w-0">{value || <span className="text-gray-400">—</span>}</span>
    </div>
  );
}

export function VersionsTab({ documentId }: { documentId: string }) {
  const { data, isLoading } = useVersionsList(documentId);
  const revertMut = useRevertVersion();
  const versions = data?.data || [];

  const handleDownload = async (versionId: string, fileName: string) => {
    try {
      const blob = await versionService.downloadVersion(documentId, versionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Version download failed', e);
    }
  };

  const handleRevert = (versionId: string) => {
    if (confirm('Revert to this version?')) {
      revertMut.mutate({ documentId, data: { versionId } });
    }
  };

  if (isLoading) return <LoadingSpinner className="py-10" />;
  if (versions.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic text-center py-8">
        No version history yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {versions.map((v) => (
        <div
          key={v.versionId}
          className="flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">v{v.versionCount}</p>
              {v.isLatest && <Badge variant="success">Latest</Badge>}
            </div>
            <p className="text-xs text-gray-500 truncate">{v.fileName}</p>
            <p className="text-[11px] text-gray-400">
              {v.displaySize} · {new Date(v.createdAt).toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400">by {v.editByDisplayName || v.createdBy}</p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={() => handleDownload(v.versionId, v.fileName)}
              className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Download"
            >
              <Download size={14} />
            </button>
            {!v.isLatest && (
              <button
                onClick={() => handleRevert(v.versionId)}
                className="p-1.5 rounded text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                title="Revert to this version"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocumentDetails({ doc }: { doc: any }) {
  return (
    <div className="space-y-1">
      <DetailRow label="Document ID" value={<span className="font-mono text-xs">{getDocId(doc)}</span>} />
      <DetailRow label="Extension" value={doc.extension?.toUpperCase()} />
      <DetailRow label="Size" value={doc.displaySize} />
      <DetailRow label="Owner" value={doc.ownedBy} />
      <DetailRow label="Folder" value={doc.folderId && <span className="font-mono text-xs">{doc.folderId}</span>} />
      <DetailRow label="Type" value={doc.documentType?.documentTypeName} />
      <DetailRow
        label="Tags"
        value={doc.tags?.length > 0 ? <TagList tags={doc.tags} size="sm" className="justify-end" /> : null}
      />
      <DetailRow label="Created" value={doc.createdAt && new Date(doc.createdAt).toLocaleString()} />
      <DetailRow label="Updated" value={doc.updatedAt && new Date(doc.updatedAt).toLocaleString()} />
    </div>
  );
}

export function FolderDetails({ folder }: { folder: any }) {
  return (
    <div className="space-y-1">
      <DetailRow label="Folder ID" value={<span className="font-mono text-xs">{getFolderId(folder)}</span>} />
      <DetailRow label="Type" value={folder.folderTypeName} />
      <DetailRow
        label="Lifecycle"
        value={folder.currentLifecycleState && <Badge variant="info">{folder.currentLifecycleState}</Badge>}
      />
      <DetailRow label="Items" value={folder.itemCount ?? 0} />
      <DetailRow label="Size" value={folder.displaySize} />
      <DetailRow label="Owner" value={folder.ownedBy} />
      <DetailRow
        label="Parent"
        value={folder.parentId && <span className="font-mono text-xs">{folder.parentId}</span>}
      />
      <DetailRow label="Created" value={folder.createdAt && new Date(folder.createdAt).toLocaleString()} />
      <DetailRow label="Updated" value={folder.updatedAt && new Date(folder.updatedAt).toLocaleString()} />
    </div>
  );
}

export function ResourceDrawer({
  open,
  onClose,
  resource,
  kind,
  contextMenuItems,
  width = 520,
  initialTab = 'details',
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [moreMenu, setMoreMenu] = useState<{ x: number; y: number } | null>(null);

  // Always refetch the live resource so we never display stale attributes/tags from listings
  const isDoc = kind === 'document';
  const incomingId = isDoc ? (resource?.id || resource?.documentId || '') : (resource?.folderId || '');
  const docDetailQuery = useDocumentDetail(open && isDoc ? incomingId : '');
  const folderDetailQuery = useFolderDetail(open && !isDoc ? incomingId : '');
  // Merge: prefer fresh server fields over the (possibly stale) listing object
  const live = isDoc
    ? (docDetailQuery.data?.data ? { ...resource, ...docDetailQuery.data.data } : resource)
    : (folderDetailQuery.data?.data ? { ...resource, ...folderDetailQuery.data.data } : resource);

  // Reset to the requested tab whenever the drawer opens or the resource changes
  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, resource, initialTab]);

  // Esc key closes drawer
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !resource) return null;

  const title = isDoc ? live.documentName : live.folderName;
  const subtitle = isDoc
    ? `Document · ${live.extension?.toUpperCase() || ''}`
    : 'Folder';
  const icon = isDoc ? (
    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <FileText className="text-blue-500" size={20} />
    </div>
  ) : (
    <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
      <Folder className="text-amber-500" size={20} />
    </div>
  );

  const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: 'details', label: 'Details', icon: <Info size={14} /> },
  ];
  if (isDoc) {
    tabs.push({ id: 'preview', label: 'Preview', icon: <Eye size={14} /> });
  }
  tabs.push({ id: 'attributes', label: 'Attributes', icon: <Sparkles size={14} /> });
  if (isDoc) {
    tabs.push({ id: 'versions', label: 'Version History', icon: <History size={14} /> });
  }

  const handleMoreClick = (e: React.MouseEvent) => {
    if (!contextMenuItems || contextMenuItems.length === 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMoreMenu({ x: rect.left - 200, y: rect.bottom + 4 });
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        style={{ width }}
        className="absolute right-0 top-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl animate-slide-right flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-gray-200 dark:border-gray-700">
          {icon}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate" title={title}>{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{subtitle}</p>
            {isDoc && live.tags?.length > 0 && (
              <div className="mt-2">
                <TagList tags={live.tags} size="sm" />
              </div>
            )}
            {!isDoc && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {live.currentLifecycleState && <Badge variant="info">{live.currentLifecycleState}</Badge>}
                {live.folderTypeName && <Badge>{live.folderTypeName}</Badge>}
              </div>
            )}
          </div>
          {contextMenuItems && contextMenuItems.length > 0 && (
            <button
              onClick={handleMoreClick}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 shrink-0"
              title="Actions"
            >
              <MoreVertical size={18} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-2 shrink-0">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`relative px-4 py-3 text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {t.icon}
                {t.label}
                {active && (
                  <span className="absolute left-2 right-2 bottom-0 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'details' && (
            isDoc ? <DocumentDetails doc={live} /> : <FolderDetails folder={live} />
          )}
          {activeTab === 'preview' && isDoc && getDocId(live) && (
            <FileViewer
              documentId={getDocId(live)!}
              fileName={live.documentName || ''}
              extension={live.extension}
            />
          )}
          {activeTab === 'attributes' && (() => {
            const derivedAttrs = getResourceAttributes(live, kind);
            const hasAttrs = Object.keys(derivedAttrs).length > 0;
            const schemaCount = isDoc
              ? live.documentType?.attributes?.length || 0
              : 0;
            if (!hasAttrs && schemaCount === 0) {
              return (
                <p className="text-sm text-gray-500 italic text-center py-6">
                  No attributes set. Right-click the {kind} in the list and choose "Edit Attributes" to add some.
                </p>
              );
            }
            return <AttributesSection resource={live} kind={kind} />;
          })()}
          {activeTab === 'versions' && isDoc && getDocId(live) && (
            <VersionsTab documentId={getDocId(live)!} />
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-2.5 text-[11px] text-gray-400 shrink-0">
          Tip: right-click the {kind} in the list for actions (open, edit, move, copy, delete…)
        </div>
      </aside>

      {/* Drawer's own context menu — fired by the "..." button */}
      {moreMenu && contextMenuItems && (
        <ContextMenu
          open={true}
          x={moreMenu.x}
          y={moreMenu.y}
          onClose={() => setMoreMenu(null)}
          items={contextMenuItems}
        />
      )}
    </div>
  );
}
