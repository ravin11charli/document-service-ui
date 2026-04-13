import { useState } from 'react';
import { Brain, Search } from 'lucide-react';
import { nlpService } from '../api/nlpService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function NlpPage() {
  const [fId, setFId] = useState('');
  const [rawText, setRawText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!fId.trim()) return;
    setLoading(true);
    setRawText(null);
    try {
      const result = await nlpService.getRawText(fId);
      setRawText(result.raw_text || 'No text found');
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch raw text');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">NLP Raw Text</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">View extracted raw text from documents</p>
      </div>

      <Card className="p-6">
        <div className="flex gap-3">
          <Input
            label="Document ID (fId)"
            value={fId}
            onChange={(e) => setFId(e.target.value)}
            placeholder="Enter document ID"
            className="flex-1"
          />
          <div className="pt-6">
            <Button onClick={handleSearch} loading={loading} icon={<Search size={18} />}>Fetch</Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : rawText !== null ? (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="text-purple-500" size={20} />
            <h3 className="font-semibold">Extracted Text</h3>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
            {rawText}
          </pre>
        </Card>
      ) : null}
    </div>
  );
}
