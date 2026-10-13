import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { expertProfileService } from '../../../../services/expert/expertProfileService';
import { useResource } from '../../../../services/hooks';
import { Card, PageHeader, Segmented, SkeletonRows } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { ResourceError } from '../../common/parts';
import { normalizeExpertProfileWorkspace } from '../../data/expertProfileData';
import AvailabilityTab from './AvailabilityTab';
import ProfileTab from './ProfileTab';
import ScopesTab from './ScopesTab';

/** Profile, availability and professional scopes: one place, three tabs (?tab=profile|availability|scopes). */
export default function ExpertProfile() {
  const { tr } = useUserI18n();
  const [params, setParams] = useSearchParams();
  const tab = ['profile', 'availability', 'scopes'].includes(params.get('tab')) ? params.get('tab') : 'profile';
  const workspace = useResource(async () => normalizeExpertProfileWorkspace(await expertProfileService.getWorkspace()), []);
  const ws = workspace.data;
  return (
    <div className="jr-page jr-page--narrow">
      <PageHeader icon="user" title={tr('ملفي المهني', 'My profile')} subtitle={tr('ما يراه العملاء عنك، ومتى تعمل، ونطاقاتك المعتمدة.', 'What clients see, when you work, and your approved scopes.')} />
      <div className="ex-tabs"><Segmented label={tr('أقسام الملف', 'Profile sections')} value={tab} onChange={(value) => setParams(value === 'profile' ? {} : { tab: value })} options={[{ value: 'profile', label: tr('الملف', 'Profile') }, { value: 'availability', label: tr('الإتاحة', 'Availability') }, { value: 'scopes', label: tr('النطاقات', 'Scopes') }]} /></div>
      <ResourceError resource={workspace} />
      {workspace.loading && !ws && <Card className="jr-card"><SkeletonRows rows={4} /></Card>}
      {ws && tab === 'profile' && <ProfileTab workspace={ws} onChange={() => workspace.reload({ silent: true })} />}
      {ws && tab === 'availability' && <AvailabilityTab workspace={ws} onChange={() => workspace.reload({ silent: true })} />}
      {ws && tab === 'scopes' && <ScopesTab />}
    </div>
  );
}
