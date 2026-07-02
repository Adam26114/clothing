import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/ui/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { CheckCircle2, Truck, Store, Banknote } from 'lucide-react';

interface ConfirmationCardProps {
  order: {
    _id: string;
    orderNumber: string;
    createdAt: number;
    deliveryMethod: 'shipping' | 'pickup';
    paymentMethod: 'cod';
    customerInfo: {
      name: string;
      email: string;
      phone: string;
      address: string;
    };
    items: Array<{
      productId: string;
      colorVariantId: string;
      name: string;
      size: string;
      color: string;
      colorHex: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    shippingFee: number;
    total: number;
    notes?: string;
  };
  className?: string;
}

function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString();
  }
}

export function ConfirmationCard({ order, className }: ConfirmationCardProps) {
  return (
    <Card className={cn('mx-auto w-full max-w-3xl', className)}>
      <CardHeader>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div
            className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full"
            aria-hidden
          >
            <CheckCircle2 className="size-6" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {t('order.confirmationTitle')}
          </CardTitle>
          <p className="text-muted-foreground text-sm">{t('order.confirmationSubtitle')}</p>
          <div className="mt-2 flex flex-col items-center gap-1">
            <span className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('order.orderNumberLabel')}
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums">
              {order.orderNumber}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('order.placedOn')}
            </p>
            <p className="font-medium">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('order.deliveryMethod')}
            </p>
            <p className="inline-flex items-center gap-1.5 font-medium">
              {order.deliveryMethod === 'shipping' ? (
                <Truck className="text-muted-foreground size-3.5" aria-hidden />
              ) : (
                <Store className="text-muted-foreground size-3.5" aria-hidden />
              )}
              {order.deliveryMethod === 'shipping'
                ? t('order.deliveryMethodShipping')
                : t('order.deliveryMethodPickup')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('order.paymentMethod')}
            </p>
            <p className="inline-flex items-center gap-1.5 font-medium">
              <Banknote className="text-muted-foreground size-3.5" aria-hidden />
              {t('order.paymentMethodCod')}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('order.customer')}
            </p>
            <p className="mt-1 font-medium">{order.customerInfo.name}</p>
            <p className="text-muted-foreground">{order.customerInfo.email}</p>
            <p className="text-muted-foreground">{order.customerInfo.phone}</p>
          </div>
          {order.deliveryMethod === 'shipping' && order.customerInfo.address ? (
            <div>
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                {t('order.addressLabel')}
              </p>
              <p className="mt-1 whitespace-pre-line">{order.customerInfo.address}</p>
            </div>
          ) : null}
        </div>

        {order.notes ? (
          <>
            <Separator />
            <div>
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                {t('order.notesLabel')}
              </p>
              <p className="mt-1 text-sm whitespace-pre-line">{order.notes}</p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
