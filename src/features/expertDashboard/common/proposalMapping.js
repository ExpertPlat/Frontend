import { splitByShares, sumMinor, toMinor } from '../../../services/money.js';

/**
 * The proposal form works in friendly units (a price in major units, milestone percentages) and the API takes
 * ProposalContent (milestone amounts in integer minor units, total = their sum). These pure helpers convert both ways.
 */
export const EMPTY_FORM = Object.freeze({
  price: '', scopeSummary: '', inputsRequired: '', deliverables: ['', ''], exclusions: [],
  milestones: [{ title: '', share: 40 }, { title: '', share: 60 }],
  consultationMinutes: 60, validityDays: 7, clarificationAllowance: 2, reviewPeriodHours: 72, currency: 'AED',
});

export const newForm = (defaults = {}) => ({ ...EMPTY_FORM, deliverables: [...EMPTY_FORM.deliverables], exclusions: [], milestones: EMPTY_FORM.milestones.map((m) => ({ ...m })), ...defaults });

/** Percentages that add up to exactly 100 from milestone amounts. */
export function sharesFromAmounts(amounts) {
  const total = sumMinor(amounts);
  if (!total) return amounts.map(() => 0);
  let used = 0;
  return amounts.map((amount, index) => {
    const share = index === amounts.length - 1 ? 100 - used : Math.round((amount / total) * 100);
    used += share;
    return share;
  });
}

/** A proposal version returned by the API -> form state (used when revising after a change request). */
export function formFromVersion(version, exponent = 2) {
  const total = sumMinor(version.milestones, (m) => m.amountMinor);
  const shares = sharesFromAmounts(version.milestones.map((m) => m.amountMinor));
  return {
    price: String(total / 10 ** exponent), scopeSummary: version.scopeSummary || '', inputsRequired: version.inputsRequired || '',
    deliverables: version.deliverables.map((d) => d.title), exclusions: [...(version.exclusions || [])],
    milestones: version.milestones.map((m, i) => ({ title: m.title, share: shares[i] })),
    consultationMinutes: version.consultationMinutes || 60, validityDays: version.validityDays || 7,
    clarificationAllowance: version.clarificationAllowance ?? 2, reviewPeriodHours: version.reviewPeriodHours || 72, currency: version.currency || 'AED',
  };
}

/** Client-side check before sending; mirrors the API rules so most mistakes never leave the page. Returns `{ field: message }`. */
export function validateForm(form, t) {
  const errors = {};
  const total = toMinor(form.price);
  if (total === null || total < 1) errors.price = t('أدخل سعرًا صحيحًا أكبر من صفر.', 'Enter a valid price above zero.');
  if (String(form.scopeSummary).trim().length < 20) errors.scopeSummary = t('اشرح ما ستقدمه في 20 حرفًا على الأقل.', 'Describe what you will deliver in at least 20 characters.');
  const deliverables = form.deliverables.map((d) => d.trim()).filter(Boolean);
  if (!deliverables.length) errors.deliverables = t('أضف مخرجًا واحدًا على الأقل.', 'Add at least one deliverable.');
  else if (deliverables.some((d) => d.length < 3)) errors.deliverables = t('كل مخرج يحتاج 3 أحرف على الأقل.', 'Each deliverable needs at least 3 characters.');
  if (form.exclusions.map((e) => e.trim()).filter(Boolean).some((e) => e.length < 3)) errors.exclusions = t('كل بند يحتاج 3 أحرف على الأقل.', 'Each item needs at least 3 characters.');
  const shareTotal = form.milestones.reduce((sum, m) => sum + (Number(m.share) || 0), 0);
  if (form.milestones.some((m) => String(m.title).trim().length < 3)) errors.milestones = t('لكل مرحلة عنوان من 3 أحرف على الأقل.', 'Each stage needs a title of at least 3 characters.');
  else if (shareTotal !== 100) errors.milestones = t('نسب المراحل يجب أن تجمع 100%.', 'Stage percentages must add up to 100%.');
  else if (total && form.milestones.some((m, i) => splitByShares(total, form.milestones.map((x) => Number(x.share) || 0))[i] < 1)) errors.milestones = t('مبلغ المرحلة صغير جدًا.', 'A stage amount is too small.');
  return errors;
}

/** Form state -> body of POST /expert/invitations/{id}/proposal (or the content part of POST /expert/proposals/{id}/versions). */
export function contentFromForm(form) {
  const total = toMinor(form.price);
  const amounts = splitByShares(total, form.milestones.map((m) => Number(m.share) || 0));
  const exclusions = form.exclusions.map((e) => e.trim()).filter(Boolean);
  return {
    scopeSummary: form.scopeSummary.trim(),
    ...(form.inputsRequired.trim() ? { inputsRequired: form.inputsRequired.trim() } : {}),
    deliverables: form.deliverables.map((d) => d.trim()).filter(Boolean).map((title) => ({ title })),
    exclusions,
    clarificationAllowance: Number(form.clarificationAllowance),
    reviewPeriodHours: Number(form.reviewPeriodHours),
    consultationMinutes: Number(form.consultationMinutes),
    currency: form.currency,
    milestones: form.milestones.map((m, i) => ({ title: m.title.trim(), amountMinor: amounts[i] })),
    validityDays: Number(form.validityDays),
  };
}
