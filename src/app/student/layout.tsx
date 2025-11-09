import AuthGuard from '@/components/auth-guard';
import { Header } from '@/components/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { StudentSidebar } from './_components/student-sidebar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="student">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <StudentSidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <SidebarInset>
              <main className="flex-1 p-4 md:p-8">{children}</main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
