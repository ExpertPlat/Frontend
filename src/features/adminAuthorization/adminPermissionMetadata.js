import { ADMIN_PERMISSIONS } from './adminPermissions';

/** Bilingual labels for the permission strings returned by the API: [arabic, english]. */
export const ADMIN_PERMISSION_METADATA = Object.freeze({
  [ADMIN_PERMISSIONS.ADMINS_VIEW_ANY]: { group: ['الحسابات الإدارية', 'Admin accounts'], label: ['عرض قائمة الأدمن', 'View admins'], description: ['عرض الحسابات الإدارية.', 'See the administrator accounts.'] },
  [ADMIN_PERMISSIONS.ADMINS_VIEW]: { group: ['الحسابات الإدارية', 'Admin accounts'], label: ['عرض تفاصيل أدمن', 'View an admin'], description: ['فتح تفاصيل حساب إداري.', 'Open an administrator account.'] },
  [ADMIN_PERMISSIONS.ADMINS_CREATE]: { group: ['الحسابات الإدارية', 'Admin accounts'], label: ['إنشاء Sub-Admin', 'Create a sub-admin'], description: ['إنشاء حساب إداري وإرسال الدعوة.', 'Create an administrator and send the invitation.'] },
  [ADMIN_PERMISSIONS.ADMINS_UPDATE]: { group: ['الحسابات الإدارية', 'Admin accounts'], label: ['تعديل أدمن', 'Edit an admin'], description: ['تعديل البيانات والحالة وإعادة الدعوة.', 'Edit details, status and resend the invitation.'], sensitive: true },
  [ADMIN_PERMISSIONS.ADMINS_ASSIGN_ROLES]: { group: ['الحسابات الإدارية', 'Admin accounts'], label: ['تعيين الأدوار', 'Assign roles'], description: ['تعيين دور أو سحبه من حساب إداري.', 'Assign or revoke a role on an administrator.'], sensitive: true },
  [ADMIN_PERMISSIONS.ROLES_VIEW_ANY]: { group: ['الأدوار والصلاحيات', 'Roles & permissions'], label: ['عرض الأدوار', 'View roles'], description: ['عرض قائمة الأدوار.', 'See the roles.'] },
  [ADMIN_PERMISSIONS.ROLES_VIEW]: { group: ['الأدوار والصلاحيات', 'Roles & permissions'], label: ['عرض تفاصيل دور', 'View a role'], description: ['فتح دور وصلاحياته.', 'Open a role and its permissions.'] },
  [ADMIN_PERMISSIONS.ROLES_CREATE]: { group: ['الأدوار والصلاحيات', 'Roles & permissions'], label: ['إنشاء دور', 'Create a role'], description: ['إنشاء دور بصلاحيات محددة.', 'Create a role with chosen permissions.'], sensitive: true },
  [ADMIN_PERMISSIONS.ROLES_UPDATE]: { group: ['الأدوار والصلاحيات', 'Roles & permissions'], label: ['تعديل دور', 'Edit a role'], description: ['تعديل اسم الدور وصلاحياته.', 'Edit a role name and permissions.'], sensitive: true },
  [ADMIN_PERMISSIONS.ROLES_DELETE]: { group: ['الأدوار والصلاحيات', 'Roles & permissions'], label: ['حذف دور', 'Delete a role'], description: ['حذف دور غير مستخدم.', 'Delete an unused role.'], sensitive: true },
  [ADMIN_PERMISSIONS.PERMISSIONS_VIEW_ANY]: { group: ['الأدوار والصلاحيات', 'Roles & permissions'], label: ['عرض كتالوج الصلاحيات', 'View the permission catalogue'], description: ['جلب الصلاحيات الرسمية.', 'Load the official permission list.'] },
  [ADMIN_PERMISSIONS.USERS_VIEW_ANY]: { group: ['المستخدمون والخصوصية', 'Users & privacy'], label: ['عرض المستخدمين', 'View users'], description: ['عرض قائمة المستخدمين.', 'See the users.'] },
  [ADMIN_PERMISSIONS.USERS_VIEW]: { group: ['المستخدمون والخصوصية', 'Users & privacy'], label: ['عرض مستخدم', 'View a user'], description: ['فتح ملف مستخدم.', 'Open a user profile.'] },
  [ADMIN_PERMISSIONS.USERS_UPDATE]: { group: ['المستخدمون والخصوصية', 'Users & privacy'], label: ['تحديث مستخدم', 'Update a user'], description: ['محجوزة للخادم، لا يوجد مسار حاليًا.', 'Reserved by the server, no endpoint yet.'] },
  [ADMIN_PERMISSIONS.USERS_CONSENT_METADATA_VIEW]: { group: ['المستخدمون والخصوصية', 'Users & privacy'], label: ['عرض بيانات الموافقات', 'View consent records'], description: ['عرض قرارات الموافقة (بدون محتوى).', 'See consent decisions (metadata only).'] },
  [ADMIN_PERMISSIONS.DATA_REQUESTS_VIEW_ANY]: { group: ['المستخدمون والخصوصية', 'Users & privacy'], label: ['عرض طلبات البيانات', 'View data requests'], description: ['عرض طلبات التصدير والحذف.', 'See export and deletion requests.'] },
  [ADMIN_PERMISSIONS.DATA_REQUESTS_VIEW]: { group: ['المستخدمون والخصوصية', 'Users & privacy'], label: ['فتح طلب بيانات', 'Open a data request'], description: ['تفاصيل طلب بيانات محدد.', 'Details of a data request.'] },
  [ADMIN_PERMISSIONS.EXPERTS_VIEW_ANY]: { group: ['الخبراء والتحقق', 'Experts & verification'], label: ['عرض الخبراء', 'View experts'], description: ['عرض قائمة الخبراء.', 'See the experts.'] },
  [ADMIN_PERMISSIONS.EXPERTS_VIEW]: { group: ['الخبراء والتحقق', 'Experts & verification'], label: ['عرض خبير', 'View an expert'], description: ['فتح ملف خبير.', 'Open an expert profile.'] },
  [ADMIN_PERMISSIONS.EXPERTS_UPDATE]: { group: ['الخبراء والتحقق', 'Experts & verification'], label: ['تحديث خبير', 'Update an expert'], description: ['محجوزة للخادم، لا يوجد مسار حاليًا.', 'Reserved by the server, no endpoint yet.'] },
  [ADMIN_PERMISSIONS.EXPERTS_REVIEW_KYC]: { group: ['الخبراء والتحقق', 'Experts & verification'], label: ['مراجعة التحقق (KYC)', 'Review KYC'], description: ['فتح الطلبات والمستندات وتنفيذ القرارات.', 'Open applications and documents and take decisions.'], sensitive: true },
  [ADMIN_PERMISSIONS.EXPERT_RENEWALS_VIEW_ANY]: { group: ['تجديد النطاقات', 'Scope renewals'], label: ['عرض التجديدات', 'View renewals'], description: ['عرض طلبات التجديد.', 'See renewal requests.'] },
  [ADMIN_PERMISSIONS.EXPERT_RENEWALS_VIEW]: { group: ['تجديد النطاقات', 'Scope renewals'], label: ['فتح تجديد', 'Open a renewal'], description: ['تفاصيل طلب تجديد.', 'Details of a renewal.'] },
  [ADMIN_PERMISSIONS.EXPERT_RENEWALS_VIEW_EVIDENCE]: { group: ['تجديد النطاقات', 'Scope renewals'], label: ['عرض الأدلة', 'View evidence'], description: ['فتح مستندات التجديد.', 'Open renewal documents.'] },
  [ADMIN_PERMISSIONS.EXPERT_RENEWALS_REVIEW]: { group: ['تجديد النطاقات', 'Scope renewals'], label: ['مراجعة التجديد', 'Review renewals'], description: ['بدء المراجعة والقرار.', 'Start review and decide.'], sensitive: true },
  [ADMIN_PERMISSIONS.CATALOG_VIEW]: { group: ['الكتالوج', 'Catalogue'], label: ['عرض الكتالوج', 'View the catalogue'], description: ['عرض العقد والخدمات والمنح.', 'See nodes, services and grants.'] },
  [ADMIN_PERMISSIONS.CATALOG_MANAGE_DRAFTS]: { group: ['الكتالوج', 'Catalogue'], label: ['إدارة المسودات', 'Manage drafts'], description: ['إنشاء عقد وخدمات وإصدارات مسودة.', 'Create nodes, services and draft versions.'] },
  [ADMIN_PERMISSIONS.CATALOG_REVIEW]: { group: ['الكتالوج', 'Catalogue'], label: ['مراجعة الإصدارات', 'Review versions'], description: ['اعتماد إصدار مسودة.', 'Approve a draft version.'] },
  [ADMIN_PERMISSIONS.CATALOG_PUBLISH]: { group: ['الكتالوج', 'Catalogue'], label: ['نشر الإصدارات', 'Publish versions'], description: ['نشر إصدار ومنح الخبراء.', 'Publish a version and grant experts.'], sensitive: true },
  [ADMIN_PERMISSIONS.CATALOG_PAUSE]: { group: ['الكتالوج', 'Catalogue'], label: ['إيقاف الإصدارات', 'Pause versions'], description: ['إيقاف أو سحب خدمة منشورة.', 'Pause or retire a live service.'], sensitive: true },
  [ADMIN_PERMISSIONS.CATALOG_VIEW_IMPACT]: { group: ['الكتالوج', 'Catalogue'], label: ['عرض الأثر', 'View impact'], description: ['حساب أثر النشر أو الإيقاف.', 'Calculate the impact of a change.'] },
  [ADMIN_PERMISSIONS.CASES_VIEW_ANY]: { group: ['الحالات', 'Cases'], label: ['عرض الحالات', 'View cases'], description: ['عرض كل الحالات للقراءة فقط.', 'See all cases, read-only.'] },
  [ADMIN_PERMISSIONS.CASES_VIEW]: { group: ['الحالات', 'Cases'], label: ['فتح حالة', 'Open a case'], description: ['تفاصيل حالة وخطها الزمني.', 'Case details and timeline.'] },
  [ADMIN_PERMISSIONS.FINANCE_VIEW]: { group: ['المالية', 'Finance'], label: ['عرض المالية', 'View finance'], description: ['عرض التمويل والدفتر.', 'See fundings and the ledger.'] },
  [ADMIN_PERMISSIONS.FINANCE_RECONCILE]: { group: ['المالية', 'Finance'], label: ['التسوية', 'Reconcile'], description: ['تسوية فروقات التمويل.', 'Reconcile funding differences.'], sensitive: true },
  [ADMIN_PERMISSIONS.REFUNDS_VIEW]: { group: ['المالية', 'Finance'], label: ['عرض الاستردادات', 'View refunds'], description: ['عرض طلبات الاسترداد.', 'See refund requests.'] },
  [ADMIN_PERMISSIONS.REFUNDS_APPROVE]: { group: ['المالية', 'Finance'], label: ['قرار الاسترداد', 'Decide refunds'], description: ['الموافقة أو الرفض وإنشاء استرداد.', 'Approve, reject or create a refund.'], sensitive: true },
  [ADMIN_PERMISSIONS.DISPUTES_VIEW]: { group: ['المالية', 'Finance'], label: ['عرض النزاعات', 'View disputes'], description: ['عرض نزاعات الدفع.', 'See payment disputes.'] },
  [ADMIN_PERMISSIONS.STRIPE_ACCOUNTS_VIEW]: { group: ['المالية', 'Finance'], label: ['حسابات Stripe', 'Stripe accounts'], description: ['عرض حسابات الخبراء على Stripe.', 'See the experts Stripe accounts.'] },
  [ADMIN_PERMISSIONS.REVIEWS_VIEW_ANY]: { group: ['التقييمات', 'Reviews'], label: ['عرض التقييمات', 'View reviews'], description: ['عرض تقييمات الخبراء.', 'See expert reviews.'] },
  [ADMIN_PERMISSIONS.REVIEWS_MODERATE]: { group: ['التقييمات', 'Reviews'], label: ['إدارة المحتوى', 'Moderate reviews'], description: ['نشر أو إخفاء أو رفض تقييم.', 'Publish, hide or reject a review.'], sensitive: true },
  [ADMIN_PERMISSIONS.SUPPORT_VIEW_ANY]: { group: ['الدعم', 'Support'], label: ['عرض قائمة الدعم', 'View support list'], description: ['محجوزة لموديول الدعم.', 'Reserved for the support module.'] },
  [ADMIN_PERMISSIONS.SUPPORT_VIEW]: { group: ['الدعم', 'Support'], label: ['عرض تفاصيل الدعم', 'View support details'], description: ['محجوزة لموديول الدعم.', 'Reserved for the support module.'] },
  [ADMIN_PERMISSIONS.SUPPORT_UPDATE]: { group: ['الدعم', 'Support'], label: ['تحديث الدعم', 'Update support'], description: ['محجوزة لموديول الدعم.', 'Reserved for the support module.'] },
});

export const permissionMetadata = (permission) => ADMIN_PERMISSION_METADATA[permission] || {
  group: ['صلاحيات أخرى', 'Other permissions'],
  label: [permission, permission],
  description: ['صلاحية أعادها الخادم ولا يوجد لها وصف محلي بعد.', 'A permission returned by the server without a local description yet.'],
};

/** Groups permission strings by their (language-independent) group key. */
export function groupPermissionValues(permissionValues = []) {
  return permissionValues.reduce((groups, permission) => {
    const metadata = permissionMetadata(permission);
    const key = metadata.group[1];
    if (!groups[key]) groups[key] = { title: metadata.group, items: [] };
    groups[key].items.push({ id: permission, ...metadata });
    return groups;
  }, {});
}
