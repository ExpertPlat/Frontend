import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Landing from '../features/PublicPages/Landing/Landing';
import NotFound from '../features/PublicPages/NotFound/NotFound';
import LegalPage from '../features/PublicPages/Legal/LegalPage';
import AuthLayout from '../features/auth/components/AuthLayout/AuthLayout';
import Login from '../features/auth/pages/Login/Login';
import Register from '../features/auth/pages/Register/Register';
import ResetPassword from '../features/auth/pages/ResetPassword/ResetPassword';
import EmailVerification from '../features/auth/pages/EmailVerification/EmailVerification';
import EmailVerified from '../features/auth/pages/EmailVerified/EmailVerified';
import ExpertAuthLayout from '../features/expertAuth/components/ExpertAuthLayout/ExpertAuthLayout';
import ExpertLogin from '../features/expertAuth/pages/ExpertLogin/ExpertLogin';
import ExpertRegister from '../features/expertAuth/pages/ExpertRegister/ExpertRegister';
import ExpertResetPassword from '../features/expertAuth/pages/ExpertResetPassword/ExpertResetPassword';
import ExpertEmailVerification from '../features/expertAuth/pages/ExpertEmailVerification/ExpertEmailVerification';
import ExpertEmailVerified from '../features/expertAuth/pages/ExpertEmailVerified/ExpertEmailVerified';
import AdminAuthLayout from '../features/adminAuth/components/AdminAuthLayout/AdminAuthLayout';
import AdminLogin from '../features/adminAuth/pages/AdminLogin/AdminLogin';
import AdminPermissionRoute from '../features/adminAuthorization/AdminPermissionRoute';
import { ADMIN_PERMISSIONS as P } from '../features/adminAuthorization/adminPermissions';
import { GuestRoute, ProtectedRoute } from './AuthRouteGuards';
import { PATHS } from './paths';

