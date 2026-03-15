'use client';

import * as React from 'react';
import { useCollection } from '@/firebase';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collection } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { UsersTable } from './_components/users-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Users } from 'lucide-react';
import { AddUserDialog } from './_components/add-user-dialog';
import { Input } from '@/components/ui/input';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading, forceRefetch } = useCollection<User>(usersQuery);

  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    if (!searchTerm) return users;
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(lowerSearch) || 
      user.email.toLowerCase().includes(lowerSearch) ||
      user.role.toLowerCase().includes(lowerSearch)
    );
  }, [users, searchTerm]);

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Add, view, and manage all user accounts on the platform.
            </p>
          </div>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email or role..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredUsers.length > 0 ? (
          <UsersTable users={filteredUsers} onUserAction={forceRefetch} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg">No users found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {searchTerm ? `We couldn't find any users matching "${searchTerm}".` : "There are no users registered on the platform yet."}
            </p>
            {searchTerm && (
              <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2">
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>
      <AddUserDialog
        isOpen={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onUserAdded={forceRefetch}
      />
    </>
  );
}
