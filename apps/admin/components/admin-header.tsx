import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { Separator } from '@workspace/ui/components/separator';
import { t } from '@workspace/lib/i18n';

export function AdminHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-base font-medium">{t('adminTitle')}</h1>
      </div>
    </header>
  );
}
