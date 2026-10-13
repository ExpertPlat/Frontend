import { resolveAssetUrl } from '../../../utils/resolveAssetUrl.js';

export const WEEK_DAYS = Object.freeze(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

export const SERVICE_MODES = Object.freeze([
  'written_consultation',
  'video_consultation',
  'audio_consultation',
  'document_review',
  'project_advisory',
]);

export const PUBLICATION_REQUIREMENTS = Object.freeze([
  'kyc_approval',
  'professional_title',
  'bio',
  'public_languages',
  'verified_scope',
  'service_modes',
  'weekly_schedule',
]);

export function emptySchedule() {
  return WEEK_DAYS.map((day) => ({ day, enabled: false, windows: [] }));
}

function scheduleWithAllDays(value) {
  const byDay = new Map((Array.isArray(value) ? value : []).map((item) => [item?.day, item]));
  return WEEK_DAYS.map((day) => {
    const item = byDay.get(day) || {};
    return {
      day,
      enabled: Boolean(item.enabled),
      windows: Array.isArray(item.windows)
        ? item.windows.map((window) => ({ start: window?.start || '', end: window?.end || '' }))
        : [],
    };
  });
}

export function normalizeExpertProfileWorkspace(payload) {
  const data = payload?.data || payload || {};
  const account = data.account || {};
  const profile = data.profile || {};
  const availability = data.availability || {};
  const publication = data.publication || {};

  return {
    account: {
      name: account.name || '',
      email: account.email || '',
      country: account.country || '',
      language: account.language || '',
      kycStatus: account.kycStatus || 'not_submitted',
    },
    profile: {
      id: profile.id ?? null,
      slug: profile.slug || '',
      professionalTitle: profile.professionalTitle || '',
      bio: profile.bio || '',
      yearsExperience: profile.yearsExperience ?? '',
      specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
      publicLanguages: Array.isArray(profile.publicLanguages) ? profile.publicLanguages : [],
      avatarUrl: resolveAssetUrl(profile.avatarUrl),
      isPublished: Boolean(profile.isPublished),
      publishedAt: profile.publishedAt || null,
    },
    verifiedScopes: Array.isArray(data.verifiedScopes) ? data.verifiedScopes : [],
    availability: {
      timezone: availability.timezone || 'UTC',
      serviceModes: Array.isArray(availability.serviceModes) ? availability.serviceModes : [],
      weeklySchedule: scheduleWithAllDays(availability.weeklySchedule),
      blackoutDates: Array.isArray(availability.blackoutDates) ? availability.blackoutDates : [],
      maxActiveRequests: Number(availability.maxActiveRequests || 3),
      responseTimeHours: Number(availability.responseTimeHours || 48),
      acceptingNewRequests: Boolean(availability.acceptingNewRequests),
    },
    publication: {
      canPublish: Boolean(publication.canPublish),
      missingRequirements: Array.isArray(publication.missingRequirements) ? publication.missingRequirements : [],
      publiclyVisible: Boolean(publication.publiclyVisible),
      publicPath: publication.publicPath || '',
    },
  };
}


export function getAvailabilityValidationErrors(availability, translate = null) {
  const errors = {};
  const message = (key, fallback) => [translate ? translate(`profile.validation.${key}`) : fallback];
  const schedule = Array.isArray(availability?.weeklySchedule) ? availability.weeklySchedule : [];
  const serviceModes = Array.isArray(availability?.serviceModes) ? availability.serviceModes : [];
  const blackoutDates = Array.isArray(availability?.blackoutDates) ? availability.blackoutDates : [];

  const timezone = String(availability?.timezone || '').trim();
  if (!timezone) {
    errors.timezone = message('timezone', 'A valid timezone is required.');
  } else {
    try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(); }
    catch { errors.timezone = message('timezone', 'A valid timezone is required.'); }
  }

  if (serviceModes.length < 1 || serviceModes.length > 5 || serviceModes.some((mode) => !SERVICE_MODES.includes(mode))) {
    errors.serviceModes = message('serviceModes', 'Select between 1 and 5 supported service modes.');
  }
  const scheduleDays = schedule.map((day) => day?.day);
  if (schedule.length < 1 || schedule.length > 7 || new Set(scheduleDays).size !== scheduleDays.length || scheduleDays.some((day) => !WEEK_DAYS.includes(day))) {
    errors.weeklySchedule = message('weeklySchedule', 'A valid weekly schedule is required.');
  }

  schedule.forEach((day, dayIndex) => {
    const windows = Array.isArray(day?.windows) ? day.windows : [];
    if (day?.enabled && windows.length === 0) {
      errors[`weeklySchedule.${dayIndex}.windows`] = message('windowRequired', 'At least one time window is required for an enabled day.');
    }
    if (windows.length > 3) {
      errors[`weeklySchedule.${dayIndex}.windows`] = message('windowMax', 'A day can contain at most 3 time windows.');
    }
    windows.forEach((window, windowIndex) => {
      if (!/^\d{2}:\d{2}$/.test(String(window?.start || ''))) {
        errors[`weeklySchedule.${dayIndex}.windows.${windowIndex}.start`] = message('startTime', 'A start time is required.');
      }
      if (!/^\d{2}:\d{2}$/.test(String(window?.end || ''))) {
        errors[`weeklySchedule.${dayIndex}.windows.${windowIndex}.end`] = message('endTime', 'An end time is required.');
      } else if (String(window.end) <= String(window.start || '')) {
        errors[`weeklySchedule.${dayIndex}.windows.${windowIndex}.end`] = message('endAfterStart', 'The end time must be after the start time.');
      }
    });
  });

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const invalidBlackout = blackoutDates.some((date) => !/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || String(date) < todayIso);
  if (blackoutDates.length > 90 || new Set(blackoutDates).size !== blackoutDates.length || invalidBlackout) {
    errors.blackoutDates = message('blackoutDates', 'Blackout dates must be unique future-or-today dates and no more than 90 entries.');
  }

  const maxActive = Number(availability?.maxActiveRequests);
  if (!Number.isInteger(maxActive) || maxActive < 1 || maxActive > 50) {
    errors.maxActiveRequests = message('capacity', 'Capacity must be between 1 and 50.');
  }
  const responseHours = Number(availability?.responseTimeHours);
  if (!Number.isInteger(responseHours) || responseHours < 1 || responseHours > 336) {
    errors.responseTimeHours = message('responseTime', 'Response time must be between 1 and 336 hours.');
  }

  return errors;
}

export function profilePayload(profile) {
  return {
    professionalTitle: String(profile.professionalTitle || '').trim(),
    bio: String(profile.bio || '').trim(),
    yearsExperience: profile.yearsExperience === '' ? null : Number(profile.yearsExperience),
    specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
    publicLanguages: Array.isArray(profile.publicLanguages) ? profile.publicLanguages : [],
  };
}

export function availabilityPayload(availability) {
  return {
    timezone: availability.timezone,
    serviceModes: [...availability.serviceModes],
    weeklySchedule: availability.weeklySchedule.map((day) => ({
      day: day.day,
      enabled: Boolean(day.enabled),
      windows: day.enabled ? day.windows : [],
    })),
    blackoutDates: [...availability.blackoutDates],
    maxActiveRequests: Number(availability.maxActiveRequests),
    responseTimeHours: Number(availability.responseTimeHours),
    acceptingNewRequests: Boolean(availability.acceptingNewRequests),
  };
}
