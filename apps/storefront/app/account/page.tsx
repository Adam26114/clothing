import { OrdersList } from '@/components/storefront/account/orders-list';
import { ProfileForm } from '@/components/storefront/account/profile-form';
import { WishlistSummary } from '@/components/storefront/account/wishlist-summary';
import { t } from '@workspace/lib/i18n';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">{t('account.profileHeading')}</h2>
        <ProfileForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">{t('account.recentOrdersHeading')}</h2>
        <OrdersList limit={5} showHeader showEmpty />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">{t('account.wishlistHeading')}</h2>
        <WishlistSummary />
      </section>
    </div>
  );
}
