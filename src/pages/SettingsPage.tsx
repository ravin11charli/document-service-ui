import { useConfigStore } from '../stores/configStore';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { VersionSelector } from '../components/shared/VersionSelector';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const config = useConfigStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configure tenant and API settings</p>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Headers</h2>
        <Input label="X-Tenant-Id" value={config.tenantId} onChange={(e) => config.setTenantId(e.target.value)} />
        <Input label="X-User-Id" value={config.userId} onChange={(e) => config.setUserId(e.target.value)} />
        <Input label="X-Workspace-Id" value={config.workspaceId} onChange={(e) => config.setWorkspaceId(e.target.value)} />
        <VersionSelector value={config.apiVersion} onChange={config.setApiVersion} label="Default X-API-Version" />
        <p className="text-xs text-gray-500">
          Base URL: <span className="font-mono">{import.meta.env.VITE_API_BASE_URL}</span>
        </p>
        <button
          onClick={() => toast.success('Settings saved (auto-persisted)')}
          className="text-sm text-blue-600 hover:underline"
        >
          Settings auto-save to localStorage
        </button>
      </Card>
    </div>
  );
}
