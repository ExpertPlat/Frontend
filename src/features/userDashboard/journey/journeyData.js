import { PATHS, withParams } from '../../../routes/paths';

/** The five stages of the case journey. Order matters: index = progress. */
export const STAGES = [
  { id: 'describe', icon: 'edit', label: ['وصف الحالة', 'Describe'] },
  { id: 'analysis', icon: 'sparkle', label: ['تحليل الحالة', 'Analysis'] },
  { id: 'experts', icon: 'users', label: ['اختيار الخبير', 'Choose expert'] },
  { id: 'offer', icon: 'fileCheck', label: ['العرض', 'Proposal'] },
  { id: 'agreement', icon: 'calendarCheck', label: ['الاتفاق والموعد', 'Agreement'] },
];

export const stagePath = (caseId, stage) => (stage === 'describe' ? PATHS.USER_CASE_NEW : withParams(PATHS.USER_CASE_STAGE, { caseId, stage }));

const OPEN_INVITATION = ['pending', 'accepted'];

/**
 * Furthest stage the case has reached, derived from the states the API returned (never from local flags).
 * 1 analysis: the case exists. 2 experts: the case was submitted. 3 offer: an invitation or proposal exists.
 * 4 agreement: a proposal was accepted and an agreement exists.
 */
export function reachedStage({ caseData, invitations = [], proposals = [], agreements = [] }) {
  if (!caseData) return 0;
  let reached = 1;
  if (caseData.status === 'ready_for_matching') reached = 2;
  if (invitations.some((item) => OPEN_INVITATION.includes(item.status)) || proposals.length > 0) reached = Math.max(reached, 3);
  if (agreements.some((item) => item.status !== 'cancelled')) reached = 4;
  return reached;
}

/** Latest invitation per expert, newest first. */
export const activeInvitations = (invitations = []) => invitations.filter((item) => OPEN_INVITATION.includes(item.status)).sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