const PublicExpertProfile = lazy(() => import('../features/PublicPages/ExpertProfile/PublicExpertProfile'));
const ExpertShell = lazy(() => import('../features/expertDashboard/components/ExpertShell'));
const ExpertHome = lazy(() => import('../features/expertDashboard/pages/Home/ExpertHome'));
const ExpertKyc = lazy(() => import('../features/expertDashboard/pages/Kyc/ExpertKyc'));
const ExpertProfileDashboard = lazy(() => import('../features/expertDashboard/pages/Profile/ExpertProfile'));
const ExpertOfferings = lazy(() => import('../features/expertDashboard/pages/Offerings/ExpertOfferings'));
const ExpertOfferingForm = lazy(() => import('../features/expertDashboard/pages/Offerings/ExpertOfferingForm'));
const ExpertRequests = lazy(() => import('../features/expertDashboard/pages/Requests/ExpertRequests'));
const ExpertRequestDetail = lazy(() => import('../features/expertDashboard/pages/Requests/ExpertRequestDetail'));
const RequestRedirect = lazy(() => import('../features/expertDashboard/pages/Requests/RequestRedirect'));
const ExpertBookings = lazy(() => import('../features/expertDashboard/pages/Bookings/ExpertBookings'));
const ExpertPayments = lazy(() => import('../features/expertDashboard/pages/Payments/ExpertPayments'));
const ExpertReviews = lazy(() => import('../features/expertDashboard/pages/Reviews/ExpertReviews'));
const ExpertNotifications = lazy(() => import('../features/expertDashboard/pages/Notifications/ExpertNotifications'));
const ExpertSettings = lazy(() => import('../features/expertDashboard/pages/Settings/ExpertSettings'));
const AdminAcceptInvitation = lazy(() => import('../features/adminAuth/pages/AdminAcceptInvitation/AdminAcceptInvitation'));
const AdminShell = lazy(() => import('../features/adminDashboard/shell/AdminShell'));
const AdminOverview = lazy(() => import('../features/adminDashboard/pages/Overview'));
const AdminKycQueue = lazy(() => import('../features/adminDashboard/pages/kyc/KycQueue'));
const AdminKycReview = lazy(() => import('../features/adminDashboard/pages/kyc/KycReview'));
const AdminRenewals = lazy(() => import('../features/adminDashboard/pages/renewals/Renewals'));
const AdminRenewalDetail = lazy(() => import('../features/adminDashboard/pages/renewals/RenewalDetail'));
const AdminExperts = lazy(() => import('../features/adminDashboard/pages/people/Experts'));
const AdminExpertDetail = lazy(() => import('../features/adminDashboard/pages/people/ExpertDetail'));
const AdminUsers = lazy(() => import('../features/adminDashboard/pages/people/Users'));
const AdminUserDetail = lazy(() => import('../features/adminDashboard/pages/people/UserDetail'));
const AdminCases = lazy(() => import('../features/adminDashboard/pages/cases/Cases'));
const AdminCaseDetail = lazy(() => import('../features/adminDashboard/pages/cases/CaseDetail'));
const AdminCatalog = lazy(() => import('../features/adminDashboard/pages/catalog/Catalog'));
const AdminCatalogEntry = lazy(() => import('../features/adminDashboard/pages/catalog/CatalogEntry'));
const AdminReviews = lazy(() => import('../features/adminDashboard/pages/moderation/Reviews'));
const AdminPrivacy = lazy(() => import('../features/adminDashboard/pages/moderation/Privacy'));
const AdminFinance = lazy(() => import('../features/adminDashboard/pages/finance/Finance'));
const AdminFundingDetail = lazy(() => import('../features/adminDashboard/pages/finance/FundingDetail'));
const AdminAdmins = lazy(() => import('../features/adminDashboard/pages/team/Admins'));
const AdminAdminCreate = lazy(() => import('../features/adminDashboard/pages/team/AdminCreate'));
const AdminAdminDetail = lazy(() => import('../features/adminDashboard/pages/team/AdminDetail'));
const AdminRoles = lazy(() => import('../features/adminDashboard/pages/team/Roles'));
const AdminRoleForm = lazy(() => import('../features/adminDashboard/pages/team/RoleForm'));
const AdminProfile = lazy(() => import('../features/adminDashboard/pages/Profile'));
const UserShell = lazy(() => import('../features/userDashboard/components/UserShell'));
const UserHome = lazy(() => import('../features/userDashboard/pages/Home/UserHome'));
const UserCases = lazy(() => import('../features/userDashboard/pages/Cases/UserCases'));
const UserOffers = lazy(() => import('../features/userDashboard/pages/Proposals/UserOffers'));
const UserAppointments = lazy(() => import('../features/userDashboard/pages/Appointments/UserAppointments'));
const UserPayments = lazy(() => import('../features/userDashboard/pages/Payments/UserPayments'));
const UserReviews = lazy(() => import('../features/userDashboard/pages/Reviews/UserReviews'));
const UserContexts = lazy(() => import('../features/userDashboard/pages/Contexts/UserContexts'));
const UserNotifications = lazy(() => import('../features/userDashboard/pages/Notifications/UserNotifications'));
const UserSettings = lazy(() => import('../features/userDashboard/pages/Settings/UserSettings'));
const DescribeStep = lazy(() => import('../features/userDashboard/journey/DescribeStep'));
const JourneyLayout = lazy(() => import('../features/userDashboard/journey/JourneyLayout'));
const JourneyIndex = lazy(() => import('../features/userDashboard/journey/JourneyLayout').then((m) => ({ default: m.JourneyIndex })));
const AnalysisStep = lazy(() => import('../features/userDashboard/journey/AnalysisStep'));
const ExpertsStep = lazy(() => import('../features/userDashboard/journey/ExpertsStep'));
const OfferStep = lazy(() => import('../features/userDashboard/journey/OfferStep'));
const AgreementStep = lazy(() => import('../features/userDashboard/journey/AgreementStep'));

