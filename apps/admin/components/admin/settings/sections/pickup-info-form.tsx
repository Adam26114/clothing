'use client';

import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { t } from '@workspace/lib/i18n';

export interface PickupInfoFormState {
  pickupStoreName: string;
  pickupStoreAddress: string;
  pickupStoreHours: string;
}

interface PickupInfoFormProps {
  state: PickupInfoFormState;
  onChange: (next: PickupInfoFormState) => void;
}

export function PickupInfoForm({ state, onChange }: PickupInfoFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-pickup-name">{t('admin.settings.pickup.name')}</Label>
        <Input
          id="settings-pickup-name"
          type="text"
          value={state.pickupStoreName}
          onChange={(event) => onChange({ ...state, pickupStoreName: event.target.value })}
          placeholder={t('admin.settings.pickup.namePlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-pickup-address">{t('admin.settings.pickup.address')}</Label>
        <Textarea
          id="settings-pickup-address"
          rows={2}
          value={state.pickupStoreAddress}
          onChange={(event) => onChange({ ...state, pickupStoreAddress: event.target.value })}
          placeholder={t('admin.settings.pickup.addressPlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-pickup-hours">{t('admin.settings.pickup.hours')}</Label>
        <Input
          id="settings-pickup-hours"
          type="text"
          value={state.pickupStoreHours}
          onChange={(event) => onChange({ ...state, pickupStoreHours: event.target.value })}
          placeholder={t('admin.settings.pickup.hoursPlaceholder')}
        />
      </div>
    </div>
  );
}
