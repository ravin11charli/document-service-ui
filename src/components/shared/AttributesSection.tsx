import { Edit2, AlertCircle } from 'lucide-react';
import { useDocumentTypeDetail, useDocumentTypeByName } from '../../hooks/useDocumentTypes';
import { useFolderTypeDetail } from '../../hooks/useFolderTypes';
import type { DocumentTypeAttributeDto, FolderTypeAttributeDto } from '../../types/api';
import { getResourceAttributes } from '../../utils/resourceAttributes';

type AttributeSchema = DocumentTypeAttributeDto | FolderTypeAttributeDto;

interface Props {
  /** Pass the live resource (document or folder). The component derives both
   *  the current attribute values and the schema from it. */
  resource: any | null;
  kind: 'document' | 'folder';
  /** Pre-fetched schema to override what the component would otherwise fetch. */
  schemaOverride?: AttributeSchema[];
  onEdit?: () => void;
}

/**
 * Renders an "Attributes" section. Shows every attribute currently set on the
 * resource. If a type schema is available, attribute names from the schema get
 * a type/required badge and missing-required is highlighted.
 */
export function AttributesSection({ resource, kind, schemaOverride, onEdit }: Props) {
  // The backend's DocumentResponse currently doesn't expose `documentType.id`,
  // so when a document type name is the only thing we have, fall back to a
  // search-by-name lookup to fetch the full schema.
  const documentTypeId = kind === 'document' ? resource?.documentType?.id : null;
  const documentTypeName = kind === 'document' ? resource?.documentType?.documentTypeName : null;
  const folderTypeId = kind === 'folder' ? resource?.folderTypeId : null;

  const docTypeById = useDocumentTypeDetail(
    kind === 'document' && !schemaOverride && documentTypeId ? documentTypeId : ''
  );
  const docTypeByName = useDocumentTypeByName(
    kind === 'document' && !schemaOverride && !documentTypeId && documentTypeName ? documentTypeName : ''
  );
  const folderType = useFolderTypeDetail(
    kind === 'folder' && !schemaOverride && folderTypeId ? folderTypeId : ''
  );

  // Schema resolution order: explicit override → fetched-by-id → fetched-by-name
  // → embedded (filtered) list on the resource.
  const fetchedSchema =
    kind === 'document'
      ? docTypeById.data?.data?.attributes || docTypeByName.data?.data?.attributes
      : folderType.data?.data?.attributes;

  const schema: AttributeSchema[] =
    schemaOverride ||
    fetchedSchema ||
    (kind === 'document' ? resource?.documentType?.attributes : []) ||
    [];

  const current = getResourceAttributes(resource, kind);
  const schemaByName: Record<string, AttributeSchema> = {};
  schema.forEach((s) => { schemaByName[s.attributeName] = s; });

  // Union of every key we want to show: schema-defined keys + currently-set keys.
  // Use schema order first, then any currently-set keys not in schema.
  const schemaKeys = schema.map((s) => s.attributeName);
  const extraKeys = Object.keys(current).filter((k) => !schemaKeys.includes(k));
  const allKeys = [...schemaKeys, ...extraKeys];

  if (allKeys.length === 0) return null;

  const formatValue = (v: unknown) => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Attributes
        </p>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] text-blue-500 hover:text-blue-600 inline-flex items-center gap-1 font-medium"
          >
            <Edit2 size={11} /> Edit
          </button>
        )}
      </div>

      <div className="space-y-1">
        {allKeys.map((k) => {
          const sc = schemaByName[k];
          const val = formatValue(current[k]);
          const missing = val === null && sc?.isMandatory;
          return (
            <div key={k} className="flex items-start justify-between gap-3 py-1.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{k}</span>
                  {sc && (
                    <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      {sc.attributeType}
                    </span>
                  )}
                  {sc?.isMandatory && (
                    <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      Required
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-right break-all max-w-[55%]">
                {val !== null ? (
                  val
                ) : missing ? (
                  <span className="text-red-500 inline-flex items-center gap-1">
                    <AlertCircle size={10} /> missing
                  </span>
                ) : (
                  <span className="text-gray-300 italic">empty</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