function RouteFallback() {
  return (
    <main className="route-loading" aria-live="polite" aria-busy="true">
      <span aria-hidden="true" />
      <b>جارٍ تجهيز تجربتك</b>
      <small>لحظات ونفتح لك المساحة المطلوبة.</small>
    </main>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path={PATHS.HOME} element={<Landing />} />
        <Route path={PATHS.PRIVACY} element={<LegalPage />} />
        <Route path={PATHS.TERMS} element={<LegalPage />} />
        <Route path={PATHS.PUBLIC_EXPERT_PROFILE} element={<PublicExpertProfile />} />

        <Route element={<AuthLayout />}>
          <Route element={<GuestRoute accountType="user" redirectTo={PATHS.USER_DASHBOARD} />}>
            <Route path={PATHS.LOGIN} element={<Login />} />
          </Route>
          <Route path={PATHS.REGISTER} element={<Register />} />
          <Route path={PATHS.FORGOT_PASSWORD} element={<Navigate to={`${PATHS.LOGIN}?forgot=1`} replace />} />
          <Route path={PATHS.RESET_PASSWORD} element={<ResetPassword />} />
          <Route path={PATHS.VERIFY_EMAIL} element={<EmailVerification />} />
          <Route path={PATHS.VERIFY_EMAIL_CALLBACK} element={<EmailVerification />} />
          <Route path={PATHS.EMAIL_VERIFIED} element={<EmailVerified />} />
        </Route>

        <Route element={<ExpertAuthLayout />}>
          <Route element={<GuestRoute accountType="expert" redirectTo={PATHS.EXPERT_DASHBOARD} verificationPath={PATHS.EXPERT_VERIFY_EMAIL} />}>
            <Route path={PATHS.EXPERT_LOGIN} element={<ExpertLogin />} />
          </Route>
          <Route path={PATHS.EXPERT_REGISTER} element={<ExpertRegister />} />
          <Route path={PATHS.EXPERT_FORGOT_PASSWORD} element={<Navigate to={`${PATHS.EXPERT_LOGIN}?forgot=1`} replace />} />
          <Route path={PATHS.EXPERT_RESET_PASSWORD} element={<ExpertResetPassword />} />
          <Route path={PATHS.EXPERT_VERIFY_EMAIL} element={<ExpertEmailVerification />} />
          <Route path={PATHS.EXPERT_VERIFY_EMAIL_CALLBACK} element={<ExpertEmailVerification />} />
          <Route path={PATHS.EXPERT_EMAIL_VERIFIED} element={<ExpertEmailVerified />} />
        </Route>
        {/* Expert workspace: needs a signed-in, verified expert session. */}
        <Route element={<ProtectedRoute accountType="expert" loginPath={PATHS.EXPERT_LOGIN} verificationPath={PATHS.EXPERT_VERIFY_EMAIL} />}>
          <Route element={<ExpertShell />}>
            <Route path={PATHS.EXPERT_DASHBOARD} element={<ExpertHome />} />
            <Route path={PATHS.EXPERT_KYC} element={<ExpertKyc />} />
            <Route path={PATHS.EXPERT_PROFILE} element={<ExpertProfileDashboard />} />
            <Route path={PATHS.EXPERT_AVAILABILITY} element={<Navigate to={`${PATHS.EXPERT_PROFILE}?tab=availability`} replace />} />
            <Route path={PATHS.EXPERT_SCOPES} element={<Navigate to={`${PATHS.EXPERT_PROFILE}?tab=scopes`} replace />} />
            <Route path={PATHS.EXPERT_RENEWAL_DETAIL} element={<Navigate to={`${PATHS.EXPERT_PROFILE}?tab=scopes`} replace />} />
            <Route path={PATHS.EXPERT_OFFERINGS} element={<ExpertOfferings />} />
            <Route path={PATHS.EXPERT_OFFERING_NEW} element={<ExpertOfferingForm />} />
            <Route path={PATHS.EXPERT_OFFERING_DETAIL} element={<ExpertOfferingForm />} />
            <Route path={PATHS.EXPERT_INVITATIONS} element={<ExpertRequests />} />
            <Route path={PATHS.EXPERT_INVITATION_DETAIL} element={<ExpertRequestDetail />} />
            <Route path={PATHS.EXPERT_PROPOSAL_NEW} element={<ExpertRequestDetail />} />
            <Route path={PATHS.EXPERT_PROPOSALS} element={<Navigate to={PATHS.EXPERT_INVITATIONS} replace />} />
            <Route path={PATHS.EXPERT_PROPOSAL_DETAIL} element={<RequestRedirect by="proposal" />} />
            <Route path={PATHS.EXPERT_PROPOSAL_REVISE} element={<RequestRedirect by="proposal" />} />
            <Route path={PATHS.EXPERT_AGREEMENTS} element={<Navigate to={PATHS.EXPERT_INVITATIONS} replace />} />
            <Route path={PATHS.EXPERT_AGREEMENT_DETAIL} element={<RequestRedirect by="agreement" />} />
            <Route path={PATHS.EXPERT_BOOKINGS} element={<ExpertBookings />} />
            <Route path={PATHS.EXPERT_BOOKING_DETAIL} element={<RequestRedirect by="booking" />} />
            <Route path={PATHS.EXPERT_PAYMENTS} element={<ExpertPayments />} />
            <Route path={PATHS.EXPERT_REVIEWS} element={<ExpertReviews />} />
            <Route path={PATHS.EXPERT_NOTIFICATIONS} element={<ExpertNotifications />} />
            <Route path={PATHS.EXPERT_SETTINGS} element={<ExpertSettings />} />
          </Route>
        </Route>

        <Route element={<AdminAuthLayout />}>
          <Route path={PATHS.ADMIN_ACCEPT_INVITATION} element={<AdminAcceptInvitation />} />
          <Route element={<GuestRoute accountType="admin" redirectTo={PATHS.ADMIN_DASHBOARD} />}>
            <Route path={PATHS.ADMIN_LOGIN} element={<AdminLogin />} />
          </Route>
        </Route>

        {/* Admin workspace: needs a signed-in admin session.
            Each page declares the permission it needs; the shell hides what the signed-in admin cannot use. */}
        <Route element={<ProtectedRoute accountType="admin" loginPath={PATHS.ADMIN_LOGIN} />}>
          <Route element={<AdminShell />}>
            <Route path={PATHS.ADMIN_DASHBOARD} element={<AdminOverview />} />
            <Route path={PATHS.ADMIN_PROFILE} element={<AdminProfile />} />

            <Route element={<AdminPermissionRoute permission={P.EXPERTS_REVIEW_KYC} />}>
              <Route path={PATHS.ADMIN_KYC} element={<AdminKycQueue />} />
              <Route path={PATHS.ADMIN_KYC_REVIEW} element={<AdminKycReview />} />
            </Route>
            <Route element={<AdminPermissionRoute permission={P.EXPERT_RENEWALS_VIEW_ANY} />}>
              <Route path={PATHS.ADMIN_RENEWALS} element={<AdminRenewals />} />
              <Route path={PATHS.ADMIN_RENEWAL_DETAIL} element={<AdminRenewalDetail />} />
            </Route>
            <Route element={<AdminPermissionRoute permission={P.EXPERTS_VIEW_ANY} />}>
              <Route path={PATHS.ADMIN_EXPERTS} element={<AdminExperts />} />
              <Route path={PATHS.ADMIN_EXPERT_DETAIL} element={<AdminExpertDetail />} />
            </Route>
            <Route element={<AdminPermissionRoute permission={P.USERS_VIEW_ANY} />}>
              <Route path={PATHS.ADMIN_USERS} element={<AdminUsers />} />
              <Route path={PATHS.ADMIN_USER_DETAIL} element={<AdminUserDetail />} />
            </Route>
            <Route element={<AdminPermissionRoute permission={P.CASES_VIEW_ANY} />}>
              <Route path={PATHS.ADMIN_CASES} element={<AdminCases />} />
              <Route path={PATHS.ADMIN_CASE_DETAIL} element={<AdminCaseDetail />} />
            </Route>
            <Route element={<AdminPermissionRoute permission={P.CATALOG_VIEW} />}>
              <Route path={PATHS.ADMIN_CATALOG} element={<AdminCatalog />} />
              <Route path={PATHS.ADMIN_CATALOG_ENTRY} element={<AdminCatalogEntry />} />
            </Route>
            <Route element={<AdminPermissionRoute permission={P.REVIEWS_VIEW_ANY} />}>
              <Route path={PATHS.ADMIN_REVIEWS} element={<AdminReviews />} />
            </Route>
            <Route element={<AdminPermissionRoute permission={P.DATA_REQUESTS_VIEW_ANY} />}>
              <Route path={PATHS.ADMIN_PRIVACY} element={<AdminPrivacy />} />
            </Route>
            <Route element={<AdminPermissionRoute anyOf={[P.FINANCE_VIEW, P.REFUNDS_VIEW, P.DISPUTES_VIEW, P.STRIPE_ACCOUNTS_VIEW]} />}>
              <Route path={PATHS.ADMIN_FINANCE} element={<AdminFinance />} />
              <Route path={PATHS.ADMIN_FUNDING_DETAIL} element={<AdminFundingDetail />} />
            </Route>
            <Route element={<AdminPermissionRoute permission={P.ADMINS_VIEW_ANY} />}>
              <Route path={PATHS.ADMIN_SUB_ADMINS} element={<AdminAdmins />} />
              <Route path={PATHS.ADMIN_SUB_ADMIN_DETAIL} element={<AdminAdminDetail />} />
            </Route>
            <Route element={<AdminPermissionRoute allOf={[P.ADMINS_CREATE, P.ROLES_VIEW_ANY]} />}>
              <Route path={PATHS.ADMIN_SUB_ADMIN_CREATE} element={<AdminAdminCreate />} />
            </Route>
            <Route element={<AdminPermissionRoute permission={P.ROLES_VIEW_ANY} />}>
              <Route path={PATHS.ADMIN_ROLES} element={<AdminRoles />} />
              <Route path={PATHS.ADMIN_ROLE_DETAIL} element={<AdminRoleForm />} />
            </Route>
            <Route element={<AdminPermissionRoute permission={P.ROLES_CREATE} />}>
              <Route path={PATHS.ADMIN_ROLE_CREATE} element={<AdminRoleForm />} />
            </Route>
          </Route>
        </Route>

        {/* User workspace: needs a signed-in user session. */}
        <Route element={<ProtectedRoute accountType="user" loginPath={PATHS.LOGIN} />}>
          <Route element={<UserShell />}>
            <Route path={PATHS.USER_DASHBOARD} element={<UserHome />} />
            <Route path={PATHS.USER_CASES} element={<UserCases />} />
            <Route path={PATHS.USER_CASE_NEW} element={<DescribeStep />} />
            <Route path={PATHS.USER_CASE_DETAIL} element={<JourneyLayout />}>
              <Route index element={<JourneyIndex />} />
              <Route path="analysis" element={<AnalysisStep />} />
              <Route path="experts" element={<ExpertsStep />} />
              <Route path="offer" element={<OfferStep />} />
              <Route path="agreement" element={<AgreementStep />} />
            </Route>
            <Route path={PATHS.USER_OFFERS} element={<UserOffers />} />
            <Route path={PATHS.USER_APPOINTMENTS} element={<UserAppointments />} />
            <Route path={PATHS.USER_PAYMENTS} element={<UserPayments />} />
            <Route path={PATHS.USER_REVIEWS} element={<UserReviews />} />
            <Route path={PATHS.USER_CONTEXTS} element={<UserContexts />} />
            <Route path={PATHS.USER_NOTIFICATIONS} element={<UserNotifications />} />
            <Route path={PATHS.USER_SETTINGS} element={<UserSettings />} />
            {/* Legacy URLs from earlier dashboards */}
            <Route path="/app/invitations" element={<Navigate to={PATHS.USER_OFFERS} replace />} />
            <Route path="/app/proposals" element={<Navigate to={PATHS.USER_OFFERS} replace />} />
            <Route path="/app/experts" element={<Navigate to={PATHS.USER_OFFERS} replace />} />
            <Route path="/app/cases/current" element={<Navigate to={PATHS.USER_CASES} replace />} />
            <Route path="/app/consultations" element={<Navigate to={PATHS.USER_APPOINTMENTS} replace />} />
            <Route path="/app/profile" element={<Navigate to={PATHS.USER_SETTINGS} replace />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
