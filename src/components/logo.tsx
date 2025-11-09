import { GraduationCap } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <GraduationCap className="h-7 w-7 text-primary" />
      <span className="font-headline text-xl font-bold text-primary">
        CampusConnect
      </span>
    </div>
  );
}
