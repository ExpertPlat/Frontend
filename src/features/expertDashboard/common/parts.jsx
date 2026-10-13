import React from 'react';
import { PATHS } from '../../../routes/paths';
import UdIcon from '../../userDashboard/components/UdIcon';
import { Button, Card, StatusPill } from '../../userDashboard/components/ui';
import { useUserI18n } from '../../userDashboard/i18n/UserI18nContext';
import { LoadError } from '../../userDashboard/journey/parts';

/** The API answers 403 for these resources until the KYC is approved; this panel explains it and leads to the fix. */
export function VerifyFirst() {
  const { tr } = useUserI18n();
  return (
    <Card className="jr-card jr-waiting">
      <span className="jr-pulse is-muted" aria-hidden="true"><UdIcon name="lock" size={30} /></span>
      <h2>{tr('وثّق حسابك أولًا', 'Verify your account first')}</h2>
      <p>{tr('هذا القسم يُفتح بعد اعتماد التحقق من هويتك ومؤهلاتك.', 'This section opens once your identity and credentials are approved.')}</p>
      <Button icon="shieldCheck" to={PATHS.EXPERT_KYC}>{tr('اذهب إلى التحقق', 'Go to verification')}</Button>
    </Card>
  );
}

/** Error state for a `useResource` result: a 403 means "verify first", anything else is a retryable load error. */
export function ResourceError({ resource }) {
  if (!resource.error) return null;
  if (resource.error.status === 403) return <VerifyFirst />;
  return <LoadError message={resource.errorMessage} onRetry={() => resource.reload()} />;
}

/** Laravel-style `errors` of a failed write: `{ field: [message] }` -> `{ field: message }`. */
export function fieldErrors(error) {
  const raw = error?.payload?.errors;
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : String(value)]));
}

/** First letter of a name in a round tile; the expert side only knows the client's first name. */
export function ClientTile({ name, size = 44 }) {
  return <span className="ex-client" style={{ width: size, height: size }} aria-hidden="true">{String(name || '?').trim().charAt(0)}</span>;
}

