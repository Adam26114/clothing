import type { ReactNode } from 'react';

import { cn } from '@workspace/lib/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border bg-card text-card-foreground flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-16 text-center',
        className
      )}
    >
      {icon ? (
        <div aria-hidden className="text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h2 className="text-base font-medium">{title}</h2>
      {description ? <p className="text-muted-foreground max-w-sm text-sm">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
