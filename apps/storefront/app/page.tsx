import { t } from '@workspace/lib/i18n';

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{t('homepage.title')}</h1>
        <p className="text-muted-foreground mt-2 text-base leading-7">
          {t('homepage.description')}
        </p>
      </div>
    </main>
  );
}
