import { t } from '@workspace/lib/i18n';

export default function Page() {
  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{t('account.title')}</h1>
      <p className="text-muted-foreground mt-2 text-base leading-7">{t('account.description')}</p>
    </main>
  );
}
