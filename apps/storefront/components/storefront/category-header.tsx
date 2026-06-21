import { cn } from '@workspace/lib/cn';

interface CategoryHeaderProps {
  name: string;
  description?: string | null;
  className?: string;
  children?: React.ReactNode;
}

export function CategoryHeader({ name, description, className, children }: CategoryHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-2 pb-6 md:pb-8', className)}>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{name}</h1>
      {description ? (
        <p className="text-muted-foreground max-w-2xl text-base">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
