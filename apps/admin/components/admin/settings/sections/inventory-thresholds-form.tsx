'use client';

import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { t } from '@workspace/lib/i18n';

export interface InventoryThresholdsFormState {
  lowStockThreshold: string;
}

interface InventoryThresholdsFormProps {
  state: InventoryThresholdsFormState;
  onChange: (next: InventoryThresholdsFormState) => void;
}

export function InventoryThresholdsForm({ state, onChange }: InventoryThresholdsFormProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="settings-low-stock-threshold">
        {t('admin.settings.inventory.lowStockThreshold')}
      </Label>
      <p className="text-muted-foreground text-xs">
        {t('admin.settings.inventory.lowStockThresholdHint')}
      </p>
      <Input
        id="settings-low-stock-threshold"
        type="number"
        min={0}
        step={1}
        value={state.lowStockThreshold}
        onChange={(event) => onChange({ lowStockThreshold: event.target.value })}
        placeholder={t('admin.settings.inventory.lowStockThresholdPlaceholder')}
        className="max-w-xs"
      />
    </div>
  );
}
