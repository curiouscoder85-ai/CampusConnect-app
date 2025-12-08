import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import type { LucideIcon } from 'lucide-react';

interface DashboardStatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  isLoading?: boolean;
}

export function DashboardStatCard({ title, value, description, icon: Icon, isLoading }: DashboardStatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <Skeleton className="h-8 w-1/4 mt-1" />
        ) : (
            <div className="text-2xl font-bold">{value}</div>
        )}
        {description && !isLoading && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
         {isLoading && (
            <Skeleton className="h-4 w-1/2 mt-1" />
        )}
      </CardContent>
    </Card>
  );
}
