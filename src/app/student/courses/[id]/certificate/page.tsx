import { getUserById, getCourseById } from '@/lib/mock-data';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { notFound } from 'next/navigation';

const STUDENT_ID = '3'; // Mock current student

export default function CertificatePage({ params }: { params: { id: string } }) {
  const student = getUserById(STUDENT_ID);
  const course = getCourseById(params.id);

  if (!student || !course) {
    notFound();
  }

  const completionDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-background flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl rounded-lg border-4 border-primary bg-card p-8 shadow-2xl relative">
        <div className="absolute inset-0 bg-[url('/certificate-bg.svg')] bg-cover opacity-5"></div>
        <div className="relative text-center">
            <div className="flex justify-center mb-6">
                 <Logo />
            </div>

            <p className="font-headline text-xl uppercase tracking-widest text-muted-foreground">
                Certificate of Completion
            </p>
            <p className="mt-8 text-lg">This certificate is proudly presented to</p>
            <h1 className="font-headline text-5xl font-bold text-primary my-4">
                {student.name}
            </h1>
            <p className="text-lg">for successfully completing the course</p>
            <h2 className="font-headline text-3xl font-semibold my-4">{course.title}</h2>
            <p className="text-md text-muted-foreground">on {completionDate}</p>

            <div className="mt-12 flex justify-between items-center max-w-sm mx-auto">
                <div className="text-center w-1/2">
                    <p className="font-semibold text-sm border-t border-dashed pt-2">Instructor</p>
                    <p className="text-xs text-muted-foreground">{getUserById(course.teacherId)?.name}</p>
                </div>
                <div className="text-center w-1/2">
                    <p className="font-semibold text-sm border-t border-dashed pt-2">Platform</p>
                    <p className="text-xs text-muted-foreground">CampusConnect</p>
                </div>
            </div>
        </div>
      </div>
      <Button className="mt-8">
        <Download className="mr-2 h-4 w-4" />
        Download Certificate
      </Button>
    </div>
  );
}

