import { useState } from 'react';
import {
  Plus, Edit2, Trash2, Database, ArrowRight, ToggleLeft, ToggleRight, Power,
} from 'lucide-react';
import {
  usePoliciesList,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
} from '../hooks/useBucketManager';
import { useActiveFolderTypes } from '../hooks/useFolderTypes';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { CreateStoragePolicyRequest, UpdateStoragePolicyRequest } from '../types/api';

export default function BucketManagerPage() {
  const [enabledOnly, setEnabledOnly] = useState(false);
  const { data, isLoading } = usePoliciesList(enabledOnly);
  const { data: folderTypesData } = useActiveFolderTypes();
  const createMut = useCreatePolicy();
  const updateMut = useUpdatePolicy();
  const deleteMut = useDeletePolicy();

  const policies = data?.data || [];
  const folderTypes = folderTypesData?.data || [];

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState<CreateStoragePolicyRequest>({
    folderTypeId: '',
    triggerLifecycleState: '',
    targetBucket: '',
  });
  const [editForm, setEditForm] = useState<UpdateStoragePolicyRequest>({});

  const handleCreate = () => {
    createMut.mutate(form, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm({ folderTypeId: '', triggerLifecycleState: '', targetBucket: '' });
      },
    });
  };

  const openEdit = (p: typeof policies[0]) => {
    setEditId(p.storagePolicyId);
    setEditForm({
      triggerLifecycleState: p.triggerLifecycleState,
      targetBucket: p.targetBucket,
      enabled: p.enabled,
    });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    updateMut.mutate({ id: editId, data: editForm }, { onSuccess: () => setEditOpen(false) });
  };

  const toggleEnabled = (p: typeof policies[0]) => {
    updateMut.mutate({ id: p.storagePolicyId, data: { enabled: !p.enabled } });
  };

  const selectedFolderType = folderTypes.find((ft) => ft.folderTypeId === form.folderTypeId);
  const lifecycleOptions = selectedFolderType?.lifecycleStates?.map((s) => ({ value: s, label: s })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bucket Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage storage policies for lifecycle-triggered bucket movement</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={enabledOnly ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setEnabledOnly(!enabledOnly)}
            icon={enabledOnly ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          >
            {enabledOnly ? 'Active Only' : 'Show All'}
          </Button>
          <Button onClick={() => setCreateOpen(true)} icon={<Plus size={18} />}>New Policy</Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : policies.length === 0 ? (
        <EmptyState title="No storage policies" description="Create a policy to define bucket movement rules" />
      ) : (
        <div className="space-y-4">
          {policies.map((p) => (
            <Card key={p.storagePolicyId} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Database className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{p.folderTypeName || p.folderTypeId}</h3>
                      <Badge variant={p.enabled ? 'success' : 'danger'}>
                        {p.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Policy: {p.storagePolicyId}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleEnabled(p)} icon={<Power size={14} />}>
                    {p.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)} icon={<Edit2 size={14} />} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { if (confirm('Delete this policy?')) deleteMut.mutate(p.storagePolicyId); }}
                    icon={<Trash2 size={14} className="text-red-500" />}
                  />
                </div>
              </div>

              {/* Flow visualization */}
              <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Folder Type</p>
                  <Badge variant="info">{p.folderTypeName || p.folderTypeId}</Badge>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Trigger State</p>
                  <Badge variant="warning">{p.triggerLifecycleState}</Badge>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Target Bucket</p>
                  <Badge variant="success">{p.targetBucket}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Storage Policy" size="md">
        <div className="space-y-4">
          <Select
            label="Folder Type"
            required
            value={form.folderTypeId}
            onChange={(e) => setForm({ ...form, folderTypeId: e.target.value, triggerLifecycleState: '' })}
            options={folderTypes.map((ft) => ({ value: ft.folderTypeId, label: ft.folderTypeName }))}
            placeholder="Select folder type"
          />
          {lifecycleOptions.length > 0 ? (
            <Select
              label="Trigger Lifecycle State"
              required
              value={form.triggerLifecycleState}
              onChange={(e) => setForm({ ...form, triggerLifecycleState: e.target.value })}
              options={lifecycleOptions}
              placeholder="Select trigger state"
            />
          ) : (
            <Input
              label="Trigger Lifecycle State"
              required
              value={form.triggerLifecycleState}
              onChange={(e) => setForm({ ...form, triggerLifecycleState: e.target.value })}
              placeholder="e.g. pan, archived"
            />
          )}
          <Input
            label="Target Bucket"
            required
            value={form.targetBucket}
            onChange={(e) => setForm({ ...form, targetBucket: e.target.value })}
            placeholder="e.g. teamsync-cold-pan-tenant123"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMut.isPending}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Storage Policy" size="md">
        <div className="space-y-4">
          <Input
            label="Trigger Lifecycle State"
            value={editForm.triggerLifecycleState || ''}
            onChange={(e) => setEditForm({ ...editForm, triggerLifecycleState: e.target.value })}
          />
          <Input
            label="Target Bucket"
            value={editForm.targetBucket || ''}
            onChange={(e) => setEditForm({ ...editForm, targetBucket: e.target.value })}
          />
          <Select
            label="Enabled"
            value={String(editForm.enabled ?? true)}
            onChange={(e) => setEditForm({ ...editForm, enabled: e.target.value === 'true' })}
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={updateMut.isPending}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
