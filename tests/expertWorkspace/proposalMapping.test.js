import test from 'node:test';
import assert from 'node:assert/strict';
import { contentFromForm, formFromVersion, newForm, sharesFromAmounts, validateForm } from '../../src/features/expertDashboard/common/proposalMapping.js';
import { splitByShares, toMinor, fromMinor, toApiInstant } from '../../src/services/money.js';

const t = (ar) => ar;
const filled = (patch = {}) => newForm({ price: '4500', scopeSummary: 'استشارة قانونية لتأسيس فرع متجرك في الإمارات', deliverables: ['تقرير مكتوب', 'جلسة فيديو'], milestones: [{ title: 'الجلسة', share: 40 }, { title: 'التقرير', share: 60 }], ...patch });

test('price text becomes integer minor units without float drift', () => {
  assert.equal(toMinor('4500'), 450000);
  assert.equal(toMinor('19.99'), 1999);
  assert.equal(toMinor('0.1'), 10);
  assert.equal(toMinor('1.234'), null);
  assert.equal(toMinor('abc'), null);
  assert.equal(fromMinor(1999), '19.99');
});

test('milestone amounts always add up to the total', () => {
  const parts = splitByShares(333333, [33, 33, 34]);
  assert.equal(parts.reduce((a, b) => a + b, 0), 333333);
  assert.ok(parts.every(Number.isInteger));
});

test('form converts to the documented ProposalContent body', () => {
  const body = contentFromForm(filled());
  assert.deepEqual(body.milestones.map((m) => m.amountMinor), [180000, 270000]);
  assert.equal(body.deliverables[0].title, 'تقرير مكتوب');
  assert.equal(body.currency, 'AED');
  assert.equal('amountMinor' in body, false);
  assert.ok(Number.isInteger(body.clarificationAllowance) && Number.isInteger(body.reviewPeriodHours));
});

test('validation catches what the API would reject', () => {
  assert.deepEqual(validateForm(filled(), t), {});
  assert.ok(validateForm(filled({ price: '' }), t).price);
  assert.ok(validateForm(filled({ scopeSummary: 'قصير' }), t).scopeSummary);
  assert.ok(validateForm(filled({ deliverables: ['', ''] }), t).deliverables);
  assert.ok(validateForm(filled({ milestones: [{ title: 'أ', share: 50 }, { title: 'ب', share: 50 }] }), t).milestones);
  assert.ok(validateForm(filled({ milestones: [{ title: 'الجلسة', share: 50 }, { title: 'التقرير', share: 40 }] }), t).milestones);
});

test('a revision starts from the previous version and round-trips', () => {
  const version = { scopeSummary: 'نطاق العمل المقترح للحالة', inputsRequired: '', deliverables: [{ title: 'تقرير' }], exclusions: ['تنفيذ'], milestones: [{ title: 'أ', amountMinor: 160000 }, { title: 'ب', amountMinor: 240000 }], consultationMinutes: 45, validityDays: 5, clarificationAllowance: 1, reviewPeriodHours: 48, currency: 'AED' };
  const form = formFromVersion(version);
  assert.equal(form.price, '4000');
  assert.deepEqual(form.milestones.map((m) => m.share), [40, 60]);
  const body = contentFromForm(form);
  assert.deepEqual(body.milestones.map((m) => m.amountMinor), [160000, 240000]);
  assert.equal(body.consultationMinutes, 45);
  assert.deepEqual(sharesFromAmounts([1, 1, 1]), [33, 33, 34]);
});

test('API instants have no milliseconds', () => {
  assert.equal(toApiInstant('2026-10-12T06:00:00.000Z'), '2026-10-12T06:00:00Z');
});

import { localInputToUtc, utcToLocalInput } from '../../src/features/expertDashboard/utils/zonedTime.js';
test('wall-clock time in a time zone converts to the right UTC instant and back', () => {
  assert.equal(localInputToUtc('2026-10-12T10:00', 'Asia/Dubai'), '2026-10-12T06:00:00.000Z');
  assert.equal(localInputToUtc('2026-01-15T09:30', 'Europe/London'), '2026-01-15T09:30:00.000Z');
  assert.equal(localInputToUtc('2026-07-15T09:30', 'Europe/London'), '2026-07-15T08:30:00.000Z');
  assert.equal(utcToLocalInput('2026-10-12T06:00:00Z', 'Asia/Dubai'), '2026-10-12T10:00');
});
