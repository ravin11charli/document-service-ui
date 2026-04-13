import { useState } from 'react';
import { Plus, Edit2, Trash2, FolderCog, Database } from 'lucide-react';
import {
  useFolderTypesList,
  useCreateFolderType,
  useUpdateFolderType,
  useDeleteFolderType,
} from '../hooks/useFolderTypes';
import { usePoliciesList, useUpdatePolicy, useDeletePolicy } from '../hooks/useBucketManager';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { FolderTypeAttributeDto, FolderTypeRequest } from '../types/api';

const emptyAttr = (): FolderTypeAttributeDto => ({
  attributeName: '',
  attributeType: 'String',
  isMandatory: false,
});

export default function FolderTypesPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useFolderTypesList(page, 20);
  const createMut = useCreateFolderType();
  const updateMut = useUpdateFolderType();
  const deleteMut = useDeleteFolderType();

  const [search, setSearch] = useState('');
  const allTypes = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  const { data: policiesData } = usePoliciesList(false);
  const policies = policiesData?.data || [];
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();
  const policyByType = (id: string) => policies.find((p) => p.folderTypeId === id);

  // Filter by name then sort: active policy → disabled policy → no policy
  const types = [...allTypes]
    .filter((t) => t.folderTypeName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const pa = policyByType(a.folderTypeId);
      const pb = policyByType(b.folderTypeId);
      const score = (p: typeof pa) => (p ? (p.enabled ? 0 : 1) : 2);
      return score(pa) - score(pb);
    });

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FolderTypeRequest>({
    folderTypeName: '',
    description: '',
    lifecycleStates: [],
    attributes: [emptyAttr()],
  });
  const [lifecycleInput, setLifecycleInput] = useState('');

  const openCreate = () => {
    setEditId(null);
    setForm({ folderTypeName: '', description: '', lifecycleStates: [], attributes: [emptyAttr()] });
    setLifecycleInput('');
    setModalOpen(true);
  };

  const openEdit = (ft: typeof types[0]) => {
    setEditId(ft.folderTypeId);
    setForm({
      folderTypeName: ft.folderTypeName,
      description: '',
      lifecycleStates: ft.lifecycleStates || [],
      attributes: ft.attributes.length > 0 ? ft.attributes : [emptyAttr()],
    });
    setLifecycleInput((ft.lifecycleStates || []).join(', '));
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const payload: FolderTypeRequest = {
      ...form,
      lifecycleStates: lifecycleInput.split(',').map((s) => s.trim()).filter(Boolean),
    };

    if (editId) {
      updateMut.mutate({ id: editId, data: payload }, { onSuccess: () => setModalOpen(false) });
    } else {
      createMut.mutate(payload, { onSuccess: () => setModalOpen(false) });
    }
  };

  const addAttribute = () => {
    setForm({ ...form, attributes: [...form.attributes, emptyAttr()] });
  };

  const removeAttribute = (idx: number) => {
    setForm({ ...form, attributes: form.attributes.filter((_, i) => i !== idx) });
  };

  const updateAttribute = (idx: number, field: keyof FolderTypeAttributeDto, value: any) => {
    const attrs = [...form.attributes];
    (attrs[idx] as any)[field] = value;
    setForm({ ...form, attributes: attrs });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Folder Types</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Define folder schemas with attributes and lifecycle</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={18} />}>New Folder Type</Button>
      </div>

      <Input placeholder="Search folder types by name..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : types.length === 0 ? (
        <EmptyState title="No folder types" description="Create your first folder type" />
      ) : (
        <>
          <div className="space-y-3">
            {types.map((ft) => (
              <Card key={ft.folderTypeId} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FolderCog className="text-orange-500 shrink-0" size={20} />
                    <div>
                      <h3 className="font-semibold">{ft.folderTypeName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {ft.folderTypeId}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(ft)} icon={<Edit2 size={14} />} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (confirm('Delete this folder type?')) deleteMut.mutate(ft.folderTypeId); }}
                      icon={<Trash2 size={14} className="text-red-500" />}
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ft.lifecycleStates?.map((s) => <Badge key={s} variant="info">{s}</Badge>)}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {ft.attributes.map((a) => (
                    <span key={a.attributeName} className="mr-3">
                      {a.attributeName} ({a.attributeType}){a.isMandatory ? '*' : ''}
                    </span>
                  ))}
                </div>
                {(() => {
                  const p = policyByType(ft.folderTypeId);
                  if (!p) return (
                    <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                      <Database size={12} /> No bucket policy
                    </div>
                  );
                  return (
                    <div className="mt-3 flex items-center justify-between flex-wrap gap-2 p-2 bg-purple-50 dark:bg-purple-900/10 rounded">
                      <div className="text-xs flex items-center gap-2">
                        <Database size={14} className="text-purple-500" />
                        <Badge variant={p.enabled ? 'success' : 'default'}>{p.enabled ? 'Active' : 'Disabled'}</Badge>
                        <span className="font-mono">{p.triggerLifecycleState} &rarr; {p.targetBucket}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => updatePolicy.mutate({ id: p.storagePolicyId, data: { enabled: !p.enabled } })}>
                          {p.enabled ? 'Disable' : 'Activate'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm('Remove policy?')) deletePolicy.mutate(p.storagePolicyId); }}>
                          <Trash2 size={12} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Folder Type' : 'Create Folder Type'} size="lg">
        <div className="space-y-4">
          <Input
            label="Type Name"
            required
            value={form.folderTypeName}
            onChange={(e) => setForm({ ...form, folderTypeName: e.target.value })}
          />
          <Input
            label="Description"
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Lifecycle States (comma-separated)"
            value={lifecycleInput}
            onChange={(e) => setLifecycleInput(e.target.value)}
            placeholder="e.g. draft, active, archived, pan"
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Attributes</h4>
              <Button variant="ghost" size="sm" onClick={addAttribute} icon={<Plus size={14} />}>Add</Button>
            </div>
            <div className="space-y-3">
              {form.attributes.map((attr, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <Input
                    label="Name"
                    value={attr.attributeName}
                    onChange={(e) => updateAttribute(idx, 'attributeName', e.target.value)}
                    required
                  />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <select
                      value={attr.attributeType}
                      onChange={(e) => updateAttribute(idx, 'attributeType', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="String">String</option>
                      <option value="Number">Number</option>
                      <option value="Boolean">Boolean</option>
                      <option value="Date">Date</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap pb-2">
                    <input
                      type="checkbox"
                      checked={attr.isMandatory}
                      onChange={(e) => updateAttribute(idx, 'isMandatory', e.target.checked)}
                    />
                    Required
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => removeAttribute(idx)} className="pb-1">
                    <Trash2 size={14} className="text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMut.isPending || updateMut.isPending}>
              {editId ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
