import { t } from '@workspace/lib/i18n';

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{t('auth.forgotPasswordTitle')}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{t('placeholder.genericDescription')}</p>
      </div>
    </main>
  );
}
