import { Suspense } from 'react';

import { VerifyEmailFlow } from './verify-email-flow';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailFlow />
    </Suspense>
  );
}
