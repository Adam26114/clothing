'use client';

import { Banknote } from 'lucide-react';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent } from '@workspace/ui/components/card';
import { t } from '@workspace/lib/i18n';

interface PaymentCalloutProps {
  className?: string;
}

export function PaymentCallout({ className }: PaymentCalloutProps) {
  return (
    <Card className={className} size="sm">
      <CardContent className="flex items-center gap-3">
        <div
          className="bg-secondary text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-md"
          aria-hidden
        >
          <Banknote className="size-5" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('checkout.paymentHeading')}</span>
            <Badge variant="secondary">{t('checkout.paymentCodBadge')}</Badge>
          </div>
          <p className="text-muted-foreground text-xs">{t('checkout.paymentCodDescription')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
