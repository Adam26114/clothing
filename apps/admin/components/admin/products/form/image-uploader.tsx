'use client';

import * as React from 'react';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { GripVerticalIcon, ImagePlusIcon, Loader2Icon, StarIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Button } from '@workspace/ui/components/button';
import { t } from '@workspace/lib/i18n';

interface ImageUploaderProps {
  images: Id<'_storage'>[];
  onChange: (next: Id<'_storage'>[]) => void;
  colorHex: string;
}

interface UploadingItem {
  id: string;
  name: string;
}

export function ImageUploader({ images, onChange, colorHex }: ImageUploaderProps) {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const deleteAt = useMutation(api.storage.deleteAt);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState<UploadingItem[]>([]);
  const [dragOverId, setDragOverId] = React.useState<Id<'_storage'> | null>(null);
  const [draggingId, setDraggingId] = React.useState<Id<'_storage'> | null>(null);

  const handleFiles = React.useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) {
        return;
      }
      const items: UploadingItem[] = list.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
      }));
      setUploading((prev) => [...prev, ...items]);

      const results = await Promise.allSettled(
        list.map(async (file) => {
          const uploadUrl = await generateUploadUrl({});
          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: file,
            headers: { 'Content-Type': file.type },
          });
          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }
          const data: unknown = await response.json();
          if (
            data &&
            typeof data === 'object' &&
            'storageId' in data &&
            typeof (data as { storageId: unknown }).storageId === 'string'
          ) {
            return (data as { storageId: string }).storageId as Id<'_storage'>;
          }
          throw new Error(`Invalid response for ${file.name}`);
        })
      );

      const newIds: Id<'_storage'>[] = [];
      let failed = 0;
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          newIds.push(result.value);
        } else {
          failed += 1;
        }
      });

      setUploading((prev) => prev.filter((item) => !items.some((i) => i.id === item.id)));

      if (newIds.length > 0) {
        onChange([...images, ...newIds]);
      }
      if (failed > 0) {
        toast.error(t('admin.products.error.imageUpload'));
      }
    },
    [generateUploadUrl, images, onChange]
  );

  const handleRemove = React.useCallback(
    async (storageId: Id<'_storage'>) => {
      onChange(images.filter((id) => id !== storageId));
      try {
        await deleteAt({ storageId });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('admin.products.error.imageUpload');
        toast.error(message);
      }
    },
    [deleteAt, images, onChange]
  );

  const handleSetPrimary = React.useCallback(
    (storageId: Id<'_storage'>) => {
      if (images[0] === storageId) {
        return;
      }
      const idx = images.indexOf(storageId);
      if (idx <= 0) {
        return;
      }
      const next = [...images];
      const [moved] = next.splice(idx, 1);
      if (moved) {
        next.unshift(moved);
        onChange(next);
      }
    },
    [images, onChange]
  );

  const handleDragStart = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>, storageId: Id<'_storage'>) => {
      setDraggingId(storageId);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', storageId);
    },
    []
  );

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>, storageId: Id<'_storage'>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setDragOverId(storageId);
    },
    []
  );

  const handleDragLeave = React.useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>, targetId: Id<'_storage'>) => {
      event.preventDefault();
      const sourceId = event.dataTransfer.getData('text/plain') as Id<'_storage'>;
      setDragOverId(null);
      setDraggingId(null);
      if (!sourceId || sourceId === targetId) {
        return;
      }
      const oldIndex = images.indexOf(sourceId);
      const newIndex = images.indexOf(targetId);
      if (oldIndex < 0 || newIndex < 0) {
        return;
      }
      const next = [...images];
      const [moved] = next.splice(oldIndex, 1);
      if (moved) {
        next.splice(newIndex, 0, moved);
        onChange(next);
      }
    },
    [images, onChange]
  );

  const handleDragEnd = React.useCallback(() => {
    setDraggingId(null);
    setDragOverId(null);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t('admin.products.form.images')}</p>
          <p className="text-muted-foreground text-xs">{t('admin.products.form.imagesHint')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer"
        >
          <ImagePlusIcon className="me-1.5 size-4" aria-hidden />
          {t('admin.products.form.uploadFile')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) {
              void handleFiles(event.target.files);
              event.target.value = '';
            }
          }}
          className="hidden"
        />
      </div>

      {images.length === 0 && uploading.length === 0 ? (
        <div
          className="border-border flex items-center justify-center rounded-lg border border-dashed p-6"
          style={{ backgroundColor: colorHex }}
        >
          <p className="text-muted-foreground text-xs">{t('admin.products.form.noImages')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((storageId, index) => {
            const isDragOver = dragOverId === storageId;
            const isDragging = draggingId === storageId;
            return (
              <ImageThumbnail
                key={storageId}
                storageId={storageId}
                isPrimary={index === 0}
                isDragOver={isDragOver}
                isDragging={isDragging}
                onSetPrimary={() => handleSetPrimary(storageId)}
                onRemove={() => void handleRemove(storageId)}
                onDragStart={(event) => handleDragStart(event, storageId)}
                onDragOver={(event) => handleDragOver(event, storageId)}
                onDragLeave={handleDragLeave}
                onDrop={(event) => handleDrop(event, storageId)}
                onDragEnd={handleDragEnd}
              />
            );
          })}
          {uploading.map((item) => (
            <div
              key={item.id}
              className="border-border bg-muted/30 flex aspect-square items-center justify-center rounded-lg border"
            >
              <div className="flex flex-col items-center gap-1 text-center">
                <Loader2Icon className="text-muted-foreground size-5 animate-spin" aria-hidden />
                <p className="text-muted-foreground line-clamp-1 text-xs">
                  {t('admin.products.form.uploading')}
                </p>
                <p className="text-muted-foreground line-clamp-1 text-[10px]">{item.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ImageThumbnailProps {
  storageId: Id<'_storage'>;
  isPrimary: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

function ImageThumbnail({
  storageId,
  isPrimary,
  isDragOver,
  isDragging,
  onSetPrimary,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: ImageThumbnailProps) {
  const url = useQuery(api.storage.getUrl, { storageId });

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`border-border bg-card group relative flex aspect-square flex-col overflow-hidden rounded-lg border transition-opacity ${
        isDragging ? 'opacity-50' : ''
      } ${isDragOver ? 'ring-primary ring-2' : ''}`}
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground absolute start-1 top-1 z-10 inline-flex size-6 cursor-grab items-center justify-center rounded-md bg-black/40 text-white transition-colors active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVerticalIcon className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-destructive absolute end-1 top-1 z-10 inline-flex size-6 cursor-pointer items-center justify-center rounded-md bg-black/40 text-white/90 transition-colors"
        aria-label={t('admin.products.form.removeImage')}
      >
        <XIcon className="size-3.5" aria-hidden />
      </button>
      <div className="flex-1 overflow-hidden">
        {url ? (
          <Image
            src={url}
            alt="Product image"
            width={200}
            height={200}
            unoptimized
            className="size-full object-cover"
          />
        ) : (
          <div className="bg-muted size-full" />
        )}
      </div>
      <div className="flex items-center justify-between gap-1 border-t bg-black/60 px-2 py-1.5 text-white">
        <button
          type="button"
          onClick={onSetPrimary}
          disabled={isPrimary}
          className="flex cursor-pointer items-center gap-1 text-[10px] font-medium uppercase transition-colors disabled:opacity-60"
          aria-label={t('admin.products.form.setPrimary')}
        >
          <StarIcon
            className={isPrimary ? 'fill-primary text-primary size-3' : 'size-3'}
            aria-hidden
          />
          {isPrimary ? 'Primary' : t('admin.products.form.setPrimary')}
        </button>
      </div>
    </div>
  );
}
