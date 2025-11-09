'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditUserDialog } from './edit-user-dialog';

interface UsersTableProps {
  users: User[];
}

const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };

export function UsersTable({ users }: UsersTableProps) {
  const [editingUser, setEditingUser] = React.useState<User | null>(null);

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <EditUserDialog
        user={editingUser}
        isOpen={!!editingUser}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingUser(null);
          }
        }}
      />
    </>
  );
}
