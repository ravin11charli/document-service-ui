import { useState, useEffect } from 'react';
import { X, Tag as TagIcon } from 'lucide-react';
import { useUpdateDocument } from '../../hooks/useDocuments';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  initialTags: string[];
}

export function EditTagsModal({ open, onClose, documentId, documentName, initialTags }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [input, setInput] = useState('');
  const updateMutation = useUpdateDocument();

  useEffect(() => {
    if (open) {
      setTags(initialTags || []);
      setInput('');
    }
  }, [open, initialTags]);

  const addTag = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setInput('');
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(
      { id: documentId, data: { tags } },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Tags">
      <div className="space-y-4 py-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          <TagIcon size={12} className="inline mr-1" /> {documentName}
        </p>
        <div className="min-h-[60px] flex flex-wrap gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/30 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium animate-fade-slide-up"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="hover:text-red-600 dark:hover:text-red-400 ml-0.5"
                aria-label={`Remove ${t}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? 'Add tags (press Enter or comma)...' : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
          />
        </div>
        <p className="text-xs text-gray-400">
          Press <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-[10px]">Enter</kbd> to add ·
          <kbd className="ml-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-[10px]">Backspace</kbd> to remove last
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={updateMutation.isPending}>Save Tags</Button>
        </div>
      </div>
    </Modal>
  );
}
