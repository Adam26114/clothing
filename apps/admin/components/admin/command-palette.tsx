'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CommandIcon, SearchIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@workspace/ui/components/command';
import { cn } from '@workspace/ui/lib/utils';
import { t } from '@workspace/lib/i18n';

import { adminNavItems, type AdminNavItem } from './nav-config';

function isMac(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
}

interface CommandPaletteProps {
  className?: string;
  triggerVariant?: 'inline' | 'button';
}

function KbdKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-mono text-[10px] font-medium">
      {children}
    </kbd>
  );
}

function ShortcutHint() {
  const mac = isMac();
  return (
    <span className="ms-auto inline-flex items-center gap-0.5">
      {mac ? (
        <KbdKey>
          <CommandIcon className="size-3" aria-hidden />
        </KbdKey>
      ) : (
        <KbdKey>Ctrl</KbdKey>
      )}
      <KbdKey>K</KbdKey>
    </span>
  );
}

export function CommandPalette({ className, triggerVariant = 'inline' }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener('keydown', down);
    return () => {
      document.removeEventListener('keydown', down);
    };
  }, []);

  const handleSelect = React.useCallback(
    (item: AdminNavItem) => {
      setOpen(false);
      router.push(item.url);
    },
    [router]
  );

  const trigger =
    triggerVariant === 'button' ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true);
        }}
        className={cn('h-8 cursor-pointer gap-2', className)}
        aria-label={t('admin.commandPalette.open')}
      >
        <SearchIcon className="size-4" aria-hidden />
        <span>{t('admin.commandPalette.open')}</span>
        <ShortcutHint />
      </Button>
    ) : (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className={cn(
          'text-muted-foreground hover:bg-muted/60 inline-flex h-8 w-full max-w-sm cursor-pointer items-center gap-2 rounded-lg border bg-transparent px-3 text-sm transition-colors',
          className
        )}
        aria-label={t('admin.commandPalette.open')}
      >
        <SearchIcon className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 text-start">{t('admin.commandPalette.placeholder')}</span>
        <ShortcutHint />
      </button>
    );

  return (
    <>
      {trigger}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t('admin.commandPalette.title')}
        description={t('admin.commandPalette.description')}
      >
        <Command>
          <CommandInput placeholder={t('admin.commandPalette.searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>{t('admin.commandPalette.empty')}</CommandEmpty>
            <CommandGroup heading={t('admin.commandPalette.navHeading')}>
              {adminNavItems.map((item) => (
                <CommandItem
                  key={item.url}
                  value={`${t(item.titleKey)} ${item.url}`}
                  keywords={[item.url]}
                  onSelect={() => {
                    handleSelect(item);
                  }}
                  className="cursor-pointer"
                >
                  {item.icon}
                  <span>{t(item.titleKey)}</span>
                  <CommandShortcut>{item.url}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
