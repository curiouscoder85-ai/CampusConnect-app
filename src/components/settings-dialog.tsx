'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { firebaseConfig } from '@/firebase/config';
import packageJson from '@/../package.json';
import { useApp } from '@/components/app-provider';
import { Input } from './ui/input';
import { useAuth } from './auth-provider';
import { DeleteAccountAlert } from './delete-account-alert';
import { AboutUsDialog } from './about-us-dialog';
import { Info, Trash2 } from 'lucide-react';
import { useFirestore } from '@/firebase/provider';
import { collection, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const { user, logout } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { appName, setAppName } = useApp();
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [currentAppName, setCurrentAppName] = React.useState(appName);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [isAboutUsOpen, setAboutUsOpen] = React.useState(false);

  React.useEffect(() => {
    setCurrentAppName(appName);
  }, [appName, isOpen]);

  const handleSave = () => {
    setAppName(currentAppName);
    onOpenChange(false);
  };
  
  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // 1. Log the deletion event for admin
      const notificationsCol = collection(firestore, 'system_notifications');
      addDocumentNonBlocking(notificationsCol, {
        type: 'account_deleted',
        message: 'Account Deleted',
        details: `User ${user.name} (${user.email}) has deleted their account and left the platform.`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        createdAt: serverTimestamp(),
      });

      // 2. Delete user document
      const userRef = doc(firestore, 'users', user.id);
      await deleteDoc(userRef);

      toast({
        title: 'Account Deleted',
        description: 'Your account has been successfully removed.',
      });

      // 3. Logout
      logout();
      setDeleteAlertOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete your account. Please try again.',
      });
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Application Settings</DialogTitle>
            <DialogDescription>
              View application information and manage site-wide settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Information</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="app-name">App Name</Label>
                <Input
                  id="app-name"
                  className="w-48 text-sm font-mono"
                  value={currentAppName}
                  onChange={(e) => setCurrentAppName(e.target.value)}
                  disabled={user?.role !== 'admin'}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>App Version</Label>
                <span className="text-sm font-mono">{packageJson.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <Label>Firebase Project</Label>
                <span className="text-sm font-mono">{firebaseConfig.projectId}</span>
              </div>
              
            </div>
            
            <Separator />
            
            <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => setAboutUsOpen(true)}>
                    <Info className="mr-2" /> About Us
                </Button>
            </div>


            {user?.role === 'admin' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Admin Functions</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance-mode" className="flex flex-col gap-1">
                      <span>Maintenance Mode</span>
                      <span className="font-normal text-xs text-muted-foreground">
                        Temporarily disable access for non-admins.
                      </span>
                    </Label>
                    <Switch
                      id="maintenance-mode"
                      checked={maintenanceMode}
                      onCheckedChange={setMaintenanceMode}
                    />
                  </div>
                </div>
              </>
            )}

            <Separator />
            
            <div className="space-y-2">
                 <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                 <Button variant="destructive" className="w-full justify-start" onClick={() => setDeleteAlertOpen(true)}>
                    <Trash2 className="mr-2" /> Delete My Account
                </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {user?.role === 'admin' && (
               <Button type="button" onClick={handleSave}>Save Changes</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AboutUsDialog isOpen={isAboutUsOpen} onOpenChange={setAboutUsOpen} />

      <DeleteAccountAlert
        isOpen={isDeleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onConfirm={handleDeleteAccount}
      />
    </>
  );
}