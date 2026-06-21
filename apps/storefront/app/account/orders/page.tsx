import { OrdersList } from '@/components/storefront/account/orders-list';
import { t } from '@workspace/lib/i18n';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold">{t('account.ordersHeading')}</h2>
      <OrdersList showHeader showEmpty />
    </div>
  );
}
