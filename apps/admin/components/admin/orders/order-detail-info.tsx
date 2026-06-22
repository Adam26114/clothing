'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { t } from '@workspace/lib/i18n';

interface OrderDetailInfoProps {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  deliveryMethod: 'shipping' | 'pickup';
  paymentMethod: 'cod';
  notes: string | null;
}

export function OrderDetailInfo({
  customer,
  deliveryMethod,
  paymentMethod,
  notes,
}: OrderDetailInfoProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.orders.detail.customer')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-xs">{t('order.emailLabel')}</dt>
                <dd className="font-medium">{customer.email}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-xs">{t('order.phoneLabel')}</dt>
                <dd className="font-medium tabular-nums">{customer.phone}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-xs">{t('order.addressLabel')}</dt>
                <dd className="text-sm">{customer.address}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.orders.detail.delivery')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-xs">{t('order.deliveryMethod')}</dt>
                <dd className="mt-1">
                  <Badge variant="outline" className="cursor-default">
                    {deliveryMethod === 'shipping'
                      ? t('admin.orders.detail.shipping')
                      : t('admin.orders.detail.pickup')}
                  </Badge>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-xs">
                  {t('admin.orders.detail.payment')}
                </dt>
                <dd className="mt-1">
                  <Badge variant="outline" className="cursor-default">
                    {paymentMethod === 'cod' ? t('admin.orders.detail.paymentCod') : paymentMethod}
                  </Badge>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-xs">
                  {t('admin.orders.detail.notesLabel')}
                </dt>
                <dd className="mt-1 text-sm">
                  {notes && notes.length > 0 ? notes : t('admin.orders.detail.notesEmpty')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
