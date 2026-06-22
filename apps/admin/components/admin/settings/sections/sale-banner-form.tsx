'use client';

import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { t } from '@workspace/lib/i18n';

export interface SaleBannerFormState {
  saleBannerEnabled: boolean;
  saleBannerText: string;
  saleBannerLink: string;
}

interface SaleBannerFormProps {
  state: SaleBannerFormState;
  onChange: (next: SaleBannerFormState) => void;
}

export function SaleBannerForm({ state, onChange }: SaleBannerFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="settings-sale-enabled" className="font-medium">
            {t('admin.settings.sale.enable')}
          </Label>
          <p className="text-muted-foreground text-xs">{t('admin.settings.sale.hint')}</p>
        </div>
        <Switch
          id="settings-sale-enabled"
          size="default"
          checked={state.saleBannerEnabled}
          onCheckedChange={(checked) => onChange({ ...state, saleBannerEnabled: checked })}
          aria-label={t('admin.settings.sale.enable')}
          className="cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-sale-text">{t('admin.settings.sale.text')}</Label>
          <Input
            id="settings-sale-text"
            type="text"
            value={state.saleBannerText}
            onChange={(event) => onChange({ ...state, saleBannerText: event.target.value })}
            placeholder={t('admin.settings.sale.textPlaceholder')}
            disabled={!state.saleBannerEnabled}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-sale-link">{t('admin.settings.sale.link')}</Label>
          <Input
            id="settings-sale-link"
            type="text"
            value={state.saleBannerLink}
            onChange={(event) => onChange({ ...state, saleBannerLink: event.target.value })}
            placeholder={t('admin.settings.sale.linkPlaceholder')}
            disabled={!state.saleBannerEnabled}
          />
        </div>
      </div>
    </div>
  );
}
