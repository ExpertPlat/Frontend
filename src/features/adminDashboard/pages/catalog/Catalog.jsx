import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminCatalog, adminDirectory } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Button, EmptyState, Field, PageHeader, Select, Switch, TextInput } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { ActionDialog, DataTable, FilterBar, FilterSelect, Notice, Pager, Person, SearchBox, Section, Status, Tabs, When, useAdminAction, useLabel, usePagedList } from '../../ui/kit';
import { CATALOG_COUNTRIES, CATALOG_STATUS, DOMAINS, GRANT_STATUS, NODE_KIND, REASON_CODES, SERVICE_TYPES } from '../../ui/statuses';

const toggle = (list, value) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

/* ───────── Services ───────── */
function ServicesTab() {
  const { tr, tx, fmtNumber } = useUserI18n();
  const label = useLabel();
  const { can } = useAdminSession();
  const list = usePagedList((q) => adminCatalog.entries(q), { search: '', status: '' });
  const action = useAdminAction(list.reload);
  const [open, setOpen] = useState(false);
  const blank = { code: '', ar: '', en: '', domain: 'legal', deliveryModes: ['video_consultation'], jurisdictionCodes: ['AE'] };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const submit = async () => {
    const local = {};
    if (!/^[a-z][a-z0-9_]{0,99}$/.test(form.code)) local.code = [tr('حروف صغيرة وأرقام و_ فقط، تبدأ بحرف.', 'Lowercase letters, numbers and _, starting with a letter.')];
    if (!form.ar.trim() || !form.en.trim()) local.labels = [tr('الاسم بالعربية والإنجليزية مطلوب.', 'Arabic and English names are required.')];
    if (!form.deliveryModes.length) local.deliveryModes = [tr('اختر نمط تقديم واحدًا على الأقل.', 'Choose at least one delivery mode.')];
    setErrors(local);
    if (Object.keys(local).length) return;
    const res = await action.run(() => adminCatalog.createEntry({ code: form.code, domain: form.domain, labels: { ar: form.ar.trim(), en: form.en.trim() }, policy: { deliveryModes: form.deliveryModes, jurisdictionCodes: form.jurisdictionCodes, regulated: form.domain !== 'biz', requiresVerifiedScope: true } }), { success: tr('أُنشئت الخدمة كمسودة.', 'The service was created as a draft.') });
    if (res.ok) { setOpen(false); setForm(blank); list.reload(); } else setErrors({ ...res.fieldErrors, _form: [res.message] });
  };
  return (
    <Section flush icon="layers" title={tr('الخدمات في الكتالوج', 'Services in the catalog')} aside={can(P.CATALOG_MANAGE_DRAFTS) ? <Button size="sm" icon="plus" onClick={() => setOpen(true)}>{tr('خدمة جديدة', 'New service')}</Button> : null}>
      <FilterBar>
        <SearchBox value={list.filters.search} onChange={(v) => list.setFilter('search', v)} placeholder={tr('ابحث بالرمز أو الاسم', 'Search by code or name')} />
        <FilterSelect label={tr('الحالة', 'Status')} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: '', label: tr('كل الحالات', 'Any status') }, ...['enabled', 'pilot', 'intake_only', 'paused', 'draft', 'reviewed'].map((v) => ({ value: v, label: tx(CATALOG_STATUS[v].label) }))]} />
      </FilterBar>
      <DataTable
        caption={tr('الخدمات', 'Services')} rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
        to={(r) => withParams(PATHS.ADMIN_CATALOG_ENTRY, { entryId: r.id })}
        empty={<EmptyState icon="layers" title={tr('لا توجد خدمات', 'No services')} />}
        columns={[
          { key: 'name', header: tr('الخدمة', 'Service'), primary: true, render: (r) => <span><b dir="auto">{tx([r.labels.ar, r.labels.en])}</b><br /><small className="ad-code">{r.code}</small></span> },
          { key: 'domain', header: tr('المجال', 'Domain'), render: (r) => label(DOMAINS, r.domain) },
          { key: 'status', header: tr('الحالة الحالية', 'Live status'), render: (r) => <Status map={CATALOG_STATUS} value={r.status} /> },
          { key: 'latest', header: tr('آخر نسخة', 'Latest version'), render: (r) => <span className="ad-row"><b>v{r.latestVersion.catalogVersion}</b><Status map={CATALOG_STATUS} value={r.latestVersion.status} /></span> },
          { key: 'versions', header: tr('النسخ', 'Versions'), align: 'center', render: (r) => fmtNumber(r.versionsCount) },
        ]}
      />
      <Pager meta={list.meta} onPage={list.setPage} />
      <ActionDialog open={open} onClose={() => setOpen(false)} size="lg" icon="layers" title={tr('خدمة جديدة', 'New service')} description={tr('تُنشأ كمسودة (v1) ولا تظهر للمستخدمين حتى تُراجَع وتُنشر.', 'Created as a draft (v1); users do not see it until it is reviewed and published.')} confirmLabel={tr('إنشاء المسودة', 'Create draft')} busy={action.busy} onSubmit={submit} error={errors._form?.[0]}>
        <div className="ad-two">
          <Field label={tr('الرمز (إنجليزي)', 'Code')} required error={errors.code?.[0]} htmlFor="ce-code"><TextInput id="ce-code" dir="ltr" value={form.code} onChange={(v) => setForm({ ...form, code: v })} placeholder="contract_review" invalid={Boolean(errors.code)} /></Field>
          <Field label={tr('المجال', 'Domain')} htmlFor="ce-domain"><Select id="ce-domain" value={form.domain} onChange={(v) => setForm({ ...form, domain: v })} options={['legal', 'tax', 'ip', 'biz'].map((v) => ({ value: v, label: tx(DOMAINS[v]) }))} /></Field>
          <Field label={tr('الاسم بالعربية', 'Arabic name')} required error={errors.labels?.[0]} htmlFor="ce-ar"><TextInput id="ce-ar" value={form.ar} onChange={(v) => setForm({ ...form, ar: v })} /></Field>
          <Field label={tr('الاسم بالإنجليزية', 'English name')} required htmlFor="ce-en"><TextInput id="ce-en" dir="ltr" value={form.en} onChange={(v) => setForm({ ...form, en: v })} /></Field>
        </div>
        <Field label={tr('أنماط التقديم', 'Delivery modes')} required error={errors.deliveryModes?.[0]}><div className="ad-chips">{Object.entries(SERVICE_TYPES).map(([id, text]) => <button key={id} type="button" className="ad-chip-toggle" aria-pressed={form.deliveryModes.includes(id)} onClick={() => setForm({ ...form, deliveryModes: toggle(form.deliveryModes, id) })}>{tx(text)}</button>)}</div></Field>
        <Field label={tr('الدول المتاحة', 'Available countries')}><div className="ad-chips">{CATALOG_COUNTRIES.map((id) => <button key={id} type="button" className="ad-chip-toggle" aria-pressed={form.jurisdictionCodes.includes(id)} onClick={() => setForm({ ...form, jurisdictionCodes: toggle(form.jurisdictionCodes, id) })}>{id}</button>)}</div></Field>
      </ActionDialog>
    </Section>
  );
}

