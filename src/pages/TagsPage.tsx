import { useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { useTagsList, useCreateTag, useDeleteTag } from '../hooks/useTags';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function TagsPage() {
  const { data, isLoading } = useTagsList();
  const createMut = useCreateTag();
  const deleteMut = useDeleteTag();

  const tags = data?.data || [];
  const [createOpen, setCreateOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(COLORS[0]);

  const handleCreate = () => {
    createMut.mutate(
      { tagName, color: tagColor },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setTagName('');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage tags for document organization</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} icon={<Plus size={18} />}>New Tag</Button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : tags.length === 0 ? (
        <EmptyState title="No tags" description="Create tags to categorize documents" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map((tag) => (
            <Card key={tag.id} className="p-4 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{tag.tagName}</p>
                <p className="text-xs text-gray-500">by {tag.createdBy} &middot; {new Date(tag.createdAt).toLocaleDateString()}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { if (confirm('Delete this tag?')) deleteMut.mutate(tag.id); }}
                icon={<Trash2 size={14} className="text-red-400" />}
              />
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Tag" size="sm">
        <div className="space-y-4">
          <Input
            label="Tag Name"
            required
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="e.g. Finance"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setTagColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${tagColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMut.isPending}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
