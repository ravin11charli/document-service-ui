import { useTagsList } from '../../hooks/useTags';

interface TagPillProps {
  /** Tag name (as stored on documents/folders) */
  name: string;
  size?: 'xs' | 'sm';
  className?: string;
}

const FALLBACK = '#6B7280'; // gray-500

/**
 * Stable hash → fallback color when the tag is not in the registry.
 * Same input always produces the same color.
 */
function hashColor(str: string): string {
  const palette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
    '#14B8A6', '#A855F7', '#84CC16', '#0EA5E9',
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return palette[h % palette.length];
}

/** Convert hex → rgba with given alpha */
function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return `rgba(107,114,128,${alpha})`;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Renders a tag chip using the tag's registered color (from /api/tag) when
 * available, falling back to a deterministic palette so the same tag name
 * always gets the same color across the app.
 */
export function TagPill({ name, size = 'xs', className }: TagPillProps) {
  const { data } = useTagsList();
  const tags = data?.data || [];
  const registered = tags.find((t) => t.tagName === name);
  const color = registered?.color || hashColor(name) || FALLBACK;

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-px text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${padding} ${className || ''}`}
      style={{
        backgroundColor: hexToRgba(color, 0.12),
        borderColor: hexToRgba(color, 0.35),
        color,
      }}
      title={name}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="truncate max-w-[120px]">{name}</span>
    </span>
  );
}

interface TagListProps {
  tags?: string[] | null;
  max?: number;
  size?: 'xs' | 'sm';
  className?: string;
}

/** Convenience: render an array of tag names with a "+N more" overflow chip. */
export function TagList({ tags, max, size = 'xs', className }: TagListProps) {
  if (!tags || tags.length === 0) return null;
  const visible = max ? tags.slice(0, max) : tags;
  const overflow = max ? tags.length - visible.length : 0;
  return (
    <div className={`inline-flex items-center gap-1 flex-wrap ${className || ''}`}>
      {visible.map((t) => (
        <TagPill key={t} name={t} size={size} />
      ))}
      {overflow > 0 && (
        <span className="text-[10px] text-gray-400 font-medium">+{overflow}</span>
      )}
    </div>
  );
}