/* ───────── Taxonomy ───────── */
function TaxonomyTab() {
  const { tr, tx } = useUserI18n();
  const { can } = useAdminSession();
  const [kind, setKind] = useState('country');
  const list = usePagedList((q) => adminCatalog.nodes(q), { search: '', kind: 'country' }, { perPage: 50 });
  const action = useAdminAction(list.reload);
  const [edit, setEdit] = useState(null);
  const [create, setCreate] = useState(null);
  const [errors, setErrors] = useState({});
  const manage = can(P.CATALOG_MANAGE_DRAFTS);
  const changeKind = (v) => { setKind(v); list.setFilter('kind', v); };

  const saveEdit = async () => {
    if (!edit.ar.trim() || !edit.en.trim()) { setErrors({ labels: [tr('الاسمان مطلوبان.', 'Both names are required.')] }); return; }
    const res = await action.run(() => adminCatalog.updateNode(edit.id, { expectedVersion: edit.version, labels: { ar: edit.ar.trim(), en: edit.en.trim() }, status: edit.status, regulated: edit.regulated }), { success: tr('تم حفظ العنصر.', 'Item saved.') });
    if (res.ok) { setEdit(null); setErrors({}); list.reload(); } else setErrors({ ...res.fieldErrors, _form: [res.message] });
  };
  const saveCreate = async () => {
    const local = {};
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,99}$/.test(create.code)) local.code = [tr('يبدأ بحرف ويضم حروفًا وأرقامًا و_ أو -.', 'Start with a letter; letters, numbers, _ or - only.')];
    if (!create.ar.trim() || !create.en.trim()) local.labels = [tr('الاسمان مطلوبان.', 'Both names are required.')];
    setErrors(local);
    if (Object.keys(local).length) return;
    const res = await action.run(() => adminCatalog.createNode({ kind, code: create.code, labels: { ar: create.ar.trim(), en: create.en.trim() }, regulated: create.regulated }), { success: tr('أُضيف العنصر كمسودة.', 'Item added as a draft.') });
    if (res.ok) { setCreate(null); setErrors({}); list.reload(); } else setErrors({ ...res.fieldErrors, _form: [res.message] });
  };
  return (
    <>
      <Tabs label={tr('نوع العنصر', 'Item type')} value={kind} onChange={changeKind} tabs={Object.entries(NODE_KIND).filter(([k]) => ['country', 'domain', 'delivery_mode', 'safety_rule'].includes(k)).map(([id, text]) => ({ id, label: tx(text) }))} />
      <Section flush icon="tag" title={tx(NODE_KIND[kind])} aside={manage ? <Button size="sm" icon="plus" onClick={() => { setErrors({}); setCreate({ code: '', ar: '', en: '', regulated: false }); }}>{tr('إضافة عنصر', 'Add item')}</Button> : null}>
        <DataTable
          caption={tx(NODE_KIND[kind])} rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
          empty={<EmptyState icon="tag" title={tr('لا عناصر', 'No items')} />}
          columns={[
            { key: 'code', header: tr('الرمز', 'Code'), render: (r) => <span className="ad-code">{r.code}</span> },
            { key: 'name', header: tr('الاسم', 'Name'), primary: true, render: (r) => <span dir="auto">{tx([r.labels.ar, r.labels.en])}</span> },
            { key: 'reg', header: tr('منظَّم', 'Regulated'), align: 'center', render: (r) => (r.regulated ? tr('نعم', 'Yes') : '—') },
            { key: 'status', header: tr('الحالة', 'Status'), render: (r) => <Status map={CATALOG_STATUS} value={r.status} /> },
            { key: 'go', header: '', align: 'end', className: 'is-actions', render: (r) => (manage ? <Button size="sm" variant="secondary" icon="edit" onClick={() => { setErrors({}); setEdit({ id: r.id, version: r.version, code: r.code, ar: r.labels.ar, en: r.labels.en, status: r.status, regulated: r.regulated }); }}>{tr('تعديل', 'Edit')}</Button> : null) },
          ]}
        />
        <Pager meta={list.meta} onPage={list.setPage} />
      </Section>
      {edit && (
        <ActionDialog open onClose={() => setEdit(null)} icon="edit" title={tr('تعديل عنصر', 'Edit item')} description={<span className="ad-code">{edit.code}</span>} confirmLabel={tr('حفظ', 'Save')} busy={action.busy} onSubmit={saveEdit} error={errors._form?.[0]}>
          <div className="ad-two">
            <Field label={tr('الاسم بالعربية', 'Arabic name')} error={errors.labels?.[0]} htmlFor="tn-ar"><TextInput id="tn-ar" value={edit.ar} onChange={(v) => setEdit({ ...edit, ar: v })} /></Field>
            <Field label={tr('الاسم بالإنجليزية', 'English name')} htmlFor="tn-en"><TextInput id="tn-en" dir="ltr" value={edit.en} onChange={(v) => setEdit({ ...edit, en: v })} /></Field>
          </div>
          <Field label={tr('الحالة', 'Status')} htmlFor="tn-status"><Select id="tn-status" value={edit.status} onChange={(v) => setEdit({ ...edit, status: v })} options={['draft', 'pilot', 'enabled', 'paused', 'retired'].map((v) => ({ value: v, label: tx(CATALOG_STATUS[v].label) }))} /></Field>
          <Switch checked={edit.regulated} onChange={(v) => setEdit({ ...edit, regulated: v })} label={tr('مجال منظَّم', 'Regulated')} description={tr('يتطلب رخصة مهنية ومراجعة مهنية عند اعتماد الخبراء.', 'Requires a professional licence and review when approving experts.')} />
        </ActionDialog>
      )}
      {create && (
        <ActionDialog open onClose={() => setCreate(null)} icon="plus" title={tr('عنصر جديد', 'New item')} description={tx(NODE_KIND[kind])} confirmLabel={tr('إضافة', 'Add')} busy={action.busy} onSubmit={saveCreate} error={errors._form?.[0]}>
          <Field label={tr('الرمز', 'Code')} required error={errors.code?.[0]} htmlFor="nn-code"><TextInput id="nn-code" dir="ltr" value={create.code} onChange={(v) => setCreate({ ...create, code: v })} invalid={Boolean(errors.code)} /></Field>
          <div className="ad-two">
            <Field label={tr('الاسم بالعربية', 'Arabic name')} required error={errors.labels?.[0]} htmlFor="nn-ar"><TextInput id="nn-ar" value={create.ar} onChange={(v) => setCreate({ ...create, ar: v })} /></Field>
            <Field label={tr('الاسم بالإنجليزية', 'English name')} required htmlFor="nn-en"><TextInput id="nn-en" dir="ltr" value={create.en} onChange={(v) => setCreate({ ...create, en: v })} /></Field>
          </div>
          <Switch checked={create.regulated} onChange={(v) => setCreate({ ...create, regulated: v })} label={tr('مجال منظَّم', 'Regulated')} />
        </ActionDialog>
      )}
    </>
  );
}

