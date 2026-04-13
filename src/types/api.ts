// ─── Common Response Types ───────────────────────────────────────────

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  error: string | null;
  details: ErrorDetails | null;
  requestInfo: RequestInfo;
}

export interface ErrorDetails {
  field: string;
  rejectedValue: string;
  reasons: string[];
  suggestion: string;
  documentationUrl: string;
}

export interface RequestInfo {
  timestamp: string;
  traceId: string;
  correlationId: string;
  path: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  numberOfElements: number;
}

// ─── Folder Types ────────────────────────────────────────────────────

export interface FolderTypeAttributeDto {
  id?: number;
  attributeName: string;
  attributeType: string;
  attributeValue?: string;
  isMandatory: boolean;
  description?: string;
}

export interface FolderTypeRequest {
  folderTypeName: string;
  description?: string;
  lifecycleStates?: string[];
  attributes: FolderTypeAttributeDto[];
}

export interface FolderTypeResponse {
  folderTypeId: string;
  folderTypeName: string;
  attributes: FolderTypeAttributeDto[];
  mapAttributes?: Record<string, unknown>;
  lifecycleStates: string[];
  tenantId: string;
  CreatedOn: string;
  createdBy: string;
  dateUpdated: string;
}

// ─── Document Types ──────────────────────────────────────────────────

export interface DocumentTypeAttributeDto {
  id?: number;
  attributeName: string;
  attributeType: string;
  value?: string;
  isMandatory: boolean;
  fileTypeDescription?: string;
  isAiRequired?: boolean;
  aiPrompt?: string;
}

export interface DocumentTypeRequest {
  documentTypeName: string;
  description?: string;
  attributes: DocumentTypeAttributeDto[];
}

export interface DocumentTypeResponse {
  id: string;
  documentTypeName: string;
  userName: string;
  attributes: DocumentTypeAttributeDto[];
  tenantId: string;
  createdBy: string;
  CreatedOn: string;
  dateUpdated: string;
  updatedBy: string;
}

// ─── Folders ─────────────────────────────────────────────────────────

export interface CreateFolderRequest {
  folderId?: string;
  folderName: string;
  workspaceId?: string;
  parentId?: string | null;
  folderTypeId?: string;
  attributes?: Record<string, unknown>;
  currentLifecycleState?: string;
}

export interface UpdateFolderRequest {
  folderName?: string;
  folderTypeId?: string;
  attributes?: Record<string, unknown>;
  currentLifecycleState?: string;
}

export interface FolderResponse {
  folderId: string;
  folderName: string;
  folderTypeName: string;
  folderTypeId: string;
  attributes: Record<string, unknown>;
  currentLifecycleState: string;
  ownedBy: string;
  workspaceId: string;
  tenantId: string;
  parentId: string | null;
  totalSize: number;
  displaySize: string;
  itemCount: number;
  isRootItem: boolean;
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  lastAccessedAt: string;
  depth: number;
  fullPath: string;
}

// ─── Documents ───────────────────────────────────────────────────────

export interface CreateDocumentMetadata {
  documentName?: string;
  folderId?: string;
  tags?: string[];
  documentType?: DocumentTypeRequest;
  generateAiTag?: boolean;
  textRecognitionMethod?: string;
  ocrFlag?: boolean;
  conflictResolution?: 'SAVE' | 'REPLACE' | 'KEEP_BOTH';
}

