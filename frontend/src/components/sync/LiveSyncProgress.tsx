import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LiveSyncProgressProps {
  sessionId: string;
}

export function LiveSyncProgress({ sessionId }: LiveSyncProgressProgress) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing');
  const [recordsProcessed, setRecordsProcessed] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [recordType, setRecordType] = useState('records');

  useEffect(() => {
    const eventSource = new EventSource(`/api/sync/stream/${sessionId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.progress);
      setStatus(data.status);
      setRecordsProcessed(data.processed_records);
      setTotalRecords(data.total_records);
      setRecordType(data.record_type || 'records');
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Sync Progress</CardTitle>
        <CardDescription>{status}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="w-full" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{recordsProcessed} / {totalRecords} {recordType}</span>
          <span>{progress}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
