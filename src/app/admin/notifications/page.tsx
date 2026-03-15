'use client';

import * as React from 'react';
import { useCollection } from '@/firebase';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { SystemNotification } from '@/lib/types';
import { SectionHeader } from '@/components/section-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserMinus, FileMinus, Clock, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function AdminNotificationsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const notificationsQuery = useMemoFirebase(
    () => query(collection(firestore, 'system_notifications'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  const { data: notifications, isLoading } = useCollection<SystemNotification>(notificationsQuery);

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'system_notifications', id));
      toast({
        title: 'Notification removed',
        description: 'The notification has been cleared.',
      });
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'account_deleted':
        return <UserMinus className="h-5 w-5 text-red-500" />;
      case 'course_deleted':
        return <FileMinus className="h-5 w-5 text-orange-500" />;
      default:
        return <BellOff className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'account_deleted':
        return 'destructive';
      case 'course_deleted':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title="System Notifications"
        subtitle="Monitor critical events such as user departures and course removals."
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Card key={notif.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start gap-4 p-6">
                  <div className="bg-muted rounded-full p-2 mt-1">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{notif.message}</h3>
                        <Badge variant={getBadgeVariant(notif.type)}>
                          {notif.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{notif.details}</p>
                    <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {notif.createdAt?.seconds 
                          ? formatDistanceToNow(new Date(notif.createdAt.seconds * 1000), { addSuffix: true }) 
                          : 'just now'}
                      </span>
                      <span>User ID: {notif.userId}</span>
                      <span>Role: {notif.userRole}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg">
          <BellOff className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg">No notifications yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            There are no system events to report at this time.
          </p>
        </div>
      )}
    </div>
  );
}