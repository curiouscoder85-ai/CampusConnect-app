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

  const handleDownload = () => {
    const input = certificateRef.current;
    if (!input) return;

    html2canvas(input, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      backgroundColor: null,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Certificate-${course?.title.replace(/\s+/g, '-')}.pdf`);
    });
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

  return (
    <div className="bg-background flex flex-col items-center justify-center p-4 sm:p-8">
      <div 
        ref={certificateRef} 
        className="w-full max-w-4xl bg-card relative p-2 border-2 border-primary/20"
        style={{ fontFamily: 'serif' }}
      >
        <div className="border-[10px] border-primary/10 p-6">
          <div className="relative text-center border-2 border-primary/20 py-10 px-6">
            <div className="absolute inset-0 bg-[url('/certificate-bg.svg')] bg-center bg-no-repeat opacity-5"></div>
            
            <div className="flex justify-center mb-4">
              <Logo />
            </div>

            <p className="font-headline text-lg uppercase tracking-widest text-muted-foreground">
              Certificate of Completion
            </p>
            
            <p className="mt-6 text-base italic">This certificate is proudly presented to</p>
            
            <h1 className="font-headline text-5xl font-bold text-primary my-4">
              {user.name}
            </h1>
            
            <p className="text-base italic">for successfully completing the course</p>
            
            <h2 className="font-headline text-3xl font-semibold my-4 leading-tight">{course.title}</h2>
            
            <p className="text-sm text-muted-foreground">on {completionDate}</p>

            <div className="flex justify-between items-end mt-12 max-w-xl mx-auto">
              <div className="text-center w-2/5">
                 <p className="font-semibold text-lg border-b-2 border-dashed pb-1 font-headline">{teacher?.name || 'Instructor'}</p>
                 <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Lead Instructor</p>
              </div>
              <div className="w-1/5">
                <ShieldCheck className="h-20 w-20 text-primary/50 mx-auto" strokeWidth={1} />
              </div>
              <div className="text-center w-2/5">
                 <p className="font-semibold text-lg border-b-2 border-dashed pb-1 font-headline">CampusConnect</p>
                 <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Official Platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Button onClick={handleDownload} className="mt-8 font-headline">
        <Download className="mr-2 h-4 w-4" />
        Download Certificate as PDF
      </Button>
    </div>
  );
}


function CertificateSkeleton() {
  return (
    <div className="bg-background flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl p-2 border-2 border-primary/20">
        <div className="border-[10px] border-primary/10 p-6">
          <div className="relative text-center border-2 border-primary/20 py-10 px-6 space-y-6">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-6 w-64 mx-auto" />
            <Skeleton className="h-4 w-52 mx-auto" />
            <Skeleton className="h-14 w-80 mx-auto my-4" />
            <Skeleton className="h-4 w-64 mx-auto" />
            <Skeleton className="h-10 w-96 mx-auto my-4" />
            <Skeleton className="h-4 w-32 mx-auto" />
             <div className="flex justify-between items-end mt-12 max-w-xl mx-auto">
                <div className="text-center w-2/5 space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-3 w-20 mx-auto" />
                </div>
                 <div className="w-1/5">
                    <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                </div>
                <div className="text-center w-2/5 space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-3 w-24 mx-auto" />
                </div>
             </div>
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-64 mt-8" />
    </div>
  )
}
