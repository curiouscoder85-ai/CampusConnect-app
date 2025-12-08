
'use client';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export function SectionHeader({ title, subtitle, className }: SectionHeaderProps) {
    return (
        <div className={className}>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
                {title}
            </h1>
            {subtitle && (
                <p className="text-muted-foreground mt-1">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
