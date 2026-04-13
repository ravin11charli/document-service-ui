import type { ApiVersionType } from '../../types/api';
import { Select } from '../ui/Select';

interface VersionSelectorProps {
  value: ApiVersionType;
  onChange: (v: ApiVersionType) => void;
  versions?: ApiVersionType[];
  label?: string;
}

const ALL_VERSIONS: { value: ApiVersionType; label: string }[] = [
  { value: '1.0', label: 'v1.0 (Legacy)' },
  { value: '1.1', label: 'v1.1 (Current)' },
  { value: '1.2', label: 'v1.2 (Stream)' },
  { value: '1.3', label: 'v1.3 (Presigned)' },
];

export function VersionSelector({ value, onChange, versions, label = 'API Version' }: VersionSelectorProps) {
  const opts = versions
    ? ALL_VERSIONS.filter((v) => versions.includes(v.value))
    : ALL_VERSIONS;

  return (
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as ApiVersionType)}
      options={opts}
    />
  );
}
