import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Upload, Edit2, Trash2, FolderOpen, Activity, Database, Wand2,
  Eye, Download, Tag, Move, Copy, History, Info, X, CheckSquare, FilePlus,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../stores/uiStore';
import { useFolderDetail, useFolderChildren, useDeleteFolder, useUpdateFolder } from '../hooks/useFolders';
import { useFolderTypeDetail, useFolderTypesList } from '../hooks/useFolderTypes';
import { useDeleteDocument } from '../hooks/useDocuments';
import { usePolicyByFolderType, useUpdatePolicy, useDeletePolicy } from '../hooks/useBucketManager';
import { ltiService } from '../api/ltiService';
import { documentService } from '../api/documentService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ContextMenu, type ContextMenuItem } from '../components/ui/ContextMenu';
import { DynamicAttributeForm, validateAttributes } from '../components/shared/DynamicAttributeForm';
import { EditTagsModal } from '../components/shared/EditTagsModal';
import { EditAttributesModal } from '../components/shared/EditAttributesModal';
import { ResourceDrawer, type TabId } from '../components/shared/ResourceDrawer';
import { TagList } from '../components/shared/TagPill';
import { DocRowActions } from '../components/shared/DocRowActions';
import type { UpdateFolderRequest, UpdateFolderByAttributeRequest } from '../types/api';
import toast from 'react-hot-toast';

type DocCtxState = { open: boolean; x: number; y: number; data: any } | null;

