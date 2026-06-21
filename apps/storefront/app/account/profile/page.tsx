import { ProfileForm } from '@/components/storefront/account/profile-form';
import { t } from '@workspace/lib/i18n';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold">{t('account.profileHeading')}</h2>
      <ProfileForm />
    </div>
  );
}