/* ───────── Grants ───────── */
function GrantsTab() {
  const { tr, tx } = useUserI18n();
  const label = useLabel();
  const { can } = useAdminSession();
  const list = usePagedList((q) => adminCatalog.grants(q), { status: '' });
  const action = useAdminAction(list.reload);
  const [revoke, setRevoke] = useState(null);
  const [create, setCreate] = useState(null);
  const [errors, setErrors] = useState({});
  const manage = can(P.CATALOG_PUBLISH);
  const lookups = useResource(async () => {
    const [experts, entries] = await Promise.all([adminDirectory.experts({ perPage: 100 }), adminCatalog.entries({ perPage: 100 })]);
    return { experts: experts.items.filter((e) => e.kycStatus === 'approved' || e.activeScopesCount > 0), entries: entries.items };
  }, [], { enabled: Boolean(create) });
  const expertDetail = useResource(() => adminDirectory.expert(create.expertId), [create?.expertId], { enabled: Boolean(create?.expertId) });
  const scopes = expertDetail.data?.scopes || [];
  const versions = (lookups.data?.entries || []).map((e) => ({ id: e.latestVersion.id, text: `${tx([e.labels.ar, e.labels.en])} · v${e.latestVersion.catalogVersion}`, status: e.latestVersion.status }));

  const submitRevoke = async () => {
    const res = await action.run(() => adminCatalog.revokeGrant(revoke.grant.id, revoke.reasonCode), { success: tr('سُحبت الصلاحية.', 'Grant revoked.') });
    if (res.ok) { setRevoke(null); list.reload(); } else setErrors({ _form: [res.message] });
  };
  const submitCreate = async () => {
    const local = {};
    if (!create.scopeId) local.scopeId = [tr('اختر نطاق الخبير.', 'Choose the expert scope.')];
    if (!create.catalogVersionId) local.catalogVersionId = [tr('اختر نسخة الخدمة.', 'Choose the service version.')];
    if (!Number.isInteger(Number(create.evidenceId)) || Number(create.evidenceId) < 1) local.evidenceId = [tr('أدخل رقم الدليل.', 'Enter the evidence id.')];
    setErrors(local);
    if (Object.keys(local).length) return;
    const res = await action.run(() => adminCatalog.createGrant({ scopeId: Number(create.scopeId), catalogVersionId: Number(create.catalogVersionId), jurisdictionCode: create.jurisdictionCode, evidenceId: Number(create.evidenceId), reasonCode: create.reasonCode }), { success: tr('مُنحت الصلاحية للخبير.', 'Grant created for the expert.') });
    if (res.ok) { setCreate(null); list.reload(); } else setErrors({ ...res.fieldErrors, _form: [res.message] });
  };

  return (
    <Section flush icon="key" title={tr('صلاحيات الخدمات للخبراء', 'Service grants for experts')} aside={manage ? <Button size="sm" icon="plus" onClick={() => { setErrors({}); setCreate({ expertId: '', scopeId: '', catalogVersionId: '', jurisdictionCode: 'AE', evidenceId: '', reasonCode: 'LICENCE_VERIFIED' }); }}>{tr('منح صلاحية', 'New grant')}</Button> : null}>
      <FilterBar><FilterSelect label={tr('الحالة', 'Status')} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: '', label: tr('الكل', 'All') }, { value: 'active', label: tx(GRANT_STATUS.active.label) }, { value: 'revoked', label: tx(GRANT_STATUS.revoked.label) }]} /></FilterBar>
      <DataTable
        caption={tr('صلاحيات الخدمات', 'Service grants')} rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
        empty={<EmptyState icon="key" title={tr('لا صلاحيات', 'No grants')} description={tr('الصلاحية تسمح لخبير معتمد بتقديم خدمة منظَّمة في دولة محددة.', 'A grant lets a verified expert deliver a regulated service in a given country.')} />}
        columns={[
          { key: 'expert', header: tr('الخبير', 'Expert'), render: (g) => (can(P.EXPERTS_VIEW) ? <Person name={g.expert.name} to={withParams(PATHS.ADMIN_EXPERT_DETAIL, { expertId: g.expert.id })} icon="briefcase" /> : <Person name={g.expert.name} icon="briefcase" />) },
          { key: 'v', header: tr('نسخة الخدمة', 'Service version'), render: (g) => <span className="ad-code">#{g.catalogVersionId}</span> },
          { key: 'j', header: tr('الدولة', 'Country'), render: (g) => g.jurisdictionCode },
          { key: 'r', header: tr('السبب', 'Reason'), render: (g) => label(REASON_CODES, g.reasonCode) },
          { key: 's', header: tr('الحالة', 'Status'), render: (g) => <Status map={GRANT_STATUS} value={g.status} /> },
          { key: 'd', header: tr('التاريخ', 'Date'), render: (g) => <When value={g.createdAt} /> },
          { key: 'go', header: '', align: 'end', className: 'is-actions', render: (g) => (manage && g.status === 'active' ? <Button size="sm" variant="danger" icon="ban" onClick={() => { setErrors({}); setRevoke({ grant: g, reasonCode: 'LICENCE_EXPIRED' }); }}>{tr('سحب', 'Revoke')}</Button> : null) },
        ]}
      />
      <Pager meta={list.meta} onPage={list.setPage} />
      {revoke && (
        <ActionDialog open onClose={() => setRevoke(null)} icon="ban" tone="danger" title={tr('سحب الصلاحية', 'Revoke the grant')} description={tr(`للخبير ${revoke.grant.expert.name}`, `For ${revoke.grant.expert.name}`)} confirmLabel={tr('سحب الصلاحية', 'Revoke grant')} variant="danger" busy={action.busy} onSubmit={submitRevoke} error={errors._form?.[0]}>
          <Field label={tr('سبب السحب', 'Reason')} htmlFor="rv-reason"><Select id="rv-reason" value={revoke.reasonCode} onChange={(v) => setRevoke({ ...revoke, reasonCode: v })} options={Object.entries(REASON_CODES).map(([value, text]) => ({ value, label: tx(text) }))} /></Field>
          <Notice tone="warning">{tr('لن يظهر الخبير في مطابقة هذه الخدمة بعد السحب.', 'The expert will no longer be matched to this service.')}</Notice>
        </ActionDialog>
      )}
      {create && (
        <ActionDialog open onClose={() => setCreate(null)} size="lg" icon="key" title={tr('منح صلاحية خدمة', 'Grant a service')} description={tr('اربط نطاقًا معتمدًا لخبير بنسخة خدمة في دولة محددة.', 'Link an expert’s verified scope to a service version in a country.')} confirmLabel={tr('منح', 'Grant')} busy={action.busy} onSubmit={submitCreate} error={errors._form?.[0]}>
          <Field label={tr('الخبير', 'Expert')} htmlFor="gr-expert"><Select id="gr-expert" placeholder={tr('اختر خبيرًا', 'Choose an expert')} value={String(create.expertId)} onChange={(v) => setCreate({ ...create, expertId: v, scopeId: '' })} options={(lookups.data?.experts || []).map((e) => ({ value: String(e.id), label: e.name }))} /></Field>
          <Field label={tr('النطاق المعتمد', 'Verified scope')} error={errors.scopeId?.[0]} htmlFor="gr-scope"><Select id="gr-scope" placeholder={tr('اختر نطاقًا', 'Choose a scope')} value={String(create.scopeId)} onChange={(v) => setCreate({ ...create, scopeId: v })} invalid={Boolean(errors.scopeId)} options={scopes.map((s) => ({ value: String(s.id), label: `${tx(DOMAINS[s.domain] || [s.domain, s.domain])} · ${s.role} · ${s.jurisdiction}` }))} /></Field>
          <Field label={tr('نسخة الخدمة', 'Service version')} error={errors.catalogVersionId?.[0]} htmlFor="gr-ver"><Select id="gr-ver" placeholder={tr('اختر خدمة', 'Choose a service')} value={String(create.catalogVersionId)} onChange={(v) => setCreate({ ...create, catalogVersionId: v })} invalid={Boolean(errors.catalogVersionId)} options={versions.map((v) => ({ value: String(v.id), label: v.text }))} /></Field>
          <div className="ad-two">
            <Field label={tr('الدولة', 'Country')} htmlFor="gr-j"><Select id="gr-j" value={create.jurisdictionCode} onChange={(v) => setCreate({ ...create, jurisdictionCode: v })} options={CATALOG_COUNTRIES.map((v) => ({ value: v, label: v }))} /></Field>
            <Field label={tr('رقم الدليل', 'Evidence id')} error={errors.evidenceId?.[0]} htmlFor="gr-ev" hint={tr('معرّف الرخصة أو المستند الذي تحققت منه.', 'Id of the licence or document you checked.')}><TextInput id="gr-ev" dir="ltr" inputMode="numeric" value={create.evidenceId} onChange={(v) => setCreate({ ...create, evidenceId: v.replace(/\D/g, '') })} invalid={Boolean(errors.evidenceId)} /></Field>
          </div>
          <Field label={tr('السبب', 'Reason')} htmlFor="gr-reason"><Select id="gr-reason" value={create.reasonCode} onChange={(v) => setCreate({ ...create, reasonCode: v })} options={['LICENCE_VERIFIED', 'POLICY_VERIFIED'].map((v) => ({ value: v, label: tx(REASON_CODES[v]) }))} /></Field>
        </ActionDialog>
      )}
    </Section>
  );
}

