import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Folder } from 'lucide-react';
import { searchService } from '../api/searchService';
import { documentService } from '../api/documentService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { VersionSelector } from '../components/shared/VersionSelector';
import { ResourceDrawer, type TabId } from '../components/shared/ResourceDrawer';
import { TagList } from '../components/shared/TagPill';
import { DocRowActions } from '../components/shared/DocRowActions';
import type { ApiVersionType, DocumentResponse, FolderResponse } from '../types/api';
import toast from 'react-hot-toast';

type SearchType =
  | 'token' | 'pan' | 'acknowledgement'
  | 'doc-by-type' | 'doc-by-attr-name' | 'doc-by-attr'
  | 'folder-by-type' | 'folder-by-attr-name' | 'folder-by-attr'
  | 'doc-by-folder-attr' | 'doc-by-folder-type';

const SEARCH_OPTIONS: { value: SearchType; label: string }[] = [
  { value: 'token', label: 'Search by Token Number' },
  { value: 'pan', label: 'Search by PAN' },
  { value: 'acknowledgement', label: 'Search by Acknowledgement' },
  { value: 'doc-by-type', label: 'Documents by Document Type' },
  { value: 'doc-by-attr-name', label: 'Documents by Attribute Name' },
  { value: 'doc-by-attr', label: 'Documents by Attribute Name+Value' },
  { value: 'folder-by-type', label: 'Folders by Folder Type' },
  { value: 'folder-by-attr-name', label: 'Folders by Attribute Name' },
  { value: 'folder-by-attr', label: 'Folders by Attribute Name+Value' },
  { value: 'doc-by-folder-attr', label: 'Documents by Folder Attribute' },
  { value: 'doc-by-folder-type', label: 'Documents by Folder Type' },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState<SearchType>('token');
  const [version, setVersion] = useState<ApiVersionType>('1.1');
  const [query, setQuery] = useState('');
  const [attrName, setAttrName] = useState('');
  const [attrValue, setAttrValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [docResults, setDocResults] = useState<DocumentResponse[]>([]);
  const [folderResults, setFolderResults] = useState<FolderResponse[]>([]);
  const [searched, setSearched] = useState(false);

  // Drawer state — search results open in the drawer rather than navigating
  const [drawerDoc, setDrawerDoc] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<TabId>('details');
  const openDrawer = (doc: any, tab: TabId = 'details') => {
    setDrawerTab(tab);
    setDrawerDoc(doc);
  };

  const handleDownload = async (doc: any) => {
    try {
      const blob = await documentService.download(doc.id || doc.documentId);
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

  const handleSearch = async () => {
    setLoading(true);
    setDocResults([]);
    setFolderResults([]);
    setSearched(true);
    try {
      switch (searchType) {
        case 'token': {
          const r = await searchService.searchByToken(query, version);
          setDocResults(r.data);
          break;
        }
        case 'pan': {
          const r = await searchService.searchByPan(query, version);
          setDocResults(r.data);
          break;
        }
        case 'acknowledgement': {
          const r = await searchService.searchByAcknowledgement(query, version);
          setDocResults(r.data);
          break;
        }
        case 'doc-by-type': {
          const r = await searchService.documentsByDocumentType(query);
          setDocResults(r.data);
          break;
        }
        case 'doc-by-attr-name': {
          const r = await searchService.documentsByAttributeName(attrName);
          setDocResults(r.data);
          break;
        }
        case 'doc-by-attr': {
          const r = await searchService.documentsByAttribute(attrName, attrValue);
          setDocResults(r.data);
          break;
        }
        case 'folder-by-type': {
          const r = await searchService.foldersByFolderType(query);
          setFolderResults(r.data);
          break;
        }
        case 'folder-by-attr-name': {
          const r = await searchService.foldersByAttributeName(attrName);
          setFolderResults(r.data);
          break;
        }
        case 'folder-by-attr': {
          const r = await searchService.foldersByAttribute(attrName, attrValue);
          setFolderResults(r.data);
          break;
        }
        case 'doc-by-folder-attr': {
          const r = await searchService.documentsByFolderAttribute(attrName, attrValue);
          setDocResults(r.data);
          break;
        }
        case 'doc-by-folder-type': {
          const r = await searchService.documentsByFolderType(query);
          setDocResults(r.data);
          break;
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const needsQuery = ['token', 'pan', 'acknowledgement', 'doc-by-type', 'folder-by-type', 'doc-by-folder-type'].includes(searchType);
  const needsAttrName = ['doc-by-attr-name', 'doc-by-attr', 'folder-by-attr-name', 'folder-by-attr', 'doc-by-folder-attr'].includes(searchType);
  const needsAttrValue = ['doc-by-attr', 'folder-by-attr', 'doc-by-folder-attr'].includes(searchType);
  const isLtiSearch = ['token', 'pan', 'acknowledgement'].includes(searchType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Advanced Search</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Search documents and folders by various criteria</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Search Type"
            value={searchType}
            onChange={(e) => { setSearchType(e.target.value as SearchType); setSearched(false); }}
            options={SEARCH_OPTIONS}
          />
          {isLtiSearch && (
            <VersionSelector value={version} onChange={setVersion} versions={['1.0', '1.1']} />
          )}
        </div>

        {needsQuery && (
          <Input
            label={searchType === 'doc-by-type' || searchType === 'folder-by-type' || searchType === 'doc-by-folder-type' ? 'Type ID' : 'Search Value'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search value..."
          />
        )}
        {needsAttrName && (
          <Input
            label="Attribute Name"
            value={attrName}
            onChange={(e) => setAttrName(e.target.value)}
            placeholder="e.g. panNumber, tokenNumber"
          />
        )}
        {needsAttrValue && (
          <Input
            label="Attribute Value"
            value={attrValue}
            onChange={(e) => setAttrValue(e.target.value)}
            placeholder="e.g. ABCDE1234F"
          />
        )}

        <Button onClick={handleSearch} loading={loading} icon={<Search size={18} />}>Search</Button>
      </Card>

      {/* Results */}
      {loading ? (
        <LoadingSpinner />
      ) : searched && docResults.length === 0 && folderResults.length === 0 ? (
        <EmptyState title="No results found" description="Try different search criteria" />
      ) : (
        <div className="space-y-2">
          {docResults.map((doc) => (
            <Card
              key={doc.id}
              hover
              className="p-4 flex items-center gap-4 group"
              onClick={() => openDrawer(doc, 'details')}
            >
              <FileText className="text-blue-500 shrink-0" size={20} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.documentName}</p>
                <p className="text-xs text-gray-500">{doc.extension?.toUpperCase()} &middot; {doc.displaySize}</p>
              </div>
              <div className="hidden md:flex shrink-0 max-w-[220px]">
                <TagList tags={doc.tags} max={2} />
              </div>
              <DocRowActions
                onPreview={() => openDrawer(doc, 'preview')}
                onDetails={() => openDrawer(doc, 'details')}
                onDownload={() => handleDownload(doc)}
              />
            </Card>
          ))}
          {folderResults.map((folder) => (
            <Card key={folder.folderId} hover className="p-4 flex items-center gap-4" onClick={() => navigate(`/folders/${folder.folderId}`)}>
              <Folder className="text-amber-500 shrink-0" size={20} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{folder.folderName}</p>
                <p className="text-xs text-gray-500">{folder.itemCount} items &middot; {folder.displaySize}</p>
              </div>
              {folder.currentLifecycleState && <Badge variant="info">{folder.currentLifecycleState}</Badge>}
            </Card>
          ))}
        </div>
      )}

      {/* Document Drawer */}
      <ResourceDrawer
        open={!!drawerDoc}
        onClose={() => setDrawerDoc(null)}
        resource={drawerDoc}
        kind="document"
        initialTab={drawerTab}
      />
    </div>
  );
}
