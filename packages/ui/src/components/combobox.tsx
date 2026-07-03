'use client';

import * as React from 'react';
import { CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@workspace/ui/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';

export interface ComboboxOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface ComboboxSharedProps<T extends string> {
  options: ReadonlyArray<ComboboxOption<T>>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

type ComboboxProps<T extends string> = ComboboxSharedProps<T> &
  (
    | {
        multiple?: true;
        value: ReadonlyArray<T>;
        onChange: (next: ReadonlyArray<T>) => void;
        clearable?: boolean;
      }
    | {
        multiple: false;
        value: T | null;
        onChange: (next: T | null) => void;
        clearable?: boolean;
      }
  );

export function Combobox<T extends string>(props: ComboboxProps<T>) {
  const {
    options,
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    emptyMessage = 'No results found.',
    className,
    triggerClassName,
    disabled,
  } = props;
  const multiple = props.multiple !== false;
  const clearable = props.clearable !== false;

  const [open, setOpen] = React.useState(false);

  const isSelected = React.useCallback(
    (optionValue: T) =>
      multiple ? props.value.includes(optionValue) : props.value === optionValue,
    [multiple, props.value]
  );

  const selectedOptions = React.useMemo(
    () => options.filter((option) => isSelected(option.value)),
    [options, isSelected]
  );

  const handleSelect = React.useCallback(
    (optionValue: T) => {
      if (multiple) {
        const exists = props.value.includes(optionValue);
        props.onChange(
          exists
            ? props.value.filter((entry) => entry !== optionValue)
            : [...props.value, optionValue]
        );
      } else {
        props.onChange(optionValue);
        setOpen(false);
      }
    },
    [multiple, props]
  );

  const handleClear = React.useCallback(
    (event: React.MouseEvent | React.PointerEvent) => {
      event.stopPropagation();
      event.preventDefault();
      if (multiple) {
        props.onChange([]);
      } else {
        props.onChange(null);
      }
    },
    [multiple, props]
  );

  const triggerLabel = (() => {
    if (selectedOptions.length === 0) {
      return null;
    }
    if (multiple) {
      if (selectedOptions.length <= 1) {
        return selectedOptions.map((option) => option.label).join(', ');
      }
      const visible = selectedOptions[0]!.label;
      const overflow = selectedOptions.length - 1;
      return (
        <>
          {visible}
          <span className="text-muted-foreground"> +{overflow}</span>
        </>
      );
    }
    return selectedOptions[0]?.label ?? null;
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              'h-7 min-w-40 cursor-pointer justify-between gap-2 font-normal',
              triggerClassName,
              className
            )}
            aria-expanded={open}
          />
        }
      >
        <span className="flex min-w-0 flex-1 items-center gap-1 truncate text-start">
          {triggerLabel ?? <span className="text-muted-foreground truncate">{placeholder}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && selectedOptions.length > 0 ? (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={handleClear}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              className="text-muted-foreground hover:text-foreground inline-flex size-4 cursor-pointer items-center justify-center rounded-sm"
            >
              <XIcon className="size-3.5" aria-hidden />
            </button>
          ) : null}
          <ChevronDownIcon
            aria-hidden
            className={cn(
              'text-muted-foreground size-4 transition-transform',
              open && 'rotate-180'
            )}
          />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className={cn('w-64 gap-0 p-0')}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const selected = isSelected(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    keywords={[option.value]}
                    onSelect={() => {
                      handleSelect(option.value);
                    }}
                    disabled={option.disabled}
                    className="cursor-pointer"
                  >
                    <span className="truncate">{option.label}</span>
                    {selected ? (
                      <CheckIcon aria-hidden className="text-foreground ms-auto size-4 shrink-0" />
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