export default function FolderDetailPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const { data: folderData, isLoading: folderLoading, refetch } = useFolderDetail(folderId!);
  const { data: childrenData, isLoading: childrenLoading } = useFolderChildren(folderId!, page, 25);
  const folder = folderData?.data;

  // Selected folder type for the edit modal (may differ from folder's current type when changing)
  const [selectedFolderTypeId, setSelectedFolderTypeId] = useState<string>('');
  const { data: folderTypeData } = useFolderTypeDetail(selectedFolderTypeId || folder?.folderTypeId || '');
  const folderType = folderTypeData?.data;
  const { data: allTypes } = useFolderTypesList(0, 100);

  // Bucket policy attached to this folder's folder type
  const { data: policyData } = usePolicyByFolderType(folder?.folderTypeId || '');
  const policy = policyData?.data;
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();

  const deleteFolder = useDeleteFolder();
  const updateFolder = useUpdateFolder();
  const openNewDocument = useUIStore((s) => s.openNewDocument);

  const documents = childrenData?.data?.content || [];
  const totalPages = childrenData?.data?.totalPages || 0;

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [attrErrors, setAttrErrors] = useState<Record<string, string>>({});

  // Lifecycle modal
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const [newLifecycle, setNewLifecycle] = useState('');

  // ── Document right-click + multi-select state ──
  const queryClient = useQueryClient();
  const deleteDocument = useDeleteDocument();
  const [docCtx, setDocCtx] = useState<DocCtxState>(null);
  const [drawerDoc, setDrawerDoc] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<TabId>('details');
  const [tagsModal, setTagsModal] = useState<{ open: boolean; doc: any }>({ open: false, doc: null });
  const [attrsModal, setAttrsModal] = useState<{ open: boolean; doc: any }>({ open: false, doc: null });

  const openDrawer = (doc: any, tab: TabId = 'details') => {
    setDrawerTab(tab);
    setDrawerDoc(doc);
  };
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<null | 'move' | 'copy'>(null);
  const [bulkTarget, setBulkTarget] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  // LTI update-by-attribute modal
  const [ltiOpen, setLtiOpen] = useState(false);
  const [ltiForm, setLtiForm] = useState<UpdateFolderByAttributeRequest>({
    searchAttributeName: '',
    searchAttributeValue: '',
    newAttributeName: '',
    newAttributeValue: '',
    newLifecycleState: '',
  });
  const [ltiLoading, setLtiLoading] = useState(false);

  useEffect(() => {
    if (folder) {
      setEditName(folder.folderName);
      setSelectedFolderTypeId(folder.folderTypeId || '');
      setNewLifecycle(folder.currentLifecycleState || '');
    }
  }, [folder]);

  // When opening edit OR switching folder type, prefill schema-driven attribute values
  useEffect(() => {
    if (!editOpen || !folder) return;
    const existing: Record<string, string> = {};
    Object.entries(folder.attributes || {}).forEach(([k, v]) => {
      existing[k] = v == null ? '' : String(v);
    });

    if (folderType?.attributes?.length) {
      const schemaValues: Record<string, string> = {};
      folderType.attributes.forEach((a) => {
        schemaValues[a.attributeName] = existing[a.attributeName] || '';
      });
      setAttrValues(schemaValues);
    } else {
      setAttrValues({});
    }
    setAttrErrors({});
  }, [editOpen, folderType, folder]);

  const handleDelete = () => {
    if (confirm('Delete this folder?')) {
      deleteFolder.mutate(folderId!, { onSuccess: () => navigate(-1) });
    }
  };

  const handleEditSubmit = () => {
    if (folderType?.attributes?.length) {
      const errors = validateAttributes(folderType.attributes, attrValues);
      if (Object.keys(errors).length > 0) {
        setAttrErrors(errors);
        return;
      }
    }

    const payload: UpdateFolderRequest = {
      folderName: editName,
    };
    if (folderType?.attributes?.length) {
      payload.attributes = attrValues;
    }
    if (selectedFolderTypeId && selectedFolderTypeId !== folder?.folderTypeId) {
      payload.folderTypeId = selectedFolderTypeId;
    }
    updateFolder.mutate({ id: folderId!, data: payload }, {
      onSuccess: () => { setEditOpen(false); refetch(); },
    });
  };

  const handleLifecycleSubmit = () => {
    updateFolder.mutate(
      { id: folderId!, data: { currentLifecycleState: newLifecycle } },
      { onSuccess: () => { setLifecycleOpen(false); refetch(); } }
    );
  };

  const handleLtiSubmit = async () => {
    setLtiLoading(true);
    try {
      await ltiService.updateFolderByAttribute(ltiForm);
      toast.success('Folder updated via attribute lookup');
      setLtiOpen(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'LTI update failed');
    } finally {
      setLtiLoading(false);
    }
  };

  const togglePolicy = () => {
    if (!policy) return;
    updatePolicy.mutate({ id: policy.storagePolicyId, data: { enabled: !policy.enabled } });
  };

  const removePolicy = () => {
    if (!policy) return;
    if (confirm('Remove this storage policy?')) {
      deletePolicy.mutate(policy.storagePolicyId);
    }
  };

  // ── Document helpers ──
  const getDocId = (d: any): string => d.id || d.documentId;

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
    setDocCtx({ open: true, x: e.clientX, y: e.clientY, data: doc });
  };

  const documentMenu = (doc: any): ContextMenuItem[] => [
    { label: 'Preview', icon: <Eye size={14} />, onClick: () => openDrawer(doc, 'preview') },
    { label: 'View Details', icon: <Info size={14} />, onClick: () => openDrawer(doc, 'details') },
    { label: 'Download', icon: <Download size={14} />, onClick: () => handleDownload(doc) },
    { label: 'Add / Edit Tags', icon: <Tag size={14} />, divider: true, onClick: () => setTagsModal({ open: true, doc }) },
    { label: 'Edit Attributes', icon: <Edit2 size={14} />, onClick: () => setAttrsModal({ open: true, doc }) },
    { label: 'Move', icon: <Move size={14} />, onClick: () => { setSelectedIds(new Set([getDocId(doc)])); setBulkAction('move'); } },
    { label: 'Copy', icon: <Copy size={14} />, onClick: () => { setSelectedIds(new Set([getDocId(doc)])); setBulkAction('copy'); } },
    { label: 'New Version', icon: <History size={14} />, onClick: () => openDrawer(doc, 'versions') },
    { label: 'Delete', icon: <Trash2 size={14} />, danger: true, divider: true, onClick: () => {
      if (confirm(`Move "${doc.documentName}" to trash?`)) deleteDocument.mutate(getDocId(doc));
    }},
  ];

  // ── Multi-select helpers ──
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length && documents.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const invalidateDocs = () => {
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Move ${selectedIds.size} document(s) to trash?`)) return;
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(ids.map((id) => documentService.delete(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkBusy(false);
    if (failed === 0) toast.success(`${ids.length} document(s) moved to trash`);
    else toast.error(`${ids.length - failed} succeeded, ${failed} failed`);
    clearSelection();
    invalidateDocs();
  };

  const handleBulkMoveOrCopy = async () => {
    if (selectedIds.size === 0 || !bulkTarget.trim()) return;
    const target = bulkTarget.trim();
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    const op = bulkAction;
    const results = await Promise.allSettled(
      ids.map((id) =>
        op === 'move'
          ? documentService.update(id, { parentId: target })
          : documentService.copy(id, { targetParentId: target })
      )
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkBusy(false);
    const verb = op === 'move' ? 'moved' : 'copied';
    if (failed === 0) toast.success(`${ids.length} document(s) ${verb}`);
    else toast.error(`${ids.length - failed} ${verb}, ${failed} failed`);
    setBulkAction(null);
    setBulkTarget('');
    clearSelection();
    invalidateDocs();
  };

  // Reset selection when documents page changes
  useEffect(() => { setSelectedIds(new Set()); }, [page, folderId]);

  if (folderLoading) return <LoadingSpinner className="py-20" />;
  if (!folder) return <div className="text-center py-20 text-gray-500">Folder not found</div>;

  const allSelected = documents.length > 0 && selectedIds.size === documents.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={18} />}>Back</Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FolderOpen className="text-amber-500" size={24} />
            <h1 className="text-2xl font-bold">{folder.folderName}</h1>
          </div>
          <div className="flex gap-2 mt-2 items-center flex-wrap">
            {folder.currentLifecycleState && <Badge variant="info">{folder.currentLifecycleState}</Badge>}
            {folder.folderTypeName && <Badge>{folder.folderTypeName}</Badge>}
            <span className="text-xs text-gray-500">{folder.displaySize} &middot; {folder.itemCount} items</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setLifecycleOpen(true)} icon={<Activity size={16} />}>Lifecycle</Button>
          <Button variant="secondary" size="sm" onClick={() => setLtiOpen(true)} icon={<Wand2 size={16} />}>LTI Update</Button>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)} icon={<Edit2 size={16} />}>Edit</Button>
          <Button variant="secondary" size="sm" onClick={() => openNewDocument(folderId)} icon={<FilePlus size={16} />}>New Document</Button>
          <Button variant="primary" size="sm" onClick={() => navigate(`/upload?folderId=${folderId}`)} icon={<Upload size={16} />}>Upload</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} icon={<Trash2 size={16} />} loading={deleteFolder.isPending}>Delete</Button>
        </div>
      </div>

      {/* Bucket Policy */}
      {policy ? (
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Database className="text-purple-500" size={20} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Storage Policy</h3>
                  <Badge variant={policy.enabled ? 'success' : 'default'}>{policy.enabled ? 'Active' : 'Disabled'}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Trigger: <span className="font-mono">{policy.triggerLifecycleState}</span> &rarr; Bucket: <span className="font-mono">{policy.targetBucket}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={togglePolicy} loading={updatePolicy.isPending}>
                {policy.enabled ? 'Disable' : 'Activate'}
              </Button>
              <Button size="sm" variant="danger" onClick={removePolicy} loading={deletePolicy.isPending}>Remove</Button>
            </div>
          </div>
        </Card>
      ) : folder.folderTypeId ? (
        <Card className="p-3 border border-dashed">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Database size={14} /> No storage policy attached to this folder type.
            <button className="text-blue-500 hover:underline" onClick={() => navigate('/bucket-manager')}>Create one</button>
          </p>
        </Card>
      ) : null}

      {/* Attributes display */}
      {folder.attributes && Object.keys(folder.attributes).length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Attributes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(folder.attributes).map(([k, v]) => (
              <div key={k} className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">{k}:</span>{' '}
                <span className="font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Documents</h2>
            {documents.length > 0 && (
              <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500/30"
                />
                {allSelected ? 'Deselect all' : 'Select all'}
              </label>
            )}
          </div>
          <p className="text-[11px] text-gray-400">Tip: right-click for actions · Shift-click checkboxes for multi-select</p>
        </div>

        {/* Bulk action toolbar */}
        {someSelected && (
          <div className="sticky top-0 z-20 mb-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-3 animate-fade-slide-up shadow-sm">
            <div className="flex items-center gap-2 text-sm">
              <CheckSquare size={16} className="text-blue-500" />
              <span className="font-medium text-blue-700 dark:text-blue-300">{selectedIds.size} selected</span>
              <button onClick={clearSelection} className="text-xs text-blue-500 hover:underline ml-1">Clear</button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setBulkAction('move'); setBulkTarget(''); }} icon={<Move size={14} />} disabled={bulkBusy}>
                Move
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setBulkAction('copy'); setBulkTarget(''); }} icon={<Copy size={14} />} disabled={bulkBusy}>
                Copy
              </Button>
              <Button size="sm" variant="danger" onClick={handleBulkDelete} icon={<Trash2 size={14} />} loading={bulkBusy}>
                Delete
              </Button>
            </div>
          </div>
        )}

        {childrenLoading ? (
          <LoadingSpinner />
        ) : documents.length === 0 ? (
          <EmptyState title="No documents" description="Upload documents to this folder" />
        ) : (
          <>
            <div className="space-y-2">
              {documents.map((doc) => {
                const id = doc.id;
                const checked = selectedIds.has(id);
                return (
                  <div
                    key={id}
                    onContextMenu={(e) => onDocContextMenu(e, doc)}
                    className={`group relative flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                      checked
                        ? 'border-blue-400 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                    onClick={(e) => {
                      // If any selection is active, click toggles selection; otherwise open the drawer
                      if (someSelected) {
                        e.preventDefault();
                        toggleSelect(id);
                      } else {
                        openDrawer(doc, 'details');
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelect(id)}
                      className={`w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500/30 transition-opacity ${
                        checked || someSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    />
                    <FileText className="text-blue-500 shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.documentName}</p>
                      <p className="text-xs text-gray-500">{doc.extension?.toUpperCase()} &middot; {doc.displaySize}</p>
                    </div>
                    <div className="hidden md:flex shrink-0 max-w-[220px]">
                      <TagList tags={doc.tags} max={3} />
                    </div>
                    <DocRowActions
                      onPreview={() => openDrawer(doc, 'preview')}
                      onDetails={() => openDrawer(doc, 'details')}
                      onDownload={() => handleDownload(doc)}
                    />
                    <span className="text-xs text-gray-400 hidden sm:inline">{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Folder" size="lg">
        <div className="space-y-4">
          <Input label="Folder Name" required value={editName} onChange={(e) => setEditName(e.target.value)} />

          <Select
            label="Folder Type"
            value={selectedFolderTypeId}
            onChange={(e) => setSelectedFolderTypeId(e.target.value)}
            options={(allTypes?.data?.content || []).map((t) => ({ value: t.folderTypeId, label: t.folderTypeName }))}
            placeholder="None"
          />
          {selectedFolderTypeId && selectedFolderTypeId !== folder.folderTypeId && (
            <p className="text-xs text-amber-600">Changing folder type will replace the schema-driven attributes.</p>
          )}

          {folderType?.attributes?.length ? (
            <DynamicAttributeForm
              schema={folderType.attributes}
              values={attrValues}
              onChange={setAttrValues}
              errors={attrErrors}
            />
          ) : (
            <p className="text-xs text-gray-500">
              No folder type schema. Use <span className="font-medium">Edit Attributes</span> from the right-click menu to manage attributes individually.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} loading={updateFolder.isPending}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Lifecycle Change Modal */}
      <Modal open={lifecycleOpen} onClose={() => setLifecycleOpen(false)} title="Change Lifecycle State" size="sm">
        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            Current: <Badge variant="info">{folder.currentLifecycleState || 'None'}</Badge>
          </div>
          {folderType?.lifecycleStates?.length ? (
            <Select
              label="New Lifecycle State"
              value={newLifecycle}
              onChange={(e) => setNewLifecycle(e.target.value)}
              options={folderType.lifecycleStates.map((s) => ({ value: s, label: s }))}
              placeholder="Select state"
            />
          ) : (
            <Input
              label="New Lifecycle State"
              value={newLifecycle}
              onChange={(e) => setNewLifecycle(e.target.value)}
              placeholder="Enter state"
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setLifecycleOpen(false)}>Cancel</Button>
            <Button onClick={handleLifecycleSubmit} loading={updateFolder.isPending}>Update</Button>
          </div>
        </div>
      </Modal>

      {/* LTI Update-by-Attribute Modal */}
      <Modal open={ltiOpen} onClose={() => setLtiOpen(false)} title="LTI: Update Lifecycle + Attribute" size="lg">
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Find a folder by an existing attribute and update it with a new attribute and lifecycle in one shot.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {folder?.attributes && Object.keys(folder.attributes).length > 0 ? (
              <Select
                label="Search Attribute Name"
                value={ltiForm.searchAttributeName}
                onChange={(e) => {
                  const name = e.target.value;
                  // Auto-fill the value from the folder's existing attribute
                  const existing = folder.attributes?.[name];
                  setLtiForm({
                    ...ltiForm,
                    searchAttributeName: name,
                    searchAttributeValue: existing == null ? '' : String(existing),
                  });
                }}
                options={Object.keys(folder.attributes).map((k) => {
                  const v = folder.attributes![k];
                  const preview = v == null || v === '' ? '(empty)' : String(v);
                  return { value: k, label: `${k} = ${preview}` };
                })}
                placeholder="Select an existing attribute"
              />
            ) : (
              <Input
                label="Search Attribute Name"
                value={ltiForm.searchAttributeName}
                onChange={(e) => setLtiForm({ ...ltiForm, searchAttributeName: e.target.value })}
                placeholder="No attributes set on this folder"
              />
            )}
            <Input
              label="Search Attribute Value"
              value={ltiForm.searchAttributeValue}
              onChange={(e) => setLtiForm({ ...ltiForm, searchAttributeValue: e.target.value })}
              placeholder="Auto-filled when you pick a name"
            />
            {folderType?.attributes?.length ? (
              <Select
                label="New Attribute Name"
                value={ltiForm.newAttributeName}
                onChange={(e) => setLtiForm({ ...ltiForm, newAttributeName: e.target.value })}
                options={folderType.attributes.map((a) => ({ value: a.attributeName, label: a.attributeName }))}
                placeholder="Select"
              />
            ) : (
              <Input label="New Attribute Name" value={ltiForm.newAttributeName} onChange={(e) => setLtiForm({ ...ltiForm, newAttributeName: e.target.value })} />
            )}
            <Input label="New Attribute Value" value={ltiForm.newAttributeValue} onChange={(e) => setLtiForm({ ...ltiForm, newAttributeValue: e.target.value })} />
          </div>
          {folderType?.lifecycleStates?.length ? (
            <Select
              label="New Lifecycle State"
              value={ltiForm.newLifecycleState}
              onChange={(e) => setLtiForm({ ...ltiForm, newLifecycleState: e.target.value })}
              options={folderType.lifecycleStates.map((s) => ({ value: s, label: s }))}
              placeholder="Select"
            />
          ) : (
            <Input label="New Lifecycle State" value={ltiForm.newLifecycleState} onChange={(e) => setLtiForm({ ...ltiForm, newLifecycleState: e.target.value })} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setLtiOpen(false)}>Cancel</Button>
            <Button onClick={handleLtiSubmit} loading={ltiLoading}>Update</Button>
          </div>
        </div>
      </Modal>

      {/* Document Right-Click Context Menu */}
      <ContextMenu
        open={!!docCtx?.open}
        x={docCtx?.x || 0}
        y={docCtx?.y || 0}
        onClose={() => setDocCtx(null)}
        items={docCtx?.data ? documentMenu(docCtx.data) : []}
      />

      {/* Document Detail Drawer */}
      <ResourceDrawer
        open={!!drawerDoc}
        onClose={() => setDrawerDoc(null)}
        resource={drawerDoc}
        kind="document"
        initialTab={drawerTab}
        contextMenuItems={drawerDoc ? documentMenu(drawerDoc) : []}
      />

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

      {/* Bulk Move/Copy Modal */}
      <Modal
        open={bulkAction !== null}
        onClose={() => { if (!bulkBusy) { setBulkAction(null); setBulkTarget(''); } }}
        title={bulkAction === 'move' ? 'Move Documents' : 'Copy Documents'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {bulkAction === 'move' ? 'Move' : 'Copy'} <span className="font-semibold">{selectedIds.size}</span> document{selectedIds.size !== 1 ? 's' : ''} to:
          </p>
          <Input
            label="Target Folder ID"
            placeholder="e.g. FOLDER-20260401155459-T3"
            value={bulkTarget}
            onChange={(e) => setBulkTarget(e.target.value)}
            autoFocus
          />
          <p className="text-[11px] text-gray-400">
            Tip: copy a folder ID from the breadcrumb of the destination folder.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setBulkAction(null); setBulkTarget(''); }} disabled={bulkBusy} icon={<X size={14} />}>
              Cancel
            </Button>
            <Button onClick={handleBulkMoveOrCopy} loading={bulkBusy} disabled={!bulkTarget.trim()}>
              {bulkAction === 'move' ? 'Move' : 'Copy'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
