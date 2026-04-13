import { useState } from 'react';
import { Plus, Edit2, Trash2, FileType } from 'lucide-react';
import {
  useDocumentTypesList,
  useCreateDocumentType,
  useUpdateDocumentType,
  useDeleteDocumentType,
} from '../hooks/useDocumentTypes';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { DocumentTypeAttributeDto, DocumentTypeRequest } from '../types/api';

const emptyAttr = (): DocumentTypeAttributeDto => ({
  attributeName: '',
  attributeType: 'String',
  isMandatory: false,
});

export default function DocumentTypesPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useDocumentTypesList(page, 20);
  const createMut = useCreateDocumentType();
  const updateMut = useUpdateDocumentType();
  const deleteMut = useDeleteDocumentType();

  const [search, setSearch] = useState('');
  const allTypes = data?.data?.content || [];
  const types = allTypes.filter((t) => t.documentTypeName.toLowerCase().includes(search.toLowerCase()));
  const totalPages = data?.data?.totalPages || 0;

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<DocumentTypeRequest>({
    documentTypeName: '',
    description: '',
    attributes: [emptyAttr()],
  });

  const openCreate = () => {
    setEditId(null);
    setForm({ documentTypeName: '', description: '', attributes: [emptyAttr()] });
    setModalOpen(true);
  };

  const openEdit = (dt: typeof types[0]) => {
    setEditId(dt.id);
    setForm({
      documentTypeName: dt.documentTypeName,
      description: '',
      attributes: dt.attributes.length > 0 ? dt.attributes : [emptyAttr()],
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (editId) {
      updateMut.mutate({ id: editId, data: form }, { onSuccess: () => setModalOpen(false) });
    } else {
      createMut.mutate(form, { onSuccess: () => setModalOpen(false) });
    }
  };

  const addAttribute = () => {
    setForm({ ...form, attributes: [...form.attributes, emptyAttr()] });
  };

  const removeAttribute = (idx: number) => {
    setForm({ ...form, attributes: form.attributes.filter((_, i) => i !== idx) });
  };

  const updateAttribute = (idx: number, field: keyof DocumentTypeAttributeDto, value: any) => {
    const attrs = [...form.attributes];
    (attrs[idx] as any)[field] = value;
    setForm({ ...form, attributes: attrs });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Types</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Define document schemas with attributes</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={18} />}>New Document Type</Button>
      </div>

      <Input placeholder="Search document types by name..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : types.length === 0 ? (
        <EmptyState title="No document types" description="Create your first document type" />
      ) : (
        <>
          <div className="space-y-3">
            {types.map((dt) => (
              <Card key={dt.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileType className="text-blue-500 shrink-0" size={20} />
                    <div>
                      <h3 className="font-semibold">{dt.documentTypeName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {dt.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(dt)} icon={<Edit2 size={14} />} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (confirm('Delete this document type?')) deleteMut.mutate(dt.id); }}
                      icon={<Trash2 size={14} className="text-red-500" />}
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {dt.attributes.map((a) => (
                    <Badge key={a.attributeName} className="mr-1 mb-1">
                      {a.attributeName} ({a.attributeType}){a.isMandatory ? '*' : ''}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Document Type' : 'Create Document Type'} size="lg">
        <div className="space-y-4">
          <Input
            label="Type Name"
            required
            value={form.documentTypeName}
            onChange={(e) => setForm({ ...form, documentTypeName: e.target.value })}
          />
          <Input
            label="Description"
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap pb-2">
                    <input
                      type="checkbox"
                      checked={attr.isAiRequired || false}
                      onChange={(e) => updateAttribute(idx, 'isAiRequired', e.target.checked)}
                    />
                    AI
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
