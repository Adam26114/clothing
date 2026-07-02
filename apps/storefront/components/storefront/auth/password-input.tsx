'use client';

import { forwardRef, useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { Input } from '@workspace/ui/components/input';
import { cn } from '@workspace/ui/lib/utils';
import { t } from '@workspace/lib/i18n';

interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  containerClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, containerClassName, disabled, ...props }, ref) {
    const id = useId();
    const [visible, setVisible] = useState(false);
    const describedBy = props['aria-describedby'];
    const labelId = `${id}-state`;
    const composedDescribedBy = describedBy ? `${describedBy} ${labelId}` : labelId;

    return (
      <div className={cn('relative', containerClassName)}>
        <Input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          autoComplete={props.autoComplete ?? 'current-password'}
          aria-describedby={composedDescribedBy}
          className={cn('pe-9', className)}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={t('a11y.togglePasswordVisibility')}
          aria-pressed={visible}
          aria-controls={id}
          className={cn(
            'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50',
            'absolute end-1 top-1/2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md',
            'transition-colors focus-visible:ring-2 focus-visible:outline-none',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          {visible ? (
            <EyeOffIcon className="size-4" aria-hidden />
          ) : (
            <EyeIcon className="size-4" aria-hidden />
          )}
        </button>
        <span id={labelId} className="sr-only">
          {visible ? t('a11y.passwordShown') : t('a11y.passwordHidden')}
        </span>
      </div>
    );
  }
);
