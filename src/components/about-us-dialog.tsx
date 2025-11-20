'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Logo from './logo';
import { useApp } from './app-provider';

interface AboutUsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AboutUsDialog({ isOpen, onOpenChange }: AboutUsDialogProps) {
  const { appName } = useApp();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <Logo />
          <DialogTitle className="text-2xl font-headline pt-2">{appName}</DialogTitle>
          <DialogDescription>
            A modern, feature-rich E-Learning platform.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-center text-muted-foreground">
          <p>
            Welcome to {appName}, your home for collaborative and engaging online education. Our mission is to provide an intuitive and powerful platform for students and teachers to connect, learn, and grow.
          </p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
