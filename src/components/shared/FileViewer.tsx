import { useEffect, useState } from 'react';
import { documentService } from '../../api/documentService';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { ExternalLink, Download } from 'lucide-react';
import type { ApiVersionType } from '../../types/api';

interface FileViewerProps {
  documentId: string;
  fileName: string;
  extension?: string;
}

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'];
const PDF_EXTS = ['pdf'];
const TEXT_EXTS = ['txt', 'log', 'json', 'xml', 'csv', 'md', 'yml', 'yaml', 'html', 'js', 'ts', 'java', 'py'];
const VIDEO_EXTS = ['mp4', 'webm', 'ogg', 'mov'];
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];

/**
 * File preview that delegates rendering to Chrome's built-in viewers wherever
 * possible (PDFs, images, video, audio, text). For formats Chrome can't render
 * inline (Office docs, archives, etc.) we offer an "Open in new tab" + download
 * fallback — the browser then picks whatever native handler it has.
 */
export function FileViewer({ documentId, fileName, extension }: FileViewerProps) {
  const ext = (extension || fileName.split('.').pop() || '').toLowerCase().replace('.', '');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBlobUrl(null);
    setTextContent(null);

    documentService.open(documentId, '1.1' as ApiVersionType)
      .then(async (blob) => {
        if (cancelled) return;
        if (TEXT_EXTS.includes(ext)) {
          const text = await blob.text();
          if (!cancelled) setTextContent(text);
        } else {
          const url = URL.createObjectURL(blob);
          revoke = url;
          if (!cancelled) setBlobUrl(url);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const detail = err?.detail || err?.message || 'Failed to load file';
        const code = err?.errorCode ? ` (${err.errorCode})` : '';
        setError(`${err?.title || 'Preview unavailable'}${code}: ${detail}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [documentId, ext]);

  if (loading) return <LoadingSpinner className="py-12" />;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const openInNewTab = () => {
    if (blobUrl) window.open(blobUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadFile = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    a.click();
  };

  const ActionBar = () => (
    <div className="flex items-center justify-end gap-2 mb-3">
      {blobUrl && (
        <Button size="sm" variant="ghost" icon={<ExternalLink size={14} />} onClick={openInNewTab}>
          Open in new tab
        </Button>
      )}
      {blobUrl && (
        <Button size="sm" variant="ghost" icon={<Download size={14} />} onClick={downloadFile}>
          Download
        </Button>
      )}
    </div>
  );

  // Image — Chrome renders natively in <img>
  if (IMAGE_EXTS.includes(ext) && blobUrl) {
    return (
      <div>
        <ActionBar />
        <img
          src={blobUrl}
          alt={fileName}
          className="max-w-full max-h-[70vh] mx-auto rounded-lg border border-gray-200 dark:border-gray-700"
        />
      </div>
    );
  }

  // PDF — Chrome's built-in PDF viewer via iframe
  if (PDF_EXTS.includes(ext) && blobUrl) {
    return (
      <div>
        <ActionBar />
        <iframe
          src={blobUrl}
          title={fileName}
          className="w-full h-[75vh] rounded-lg border border-gray-200 dark:border-gray-700"
        />
      </div>
    );
  }

  // Video — HTML5 video element
  if (VIDEO_EXTS.includes(ext) && blobUrl) {
    return (
      <div>
        <ActionBar />
        <video controls src={blobUrl} className="w-full max-h-[70vh] rounded-lg" />
      </div>
    );
  }

  // Audio
  if (AUDIO_EXTS.includes(ext) && blobUrl) {
    return (
      <div>
        <ActionBar />
        <audio controls src={blobUrl} className="w-full" />
      </div>
    );
  }

  // Plain text — render in <pre>
  if (TEXT_EXTS.includes(ext) && textContent !== null) {
    return (
      <div>
        <ActionBar />
        <pre className="text-xs bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg max-h-[70vh] overflow-auto whitespace-pre-wrap font-mono">
          {textContent}
        </pre>
      </div>
    );
  }

  // Fallback for everything Chrome can't render inline (docx, xlsx, pptx, …).
  // Let the user pop it open in a new tab — Chrome will show a download dialog
  // or hand it off to the OS's registered handler.
  return (
    <div className="text-center py-10 space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Inline preview isn't available for <span className="font-mono">.{ext}</span> files.
      </p>
      <p className="text-xs text-gray-400">
        Use "Open in new tab" — your browser will hand it off to its built-in
        viewer or your operating system's default app.
      </p>
      <div className="flex items-center justify-center gap-2">
        {blobUrl && (
          <Button size="sm" icon={<ExternalLink size={14} />} onClick={openInNewTab}>
            Open in new tab
          </Button>
        )}
        {blobUrl && (
          <Button size="sm" variant="secondary" icon={<Download size={14} />} onClick={downloadFile}>
            Download
          </Button>
        )}
      </div>
    </div>
  );
}
