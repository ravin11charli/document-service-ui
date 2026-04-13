import { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useDocumentDetail, useUpdateDocument } from '../../hooks/useDocuments';
import { useFolderDetail, useUpdateFolder } from '../../hooks/useFolders';
import { useDocumentTypeDetail, useDocumentTypeByName } from '../../hooks/useDocumentTypes';
import { useFolderTypeDetail } from '../../hooks/useFolderTypes';
import type { DocumentTypeAttributeDto, FolderTypeAttributeDto } from '../../types/api';
import { getResourceAttributes } from '../../utils/resourceAttributes';

type AttributeSchema = DocumentTypeAttributeDto | FolderTypeAttributeDto;

interface Props {
  open: boolean;
  onClose: () => void;
  kind: 'document' | 'folder';
  resourceId: string;
  resourceName: string;
  /** The type id (documentTypeId or folderTypeId) — used to fetch schema */
  typeId?: string | null;
  /** Schema may also be passed directly if already known */
  schemaOverride?: AttributeSchema[];
  currentAttributes: Record<string, unknown> | null | undefined;
}

/**
 * Render a typed input for an attribute, falling back to string when no schema entry.
 */
function ValueEditor({
  schema,
  value,
  onChange,
}: {
  schema?: AttributeSchema;
  value: string;
  onChange: (v: string) => void;
}) {
  const type = schema?.attributeType?.toLowerCase() || 'string';

  const cls =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all';

  if (type === 'boolean') {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
        <option value="">Select...</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }
  if (type === 'number' || type === 'integer') {
    return <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />;
  }
  if (type === 'date') {
    return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />;
  }
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder="value" />;
}

