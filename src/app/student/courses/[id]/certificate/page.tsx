
'use client';

import React, { useRef } from 'react';
import { notFound } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Course, User } from '@/lib/types';

import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Download, Award, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const certificateRef = useRef<HTMLDivElement>(null);

  const courseRef = useMemoFirebase(() => doc(firestore, 'courses', id), [firestore, id]);
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);
  
  const teacherRef = useMemoFirebase(() => (course ? doc(firestore, 'users', course.teacherId) : null), [firestore, course]);
  const { data: teacher, isLoading: teacherLoading } = useDoc<User>(teacherRef);

  const isLoading = isUserLoading || courseLoading || teacherLoading;

  const handleDownload = async () => {
    const input = certificateRef.current;
    if (!input) return;

    // Temporarily force light theme for canvas rendering
    const originalClasses = input.className;
    input.className = `${originalClasses} light bg-background`;


    try {
      const canvas = await html2canvas(input, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: '#ffffff', // Explicitly set a white background
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Certificate-${course?.title.replace(/\s+/g, '-')}.pdf`);

    } finally {
        // Restore original classes
        input.className = originalClasses;
    }
  };


  if (isLoading) {
    return <CertificateSkeleton />;
  }

  if (!user || !course) {
    notFound();
  }

  const completionDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const certificateId = `CC-${id.slice(0, 4).toUpperCase()}-${user.id.slice(0, 4).toUpperCase()}`;

  return (
    <div className="bg-muted/40 flex flex-col items-center justify-center p-4 sm:p-8 font-serif">
      <div className="w-full max-w-4xl">
        <div 
          ref={certificateRef} 
          className="bg-background shadow-2xl aspect-[1.414/1] w-full p-2"
        >
          <div className="relative h-full w-full p-4 border-2 border-primary/20">
            <div className="absolute inset-0 -m-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] border-[10px] border-primary/10"></div>
            <div className="relative h-full w-full flex flex-col items-center justify-center text-center p-8">
              
              <div className="flex items-center gap-4">
                <Logo />
              </div>

              <p className="mt-8 text-lg uppercase tracking-widest text-muted-foreground">
                Certificate of Completion
              </p>
              
              <Separator className="my-6 bg-primary/20 w-1/3 mx-auto" />
              
              <p className="text-base italic">This is to certify that</p>
              
              <h1 className="font-headline text-5xl font-bold text-primary my-4">
                {user.name}
              </h1>
              
              <p className="max-w-md text-base leading-relaxed">
                has successfully completed all requirements for the course
              </p>
              
              <h2 className="font-headline text-4xl font-semibold my-6 leading-tight">{course.title}</h2>
              
              <div className="flex-grow"></div>
              
              <div className="grid grid-cols-3 items-end gap-8 w-full max-w-2xl mt-12">
                <div className="text-center">
                   <p className="font-semibold text-lg border-b border-muted-foreground pb-1">{teacher?.name || 'Instructor'}</p>
                   <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Lead Instructor</p>
                </div>
                <div className="flex justify-center items-center">
                  <div className="relative">
                    <Award className="h-24 w-24 text-amber-500/80" strokeWidth={1} />
                    <ShieldCheck className="h-10 w-10 text-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="hsl(var(--primary))" stroke="none" />
                  </div>
                </div>
                 <div className="text-center">
                   <p className="font-semibold text-lg border-b border-muted-foreground pb-1">{completionDate}</p>
                   <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Date of Completion</p>
                </div>
              </div>
              
               <p className="text-xs text-muted-foreground mt-4">Certificate ID: {certificateId}</p>

            </div>
          </div>
        </div>
      </div>
      <Button onClick={handleDownload} className="mt-8 font-headline">
        <Download className="mr-2 h-4 w-4" />
        Download Certificate
      </Button>
    </div>
  );
}


function CertificateSkeleton() {
  return (
    <div className="bg-muted/40 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <Skeleton className="w-full aspect-[1.414/1]" />
      </div>
      <Skeleton className="h-10 w-64 mt-8" />
    </div>
  )
}