export interface DocumentResponse {
  id: string;
  documentName: string;
  ownedBy: string;
  workspaceId: string;
  folderId: string;
  tenantId: string;
  displaySize: string;
  extension: string;
  documentType: DocumentTypeResponse | null;
  attributes: Record<string, unknown>;
  tags: string[];
  isRootItem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDocumentRequest {
  name?: string;
  parentId?: string;
  workspaceId?: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
  isPinned?: boolean;
  documentTypeName?: string;
  attributes?: Record<string, string>;
  removeAttributes?: string[];
}

export interface RenameRequest {
  newName: string;
}

export interface MoveRequest {
  targetFolderId: string;
}

export interface CopyRequest {
  targetParentId: string;
  targetWorkspaceId?: string;
  newName?: string;
  deepCopyBinary?: boolean;
}

// ─── Versions ────────────────────────────────────────────────────────

export interface VersionInfoResponse {
  versionCount: string;
  versionId: string;
  fileName: string;
  size: number;
  displaySize: string;
  isLatest: boolean;
  dateModified: string;
  editByDisplayName: string;
  editByUsername: string;
  createdAt: string;
  createdBy: string;
}

export interface RevertVersionRequest {
  versionId: string;
  comment?: string;
}

export interface RevertVersionResponse {
  documentId: string;
  revertedToVersionId: string;
  newS3VersionId: string;
  newCurrentVersion: number;
  previousVersion: number;
  revertedAt: string;
  revertedBy: string;
  reason: string;
}

// ─── Presigned Upload ────────────────────────────────────────────────

export interface PresignedUploadInitiateRequest {
  documentName: string;
  folderId?: string;
  tags?: string[];
  documentType?: DocumentTypeRequest;
  generateAiTag?: boolean;
  textRecognitionMethod?: string;
  ocrFlag?: boolean;
  conflictResolution?: 'SAVE' | 'REPLACE' | 'KEEP_BOTH';
  fileSize: number;
  contentType?: string;
}

export interface PresignedUploadPart {
  partNumber: number;
  presignedUrl: string;
  expiresAt?: string;
}

export interface PresignedUploadInitiateResponse {
  document: DocumentResponse;
  uploadStrategy: 'SINGLE' | 'MULTIPART';
  partSize: number;
  totalParts: number;
  parts: PresignedUploadPart[];
  expiresAt: string;
  requiredHeaders: Record<string, string>;
}

export interface PresignedUploadCompleteRequest {
  documentId: string;
  parts: { partNumber: number; etag: string }[];
}

// ─── Search ──────────────────────────────────────────────────────────

export interface UnifiedSearchRequest {
  query: string;
  type?: string;
}

// ─── Trash ───────────────────────────────────────────────────────────

export interface TrashResponse {
  trashId: string;
  deletedBy: string;
  deletedAt: string;
  permanent: boolean;
  restoredBy: string | null;
  restoredAt: string | null;
  restored: boolean;
  documentId: string;
  name: string;
  ownedBy: string;
  description: string;
  workspaceId: string;
  isFolder: boolean;
  size: number;
  displaySize: string;
  type: string;
  mimeType: string;
  originalFileName: string;
  parentId: string;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string;
  previewUrl: string;
}

// ─── Tags ────────────────────────────────────────────────────────────

export interface CreateTagRequest {
  tagName: string;
  color: string;
}

export interface TagResponse {
  id: string;
  tagName: string;
  color: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDocumentTagsRequest {
  documentId: string;
  tagIds: string[];
}

// ─── Bucket Manager ──────────────────────────────────────────────────

export interface CreateStoragePolicyRequest {
  folderTypeId: string;
  triggerLifecycleState: string;
  targetBucket: string;
}

export interface UpdateStoragePolicyRequest {
  triggerLifecycleState?: string;
  targetBucket?: string;
  enabled?: boolean;
}

export interface StoragePolicyResponse {
  storagePolicyId: string;
  folderTypeId: string;
  folderTypeName: string;
  triggerLifecycleState: string;
  targetBucket: string;
  enabled: boolean;
  tenantId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

// ─── NLP ─────────────────────────────────────────────────────────────

export interface NlpRawTextResponse {
  fId: string;
  raw_text: string;
}

// ─── LTI ─────────────────────────────────────────────────────────────

export interface UpdateFolderByAttributeRequest {
  searchAttributeName: string;
  searchAttributeValue: string;
  newAttributeName: string;
  newAttributeValue: string;
  newLifecycleState: string;
}

// ─── Batch Upload ────────────────────────────────────────────────────

export interface BatchUploadResponse {
  successful: DocumentResponse[];
  failed: { fileName: string; error: string }[];
  totalFiles: number;
  successCount: number;
  failCount: number;
}

// ─── Resource Response (polymorphic) ─────────────────────────────────

export type ResourceResponse = (FolderResponse | DocumentResponse) & {
  resourceType?: 'FOLDER' | 'DOCUMENT';
};

// ─── API Version Info ────────────────────────────────────────────────

export type ApiVersionType = '1.0' | '1.1' | '1.2' | '1.3';

export interface UploadType {
  key: 'multipart' | 'stream' | 'presigned';
  label: string;
  description: string;
  version: ApiVersionType;
}
