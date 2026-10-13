import { reachedStage } from './journeyData';

/** Stage a case list row should open: the furthest one reached, using the per-case slices of the workspace snapshot. */
export function caseStage(caseItem, workspace) {
  const own = (rows) => rows.filter((row) => row.caseId === caseItem.id);
  return reachedStage({ caseData: caseItem, invitations: own(workspace.invitations), proposals: own(workspace.proposals), agreements: own(workspace.agreements) });
}
