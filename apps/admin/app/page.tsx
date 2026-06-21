import { t } from '@workspace/lib/i18n';

export default function Page() {
  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('adminTitle')}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{t('placeholder.genericDescription')}</p>
      </div>
    </div>
  );
}
