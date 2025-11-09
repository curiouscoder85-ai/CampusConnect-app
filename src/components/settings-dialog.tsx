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

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const { appName, setAppName } = useApp();
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [currentAppName, setCurrentAppName] = React.useState(appName);

  React.useEffect(() => {
    setCurrentAppName(appName);
  }, [appName, isOpen]);

  const handleSave = () => {
    setAppName(currentAppName);
    onOpenChange(false);
  };

  return (
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
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Functions</h3>
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
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
