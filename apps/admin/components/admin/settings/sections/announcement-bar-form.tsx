'use client';

import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { t } from '@workspace/lib/i18n';

interface AnnouncementBarFormProps {
  value: string;
  onChange: (next: string) => void;
}

export function AnnouncementBarForm({ value, onChange }: AnnouncementBarFormProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="settings-announcement">{t('admin.settings.announcement.text')}</Label>
      <Input
        id="settings-announcement"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('admin.settings.announcement.textPlaceholder')}
      />
      <p className="text-muted-foreground text-xs">{t('admin.settings.announcement.hint')}</p>
    </div>
  );
}
