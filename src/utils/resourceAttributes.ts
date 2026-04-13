/**
 * Helpers for extracting attribute key/value pairs from a resource (document or
 * folder), regardless of where the backend hides them.
 *
 * Documents — the backend currently does NOT serialize the top-level
 * `attributes` map on DocumentResponse. Instead, the actual values are stuffed
 * into `documentType.attributes[i].value`, but only for schema fields that have
 * a non-empty value. This helper unifies the lookup so the rest of the UI can
 * just call `getResourceAttributes(resource, kind)` and get a clean map.
 *
 * Folders — FolderResponse correctly returns `attributes`, so we just pass it
 * through.
 */

export type AttributeMap = Record<string, unknown>;

export function getResourceAttributes(
  resource: any | null | undefined,
  kind: 'document' | 'folder'
): AttributeMap {
  if (!resource) return {};

  // 1. Top-level attributes map (folder always, document if backend ever sends it)
  const top = resource.attributes;
  if (top && typeof top === 'object' && Object.keys(top).length > 0) {
    return { ...top };
  }

  // 2. Document fallback — values embedded inside documentType.attributes[i].value
  if (kind === 'document') {
    const embeddedSchema = resource.documentType?.attributes;
    if (Array.isArray(embeddedSchema) && embeddedSchema.length > 0) {
      const out: AttributeMap = {};
      embeddedSchema.forEach((a: any) => {
        if (a && a.attributeName != null && a.value != null && a.value !== '') {
          out[a.attributeName] = a.value;
        }
      });
      return out;
    }
  }

  return {};
}
