import React, { useState } from 'react';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage, getFieldErrors, getFirstFieldError } from '../../../../api/errorHandler';
import { useResource } from '../../../../services/hooks';
import { contextsService } from '../../../../services/user/accountService';
import { useUserI18n } from '../../i18n/UserI18nContext';
import { Button, Card, Dialog, EmptyState, Field, PageHeader, SkeletonRows, StatusPill, TextArea, TextInput } from '../../components/ui';
import { LoadError } from '../../journey/parts';

/** Reusable private notes (e.g. "my store") that can be attached to future cases. */
export default function UserContexts() {
  const { tr, fmtDateShort } = useUserI18n();
  const { notify } = useBrandFeedback();
  const list = useResource(() => contextsService.list(), []);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const act = async (fn, success) => { try { await fn(); if (success) notify({ message: success, tone: 'success' }); await list.reload({ silent: true }); } catch (error) { notify({ message: getErrorMessage(error), tone: 'error' }); } };
  const create = async () => {
    setBusy(true); setErrors({});
    try { await contextsService.create(form); setCreating(false); setForm({ name: '', notes: '' }); await list.reload({ silent: true }); } catch (error) { setErrors(getFieldErrors(error)); if (!Object.keys(getFieldErrors(error)).length) notify({ message: getErrorMessage(error), tone: 'error' }); } finally { setBusy(false); }
  };
  const rows = list.data || [];
  return (
    <div className="jr-page">
      <PageHeader icon="layers" title={tr('السياقات المحفوظة', 'Saved contexts')} subtitle={tr('معلومات خاصة تعيد استخدامها في حالاتك دون كتابتها من جديد.', 'Private details you reuse across cases without retyping them.')} actions={<Button icon="plus" onClick={() => setCreating(true)}>{tr('سياق جديد', 'New context')}</Button>} />
      {list.error && <LoadError message={list.errorMessage} onRetry={() => list.reload()} />}
      {list.loading && !list.data && <Card className="jr-card"><SkeletonRows rows={2} /></Card>}
      {list.data && rows.length === 0 && <Card className="jr-card"><EmptyState icon="layers" title={tr('لا توجد سياقات', 'No saved contexts')} description={tr('أضف سياقًا مثل «متجري» لتوفّر وقتك لاحقًا.', 'Add a context such as “my store” to save time later.')} /></Card>}
      {rows.length > 0 && (
        <Card className="jr-card">
          <ul className="jr-rows">
            {rows.map((c) => (
              <li key={c.id}><span className="jr-rows__copy"><b>{c.name}</b><small>{c.notes || '—'} · {fmtDateShort(c.updatedAt)}</small></span><StatusPill tone={c.status === 'active' ? 'success' : 'neutral'}>{c.status === 'active' ? tr('نشط', 'Active') : tr('مؤرشف', 'Archived')}</StatusPill>
                <span className="jr-rows__btns">
                  {c.status === 'active' ? <Button size="sm" variant="secondary" onClick={() => act(() => contextsService.archive(c.id))}>{tr('أرشفة', 'Archive')}</Button> : <Button size="sm" variant="secondary" onClick={() => act(() => contextsService.restore(c.id))}>{tr('استعادة', 'Restore')}</Button>}
                  <Button size="sm" variant="ghost" onClick={() => act(() => contextsService.remove(c.id), tr('تم الحذف.', 'Deleted.'))}>{tr('حذف', 'Delete')}</Button>
                </span></li>
            ))}
          </ul>
        </Card>
      )}
      <Dialog open={creating} onClose={() => setCreating(false)} icon="layers" title={tr('سياق جديد', 'New context')} footer={<><Button variant="ghost" onClick={() => setCreating(false)} disabled={busy}>{tr('إلغاء', 'Cancel')}</Button><Button icon="check" loading={busy} onClick={create}>{tr('حفظ', 'Save')}</Button></>}>
        <div className="jr-invite">
          <Field label={tr('الاسم', 'Name')} htmlFor="ctx-name" error={getFirstFieldError(errors, 'name')}><TextInput id="ctx-name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} /></Field>
          <Field label={tr('ملاحظات', 'Notes')} optional htmlFor="ctx-notes"><TextArea id="ctx-notes" rows={4} value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} /></Field>
        </div>
      </Dialog>
    </div>
  );
}
