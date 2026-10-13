import test from 'node:test';
import assert from 'node:assert/strict';
import {
  availabilityPayload,
  getAvailabilityValidationErrors,
  normalizeExpertProfileWorkspace,
  profilePayload,
} from '../../src/features/expertDashboard/data/expertProfileData.js';

test('workspace normalizer preserves account separation and fills missing week days', () => {
  const originalBaseUrl = process.env.VITE_API_BASE_URL;
  process.env.VITE_API_BASE_URL = 'https://api.example.test';
  const workspace = normalizeExpertProfileWorkspace({ data: {
    account: { name: 'Ahmad', email: 'expert@example.com', kycStatus: 'approved' },
    profile: { slug: 'ahmad-1', specialties: ['Contracts'], publicLanguages: ['ar'], avatarUrl: '/storage/avatars/ahmad.jpg' },
    verifiedScopes: [{ id: 8, domain: 'legal', isEffective: true }],
    availability: {
      timezone: 'Asia/Amman',
      serviceModes: ['written_consultation'],
      weeklySchedule: [{ day: 'mon', enabled: true, windows: [{ start: '09:00', end: '12:00' }] }],
    },
    publication: { canPublish: true, missingRequirements: [], publiclyVisible: false },
  } });

  assert.equal(workspace.account.email, 'expert@example.com');
  assert.equal(workspace.profile.slug, 'ahmad-1');
  assert.equal(workspace.profile.avatarUrl, 'https://api.example.test/storage/avatars/ahmad.jpg');
  assert.equal(workspace.verifiedScopes[0].domain, 'legal');
  assert.equal(workspace.availability.weeklySchedule.length, 7);
  assert.deepEqual(workspace.availability.weeklySchedule[0].windows, [{ start: '09:00', end: '12:00' }]);
  assert.equal(workspace.publication.canPublish, true);
  if (originalBaseUrl === undefined) delete process.env.VITE_API_BASE_URL;
  else process.env.VITE_API_BASE_URL = originalBaseUrl;
});

test('payload builders send only editable profile and availability fields', () => {
  const profile = profilePayload({
    professionalTitle: ' Consultant ', bio: ' Biography ', yearsExperience: '9',
    specialties: ['Contracts'], publicLanguages: ['ar'], email: 'must-not-be-sent@example.com',
  });
  assert.deepEqual(profile, {
    professionalTitle: 'Consultant', bio: 'Biography', yearsExperience: 9,
    specialties: ['Contracts'], publicLanguages: ['ar'],
  });

  const availability = availabilityPayload({
    timezone: 'UTC', serviceModes: ['document_review'], blackoutDates: [],
    maxActiveRequests: '4', responseTimeHours: '24', acceptingNewRequests: true,
    weeklySchedule: [
      { day: 'mon', enabled: false, windows: [{ start: '09:00', end: '12:00' }] },
    ],
  });
  assert.deepEqual(availability.weeklySchedule[0].windows, []);
  assert.equal(availability.maxActiveRequests, 4);
});


test('availability validation mirrors Sprint 0 backend limits without inventing overlap rules', () => {
  const valid = {
    timezone: 'Asia/Gaza',
    serviceModes: ['written_consultation'],
    blackoutDates: ['2026-12-31'],
    maxActiveRequests: 3,
    responseTimeHours: 24,
    weeklySchedule: [
      { day: 'mon', enabled: true, windows: [{ start: '09:00', end: '12:00' }, { start: '11:00', end: '13:00' }] },
    ],
  };
  assert.deepEqual(getAvailabilityValidationErrors(valid), {});

  const tooManyWindows = { ...valid, weeklySchedule: [{ day: 'mon', enabled: true, windows: [
    { start: '09:00', end: '10:00' }, { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' }, { start: '12:00', end: '13:00' },
  ] }] };
  assert.ok(getAvailabilityValidationErrors(tooManyWindows)['weeklySchedule.0.windows']);

  const invalidOrder = { ...valid, weeklySchedule: [{ day: 'mon', enabled: true, windows: [{ start: '12:00', end: '11:00' }] }] };
  assert.ok(getAvailabilityValidationErrors(invalidOrder)['weeklySchedule.0.windows.0.end']);
});
