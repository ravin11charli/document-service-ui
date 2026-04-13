import { useState } from 'react';
import { FileText, FileSpreadsheet, Presentation } from 'lucide-react';
import { useCreateFromTemplate } from '../../hooks/useDocuments';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CreateDocumentMetadata } from '../../types/api';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultFolderId?: string;
}

const TEMPLATES = [
  { type: 'docx', label: 'Word Document', icon: FileText, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  { type: 'xlsx', label: 'Spreadsheet', icon: FileSpreadsheet, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  { type: 'pptx', label: 'Presentation', icon: Presentation, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
];

export function CreateFromTemplateModal({ open, onClose, defaultFolderId }: Props) {
  const [step, setStep] = useState<'pick' | 'details'>('pick');
  const [templateType, setTemplateType] = useState('');
  const [docName, setDocName] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId || '');
  const [tags, setTags] = useState('');

  const createMutation = useCreateFromTemplate();

  const handlePick = (type: string) => {
    setTemplateType(type);
    setDocName(`Untitled.${type}`);
    setStep('details');
  };

  const handleCreate = () => {
    const metadata: CreateDocumentMetadata = {
      documentName: docName || `Untitled.${templateType}`,
      folderId: folderId || undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    };
    createMutation.mutate(
      { templateType, metadata },
      {
        onSuccess: () => {
          handleReset();
          onClose();
        },
      }
    );
  };

  const handleReset = () => {
    setStep('pick');
    setTemplateType('');
    setDocName('');
    setFolderId(defaultFolderId || '');
    setTags('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create New Document">
      {step === 'pick' ? (
        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Choose a template to start with
          </p>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.type}
                onClick={() => handlePick(t.type)}
                className="card-3d flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <div className={`p-3 rounded-xl ${t.color}`}>
                  <t.icon size={28} />
                </div>
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-gray-400">.{t.type}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {(() => {
              const tpl = TEMPLATES.find((t) => t.type === templateType);
              if (!tpl) return null;
              return (
                <>
                  <div className={`p-2 rounded-lg ${tpl.color}`}>
                    <tpl.icon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tpl.label}</p>
                    <p className="text-xs text-gray-400">.{tpl.type} template</p>
                  </div>
                </>
              );
            })()}
          </div>
          <Input
            label="Document Name"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder={`Untitled.${templateType}`}
          />
          <Input
            label="Folder ID (optional)"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            placeholder="Leave empty for root"
          />
          <Input
            label="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="report, finance"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setStep('pick')}>Back</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>
              Create Document
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
