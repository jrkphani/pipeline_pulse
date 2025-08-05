import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';


export default function DashboardPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Dashboard is working! Chart components have been temporarily disabled due to recharts compatibility issues.</p>
          <Button className="mt-4">
            Sync Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}