export function EditAttributesModal({
  open,
  onClose,
  kind,
  resourceId,
  resourceName,
  typeId,
  schemaOverride,
  currentAttributes,
}: Props) {
  // Always refetch the resource when the modal is open so we never display
  // stale attributes from a list response that might not include them.
  const docDetailQuery = useDocumentDetail(open && kind === 'document' ? resourceId : '');
  const folderDetailQuery = useFolderDetail(open && kind === 'folder' ? resourceId : '');

  const detailLoading = kind === 'document' ? docDetailQuery.isLoading : folderDetailQuery.isLoading;
  const freshResource = kind === 'document' ? docDetailQuery.data?.data : folderDetailQuery.data?.data;

  // Resolved type id (prefer fresh data, fall back to props). Note: backend's
  // DocumentResponse currently does NOT include documentType.id, so for
  // documents we also fall back to a search-by-name lookup.
  const resolvedTypeId =
    kind === 'document'
      ? ((freshResource as any)?.documentType?.id || typeId || '')
      : ((freshResource as any)?.folderTypeId || typeId || '');

  const documentTypeName =
    kind === 'document' ? (freshResource as any)?.documentType?.documentTypeName : null;

  // Fetch type schema lazily depending on kind
  const docTypeById = useDocumentTypeDetail(kind === 'document' ? resolvedTypeId : '');
  const docTypeByName = useDocumentTypeByName(
    kind === 'document' && !resolvedTypeId && documentTypeName ? documentTypeName : ''
  );
  const folderTypeQuery = useFolderTypeDetail(kind === 'folder' ? resolvedTypeId : '');

  const updateDoc = useUpdateDocument();
  const updateFolder = useUpdateFolder();
  const isPending = kind === 'document' ? updateDoc.isPending : updateFolder.isPending;

  const schema: AttributeSchema[] = useMemo(() => {
    // Prefer the type detail fetched here (it has full schema, including
    // attributes that don't yet have a value). Then by-name lookup. Then
    // schemaOverride. Then the (filtered) nested list on the resource itself.
    if (kind === 'document') {
      const fromTypeById = docTypeById.data?.data?.attributes;
      if (fromTypeById && fromTypeById.length > 0) return fromTypeById;
      const fromTypeByName = docTypeByName.data?.data?.attributes;
      if (fromTypeByName && fromTypeByName.length > 0) return fromTypeByName;
      if (schemaOverride && schemaOverride.length > 0) return schemaOverride;
      const fromDocDetail = (freshResource as any)?.documentType?.attributes;
      if (fromDocDetail && fromDocDetail.length > 0) return fromDocDetail;
      return [];
    }
    const fromTypeDetail = folderTypeQuery.data?.data?.attributes;
    if (fromTypeDetail && fromTypeDetail.length > 0) return fromTypeDetail;
    if (schemaOverride && schemaOverride.length > 0) return schemaOverride;
    return [];
  }, [schemaOverride, kind, docTypeById.data, docTypeByName.data, folderTypeQuery.data, freshResource]);

  const schemaByName = useMemo(() => {
    const m: Record<string, AttributeSchema> = {};
    schema.forEach((s) => { m[s.attributeName] = s; });
    return m;
  }, [schema]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Initialize values exactly once per "open session", as soon as data is ready.
  // Re-opening the modal (or switching resources) clears the flag so we re-init.
  const initSessionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      initSessionRef.current = null;
      return;
    }
    // Wait until the fresh fetch settles. If the caller passed currentAttributes,
    // we can initialize immediately from that and let the fresh fetch overwrite later.
    if (detailLoading && !currentAttributes) return;

    const sessionKey = `${resourceId}:${freshResource ? 'fresh' : 'prop'}`;
    if (initSessionRef.current === sessionKey) return;

    // Source priority: derived map from fresh resource > prop currentAttributes
    const fromFresh = freshResource ? getResourceAttributes(freshResource, kind) : {};
    const sourceAttrs =
      Object.keys(fromFresh).length > 0
        ? fromFresh
        : (currentAttributes ?? {});

    const initial: Record<string, string> = {};
    Object.entries(sourceAttrs).forEach(([k, v]) => {
      initial[k] = v == null ? '' : String(v);
    });
    setValues(initial);
    setRemoved(new Set());
    setNewKey('');
    setNewValue('');
    initSessionRef.current = sessionKey;
  }, [open, resourceId, freshResource, detailLoading, currentAttributes, kind]);

  const presentKeys = Object.keys(values).filter((k) => !removed.has(k));
  const availableSchemaKeys = schema.filter((s) => !presentKeys.includes(s.attributeName)).map((s) => s.attributeName);

  const handleAdd = () => {
    const k = newKey.trim();
    if (!k) return;
    if (presentKeys.includes(k)) return;
    setValues({ ...values, [k]: newValue });
    setRemoved((r) => {
      const next = new Set(r);
      next.delete(k);
      return next;
    });
    setNewKey('');
    setNewValue('');
  };

  const handleRemove = (k: string) => {
    setRemoved((r) => {
      const next = new Set(r);
      next.add(k);
      return next;
    });
  };

  const handleUndoRemove = (k: string) => {
    setRemoved((r) => {
      const next = new Set(r);
      next.delete(k);
      return next;
    });
  };

  const handleSave = () => {
    // Build attribute payload — keep present (non-removed) values
    const finalAttrs: Record<string, string> = {};
    presentKeys.forEach((k) => { finalAttrs[k] = values[k] ?? ''; });
    const removedList = Array.from(removed);

    if (kind === 'document') {
      updateDoc.mutate(
        { id: resourceId, data: { attributes: finalAttrs, removeAttributes: removedList.length > 0 ? removedList : undefined } },
        { onSuccess: () => onClose() }
      );
    } else {
      // Folder: include removed keys with null value so backend can clear them
      const folderAttrs: Record<string, unknown> = { ...finalAttrs };
      removedList.forEach((k) => { folderAttrs[k] = null; });
      updateFolder.mutate(
        { id: resourceId, data: { attributes: folderAttrs } },
        { onSuccess: () => onClose() }
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Attributes" size="lg">
      <div className="space-y-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {kind === 'document' ? 'Document' : 'Folder'} · <span className="font-medium">{resourceName}</span>
        </p>

        {/* Current Attributes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Current Attributes ({presentKeys.length})
            </h4>
            {schema.length > 0 && (
              <span className="text-[10px] text-gray-400">{schema.length} defined in {kind === 'document' ? 'document' : 'folder'} type</span>
            )}
          </div>

          {presentKeys.length === 0 && removed.size === 0 ? (
            <div className="text-xs text-gray-400 italic py-3 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              No attributes set yet
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {presentKeys.map((k) => {
                const sc = schemaByName[k];
                return (
                  <div key={k} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{k}</span>
                        {sc && (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            {sc.attributeType}
                          </span>
                        )}
                        {sc?.isMandatory && (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                            Required
                          </span>
                        )}
                      </div>
                      <ValueEditor
                        schema={sc}
                        value={values[k] || ''}
                        onChange={(v) => setValues({ ...values, [k]: v })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(k)}
                      className="shrink-0 mt-6 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      aria-label={`Remove ${k}`}
                      title="Remove attribute"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}

              {/* Removed (pending save) */}
              {Array.from(removed).map((k) => (
                <div key={`removed-${k}`} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40">
                  <div className="flex items-center gap-2">
                    <Trash2 size={12} className="text-red-500" />
                    <span className="text-xs text-red-600 dark:text-red-400 line-through">{k}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUndoRemove(k)}
                    className="text-[10px] text-blue-500 hover:underline"
                  >
                    Undo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Attribute */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Add Attribute
          </h4>
          {schema.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              This {kind} has no type assigned — assign a {kind} type to add attributes.
            </p>
          ) : availableSchemaKeys.length === 0 ? (
            <p className="text-xs text-gray-400 italic">All schema attributes are already set.</p>
          ) : (
            <div className="flex gap-2 items-stretch">
              <div className="flex-1">
                <select
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                >
                  <option value="">Choose attribute...</option>
                  {availableSchemaKeys.map((k) => {
                    const sc = schemaByName[k];
                    return (
                      <option key={k} value={k}>
                        {k} ({sc?.attributeType}{sc?.isMandatory ? ' · required' : ''})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex-1">
                <ValueEditor
                  schema={schemaByName[newKey]}
                  value={newValue}
                  onChange={setNewValue}
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAdd}
                disabled={!newKey.trim()}
                icon={<Plus size={14} />}
              >
                Add
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={isPending}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
}
