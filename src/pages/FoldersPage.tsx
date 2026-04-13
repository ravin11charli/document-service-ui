import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder, Plus, ExternalLink, Info, Settings as SettingsIcon, Trash2, Edit2,
} from 'lucide-react';
import { useFoldersList, useCreateFolder, useDeleteFolder } from '../hooks/useFolders';
import { useActiveFolderTypes } from '../hooks/useFolderTypes';
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
import { ResourceDrawer } from '../components/shared/ResourceDrawer';
import { EditAttributesModal } from '../components/shared/EditAttributesModal';
import { DynamicAttributeForm, validateAttributes } from '../components/shared/DynamicAttributeForm';
import { VersionSelector } from '../components/shared/VersionSelector';
import type { ApiVersionType, CreateFolderRequest } from '../types/api';

type CtxState = { open: boolean; x: number; y: number; data: any } | null;

export default function FoldersPage() {
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useFoldersList(page, 25);
  const { data: folderTypesData } = useActiveFolderTypes();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const navigate = useNavigate();

  // Right-click + drawer + attributes state
  const [ctx, setCtx] = useState<CtxState>(null);
  const [drawerFolder, setDrawerFolder] = useState<any>(null);
  const [attrsModal, setAttrsModal] = useState<{ open: boolean; folder: any }>({ open: false, folder: null });

  const onFolderContextMenu = (e: React.MouseEvent, folder: any) => {
    e.preventDefault();
    setCtx({ open: true, x: e.clientX, y: e.clientY, data: folder });
  };

  const folderMenu = (folder: any): ContextMenuItem[] => [
    { label: 'Open', icon: <ExternalLink size={14} />, onClick: () => navigate(`/folders/${folder.folderId}`) },
    { label: 'View Details', icon: <Info size={14} />, onClick: () => setDrawerFolder(folder) },
    { label: 'Edit Attributes', icon: <Edit2 size={14} />, onClick: () => setAttrsModal({ open: true, folder }) },
    { label: 'Manage', icon: <SettingsIcon size={14} />, onClick: () => navigate(`/folders/${folder.folderId}`) },
    { label: 'Delete', icon: <Trash2 size={14} />, danger: true, divider: true, onClick: () => {
      if (confirm(`Delete folder "${folder.folderName}"?`)) deleteFolder.mutate(folder.folderId);
    }},
  ];

  const [search, setSearch] = useState('');
  const allFolders = data?.data?.content || [];
  const folders = allFolders.filter((f) => f.folderName.toLowerCase().includes(search.toLowerCase()));
  const totalPages = data?.data?.totalPages || 0;
  const totalElements = data?.data?.totalElements || 0;
  const folderTypes = folderTypesData?.data || [];

  const [createVersion, setCreateVersion] = useState<ApiVersionType>('1.1');
  const [form, setForm] = useState<CreateFolderRequest>({ folderName: '' });
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [attrErrors, setAttrErrors] = useState<Record<string, string>>({});

  const selectedType = folderTypes.find((ft) => ft.folderTypeId === form.folderTypeId);
  const lifecycleOptions = selectedType?.lifecycleStates?.map((s) => ({ value: s, label: s })) || [];

  const handleCreate = () => {
    const nameOrId = form.folderName?.trim() || form.folderId?.trim();
    if (!nameOrId) return;

    if (selectedType) {
      const errors = validateAttributes(selectedType.attributes, attrValues);
      if (Object.keys(errors).length > 0) {
        setAttrErrors(errors);
        return;
      }
    }

    const payload: CreateFolderRequest = {
      folderName: form.folderName || undefined,
      folderId: createVersion === '1.1' ? (form.folderId || undefined) : undefined,
      folderTypeId: form.folderTypeId || undefined,
      currentLifecycleState: form.currentLifecycleState || undefined,
      attributes: selectedType ? attrValues : undefined,
    };

    createFolder.mutate(
      { data: payload, version: createVersion },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setForm({ folderName: '' });
          setAttrValues({});
          setAttrErrors({});
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Folders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage all folders</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} icon={<Plus size={18} />}>New Folder</Button>
      </div>

      <Input placeholder="Search folders by name..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <p className="text-[11px] text-gray-400 -mt-2">Tip: right-click a folder for quick actions</p>

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : folders.length === 0 ? (
        <EmptyState title="No folders" description="Create your first folder" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Card
                key={folder.folderId}
                hover
                className="p-4"
                onClick={() => navigate(`/folders/${folder.folderId}`)}
                onContextMenu={(e: React.MouseEvent) => onFolderContextMenu(e, folder)}
              >
                <div className="flex items-center gap-3">
                  <Folder className="text-amber-500 shrink-0" size={20} />
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{folder.folderName}</h3>
                    <p className="text-xs text-gray-500">{folder.itemCount} items &middot; {folder.displaySize || '0 B'}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {folder.currentLifecycleState && <Badge variant="info">{folder.currentLifecycleState}</Badge>}
                  {folder.folderTypeName && <Badge>{folder.folderTypeName}</Badge>}
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />
        </>
      )}

      {/* Create Folder Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Folder" size="lg">
        <div className="space-y-4">
          <VersionSelector
            value={createVersion}
            onChange={(v) => setCreateVersion(v)}
            versions={['1.0', '1.1']}
          />
          {createVersion === '1.0' && (
            <p className="text-xs text-amber-500">v1.0 uses applicationName field (deprecated). Upgrade to v1.1 for folderId support.</p>
          )}
          <Input
            label={createVersion === '1.0' ? 'Application Name' : 'Folder Name'}
            required={!form.folderId}
            value={form.folderName || ''}
            onChange={(e) => setForm({ ...form, folderName: e.target.value })}
            placeholder={createVersion === '1.0' ? 'Enter application name' : 'Enter folder name (or provide Folder ID)'}
          />
          {createVersion !== '1.0' && (
            <Input
              label="Folder ID (Optional — auto-generated if empty)"
              value={form.folderId || ''}
              onChange={(e) => setForm({ ...form, folderId: e.target.value })}
              placeholder="Custom folder ID (max 128 chars)"
            />
          )}
          <Select
            label="Folder Type (Optional)"
            value={form.folderTypeId || ''}
            onChange={(e) => {
              setForm({ ...form, folderTypeId: e.target.value, currentLifecycleState: '' });
              setAttrValues({});
              setAttrErrors({});
            }}
            options={folderTypes.map((ft) => ({ value: ft.folderTypeId, label: ft.folderTypeName }))}
            placeholder="None"
          />
          {selectedType && lifecycleOptions.length > 0 && (
            <Select
              label="Lifecycle State"
              value={form.currentLifecycleState || ''}
              onChange={(e) => setForm({ ...form, currentLifecycleState: e.target.value })}
              options={lifecycleOptions}
              placeholder="Select lifecycle state"
            />
          )}
          {selectedType && selectedType.attributes.length > 0 && (
            <DynamicAttributeForm
              schema={selectedType.attributes}
              values={attrValues}
              onChange={setAttrValues}
              errors={attrErrors}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createFolder.isPending}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Context Menu */}
      <ContextMenu
        open={!!ctx?.open}
        x={ctx?.x || 0}
        y={ctx?.y || 0}
        onClose={() => setCtx(null)}
        items={ctx?.data ? folderMenu(ctx.data) : []}
      />

      {/* Resource Drawer (tabbed) */}
      <ResourceDrawer
        open={!!drawerFolder}
        onClose={() => setDrawerFolder(null)}
        resource={drawerFolder}
        kind="folder"
        contextMenuItems={drawerFolder ? folderMenu(drawerFolder) : []}
      />

      {/* Edit Attributes Modal */}
      {attrsModal.folder && (
        <EditAttributesModal
          open={attrsModal.open}
          onClose={() => setAttrsModal({ open: false, folder: null })}
          kind="folder"
          resourceId={attrsModal.folder.folderId}
          resourceName={attrsModal.folder.folderName}
          typeId={attrsModal.folder.folderTypeId}
          currentAttributes={attrsModal.folder.attributes}
        />
      )}
    </div>
  );
}
