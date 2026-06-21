'use client';

import { Clock, MapPin, Store } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { t } from '@workspace/lib/i18n';

interface PickupInfoCardProps {
  storeName?: string | null;
  storeAddress?: string | null;
  storeHours?: string | null;
  className?: string;
}

export function PickupInfoCard({
  storeName,
  storeAddress,
  storeHours,
  className,
}: PickupInfoCardProps) {
  const hasContent = storeName || storeAddress || storeHours;
  if (!hasContent) {
    return null;
  }

  return (
    <Card className={className} size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="text-muted-foreground size-4" />
          {t('checkout.pickupLabel')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-2 text-sm">
          {storeName ? (
            <div className="flex items-start gap-2">
              <Store className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
              <dd className="font-medium">{storeName}</dd>
            </div>
          ) : null}
          {storeAddress ? (
            <div className="flex items-start gap-2">
              <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
              <dd className="text-muted-foreground">{storeAddress}</dd>
            </div>
          ) : null}
          {storeHours ? (
            <div className="flex items-start gap-2">
              <Clock className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
              <dd className="text-muted-foreground">{storeHours}</dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