/* ───────── Waiting cases ───────── */
function WaitingTab() {
  const { tr, tx } = useUserI18n();
  const label = useLabel();
  const { can } = useAdminSession();
  const list = usePagedList((q) => adminCatalog.waitingCases(q), {});
  return (
    <Section flush icon="clock" title={tr('حالات تنتظر توفر خبراء', 'Cases waiting for experts')}>
      <div className="ad-pad" style={{ paddingBottom: 0 }}><Notice tone="info">{tr('هذه حالات جاهزة لكن لا يوجد خبير معتمد لخدمتها. اعتماد خبراء جدد أو منح صلاحيات خدمة يفتح لها المطابقة.', 'These cases are ready but no verified expert covers their service yet. Approving experts or granting services opens matching for them.')}</Notice></div>
      <DataTable
        caption={tr('حالات تنتظر خبراء', 'Cases waiting for experts')} rows={list.items} rowKey="caseId" loading={list.loading} error={list.error} onRetry={() => list.reload()}
        to={can(P.CASES_VIEW) ? (r) => withParams(PATHS.ADMIN_CASE_DETAIL, { caseId: r.caseId }) : undefined}
        empty={<EmptyState icon="checkCircle" title={tr('لا حالات تنتظر', 'Nothing is waiting')} description={tr('كل الحالات الجاهزة لها خبراء مطابقون.', 'Every ready case has matching experts.')} />}
        columns={[
          { key: 'title', header: tr('الحالة', 'Case'), primary: true, render: (r) => <span><b dir="auto">{r.title}</b><br /><small className="ad-muted">#{r.caseId}</small></span> },
          { key: 'user', header: tr('المستخدم', 'User'), render: (r) => r.user.name },
          { key: 'domain', header: tr('المجال', 'Domain'), render: (r) => label(DOMAINS, r.domain) },
          { key: 'entry', header: tr('الخدمة المطلوبة', 'Requested service'), render: (r) => (r.catalogEntry ? tx([r.catalogEntry.ar, r.catalogEntry.en]) : '—') },
          { key: 'since', header: tr('تنتظر منذ', 'Waiting since'), render: (r) => <When value={r.waitingSince} /> },
        ]}
      />
      <Pager meta={list.meta} onPage={list.setPage} />
    </Section>
  );
}

export default function Catalog() {
  const { tr, tx, fmtNumber } = useUserI18n();
  const { queues } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'services');
  useEffect(() => { setTab(params.get('tab') || 'services'); }, [params]);
  const change = (id) => { setTab(id); setParams(id === 'services' ? {} : { tab: id }, { replace: true }); };
  return (
    <div className="ad-page">
      <PageHeader icon="layers" title={tr('الكتالوج والخدمات', 'Catalog & services')} subtitle={tr('ما تقدّمه المنصة: الخدمات ونسخها وسياساتها، وتصنيف الدول والمجالات، وصلاحيات الخبراء.', 'What the platform offers: services, their versions and policies, the country and domain taxonomy, and expert grants.')} />
      <Tabs label={tr('أقسام الكتالوج', 'Catalog sections')} value={tab} onChange={change} tabs={[
        { id: 'services', icon: 'layers', label: tr('الخدمات', 'Services') },
        { id: 'taxonomy', icon: 'tag', label: tr('التصنيف', 'Taxonomy') },
        { id: 'grants', icon: 'key', label: tr('صلاحيات الخبراء', 'Expert grants') },
        { id: 'waiting', icon: 'clock', label: tr('تنتظر خبراء', 'Waiting cases'), count: queues.waiting > 0 ? fmtNumber(queues.waiting) : null },
      ]} />
      {tab === 'services' && <ServicesTab />}
      {tab === 'taxonomy' && <TaxonomyTab />}
      {tab === 'grants' && <GrantsTab />}
      {tab === 'waiting' && <WaitingTab />}
    </div>
  );
}
