import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { DocumentTypeAttributeDto, FolderTypeAttributeDto } from '../../types/api';

type AttributeSchema = FolderTypeAttributeDto | DocumentTypeAttributeDto;

interface DynamicAttributeFormProps {
  schema: AttributeSchema[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  errors?: Record<string, string>;
}

export function DynamicAttributeForm({ schema, values, onChange, errors }: DynamicAttributeFormProps) {
  const handleChange = (name: string, value: string) => {
    onChange({ ...values, [name]: value });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        Attributes
      </h4>
      {schema.map((attr) => {
        const name = attr.attributeName;
        const type = attr.attributeType?.toLowerCase() || 'string';
        const required = attr.isMandatory;
        const error = errors?.[name];

        if (type === 'boolean') {
          return (
            <Select
              key={name}
              label={name}
              required={required}
              value={values[name] || ''}
              onChange={(e) => handleChange(name, e.target.value)}
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ]}
              placeholder="Select..."
              error={error}
            />
          );
        }

        if (type === 'number' || type === 'integer') {
          return (
            <Input
              key={name}
              label={name}
              type="number"
              required={required}
              value={values[name] || ''}
              onChange={(e) => handleChange(name, e.target.value)}
              error={error}
            />
          );
        }

        if (type === 'date') {
          return (
            <Input
              key={name}
              label={name}
              type="date"
              required={required}
              value={values[name] || ''}
              onChange={(e) => handleChange(name, e.target.value)}
              error={error}
            />
          );
        }

        return (
          <Input
            key={name}
            label={name}
            type="text"
            required={required}
            value={values[name] || ''}
            onChange={(e) => handleChange(name, e.target.value)}
            placeholder={`Enter ${name}`}
            error={error}
          />
        );
      })}
    </div>
  );
}

export function validateAttributes(
  schema: AttributeSchema[],
  values: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {};
  schema.forEach((attr) => {
    if (attr.isMandatory && !values[attr.attributeName]?.trim()) {
      errors[attr.attributeName] = `${attr.attributeName} is required`;
    }
  });
  return errors;
}
