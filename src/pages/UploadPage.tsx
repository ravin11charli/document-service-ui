import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Upload, CloudUpload, Zap, Globe, X } from 'lucide-react';
import { useDocumentTypesList } from '../hooks/useDocumentTypes';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { DynamicAttributeForm, validateAttributes } from '../components/shared/DynamicAttributeForm';
import { VersionSelector } from '../components/shared/VersionSelector';
import { useUploadQueue, type UploadMethod } from '../stores/uploadQueueStore';
import type { ApiVersionType, CreateDocumentMetadata } from '../types/api';

export default function UploadPage() {
  const [searchParams] = useSearchParams();
  const defaultFolderId = searchParams.get('folderId') || '';
  const navigate = useNavigate();
  const enqueue = useUploadQueue((s) => s.enqueue);

  const [version, setVersion] = useState<ApiVersionType>('1.1');
  const [method, setMethod] = useState<UploadMethod>('multipart');

  const [files, setFiles] = useState<File[]>([]);
  const [folderId, setFolderId] = useState(defaultFolderId);
  const [tags, setTags] = useState('');
  const [docTypeId, setDocTypeId] = useState('');
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [attrErrors, setAttrErrors] = useState<Record<string, string>>({});
  const [conflictResolution, setConflictResolution] = useState<'SAVE' | 'REPLACE' | 'KEEP_BOTH'>('SAVE');

  useEffect(() => { setFolderId(defaultFolderId); }, [defaultFolderId]);

  const { data: docTypesData } = useDocumentTypesList(0, 100);
  const docTypes = docTypesData?.data?.content || [];
  const selectedDocType = docTypes.find((dt) => dt.id === docTypeId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildMetadata = (file: File): CreateDocumentMetadata => {
    const meta: CreateDocumentMetadata = {
      folderId: folderId || undefined,
      documentName: file.name,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      conflictResolution,
    };
    if (selectedDocType) {
      meta.documentType = {
        documentTypeName: selectedDocType.documentTypeName,
        attributes: selectedDocType.attributes.map((a) => ({
          ...a,
          value: attrValues[a.attributeName] || a.value || '',
        })),
      };
    }
    return meta;
  };

  const handleEnqueue = () => {
    if (files.length === 0) return;
    if (selectedDocType) {
      const errors = validateAttributes(selectedDocType.attributes, attrValues);
      if (Object.keys(errors).length > 0) { setAttrErrors(errors); return; }
    }
    files.forEach((f) => enqueue([f], method, buildMetadata(f)));
    setFiles([]);
    if (defaultFolderId) {
      navigate(`/folders/${defaultFolderId}`);
    }
  };

  const removeFile = (idx: number) => setFiles(files.filter((_, i) => i !== idx));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Sticky header with Upload + Clear actions */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Upload Documents</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Multi-file parallel upload. Progress shown in the floating dock (bottom-right).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setFiles([])} disabled={files.length === 0}>Clear</Button>
          <Button onClick={handleEnqueue} disabled={files.length === 0} icon={<Upload size={18} />}>
            Upload {files.length > 0 ? `(${files.length})` : ''}
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Upload Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <VersionSelector
            value={version}
            onChange={(v) => {
              setVersion(v);
              if (v === '1.2') setMethod('stream');
              else if (v === '1.3') setMethod('presigned');
              else setMethod('multipart');
            }}
          />
          <Select
            label="Upload Method"
            value={method}
            onChange={(e) => setMethod(e.target.value as UploadMethod)}
            options={[
              { value: 'multipart', label: 'Multipart Upload' },
              { value: 'stream', label: 'Stream Upload (v1.2)' },
              { value: 'presigned', label: 'Presigned / Chunk Upload (pause/resume)' },
            ]}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {method === 'multipart' && <Badge variant="info"><Upload size={12} className="mr-1" /> Standard form upload — cancel only</Badge>}
          {method === 'stream' && <Badge variant="warning"><Zap size={12} className="mr-1" /> Binary stream — cancel only</Badge>}
          {method === 'presigned' && <Badge variant="success"><Globe size={12} className="mr-1" /> Chunk upload — pause/resume/retry/cancel</Badge>}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Files & Metadata</h2>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
        >
          <CloudUpload className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-500">
            {files.length === 0 ? 'Click to select one or more files' : `${files.length} file(s) selected`}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const fl = Array.from(e.target.files || []);
              if (fl.length > 0) setFiles([...files, ...fl]);
            }}
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-1">
            {files.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Folder ID" value={folderId} onChange={(e) => setFolderId(e.target.value)} placeholder="Optional" />
          <Input label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="invoice, finance" />
        </div>

        <Select
          label="Document Type (Optional)"
          value={docTypeId}
          onChange={(e) => { setDocTypeId(e.target.value); setAttrValues({}); setAttrErrors({}); }}
          options={docTypes.map((dt) => ({ value: dt.id, label: dt.documentTypeName }))}
          placeholder="None"
        />
        {selectedDocType && selectedDocType.attributes.length > 0 && (
          <DynamicAttributeForm
            schema={selectedDocType.attributes}
            values={attrValues}
            onChange={setAttrValues}
            errors={attrErrors}
          />
        )}

        <Select
          label="Conflict Resolution"
          value={conflictResolution}
          onChange={(e) => setConflictResolution(e.target.value as any)}
          options={[
            { value: 'SAVE', label: 'Save (Default — error on conflict, prompts to choose)' },
            { value: 'REPLACE', label: 'Replace Existing' },
            { value: 'KEEP_BOTH', label: 'Keep Both' },
          ]}
        />
        <p className="text-xs text-gray-500">
          Tip: when upload fails with a conflict, the dock will offer Replace / Keep Both / Skip per file.
        </p>
      </Card>

    </div>
  );
}
