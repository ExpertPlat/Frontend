import { PATHS } from '../../../../routes/paths';

/**
 * Brand-panel copy for every auth screen.
 * Each entry: [arabic, english]. `points` are three short reassurance lines.
 */
const pair = (ar, en) => ({ ar, en });

const USER_POINTS = [
  pair('كل الخدمات عن بُعد — بدون تنقّل', 'Every service is remote — no travel'),
  pair('الخبير يحدد السعر وأنت توافق قبل البدء', 'Experts set the price and you approve before work starts'),
  pair('بياناتك لا تُشارك إلا بإذنك', 'Your data is shared only with your consent'),
];
const EXPERT_POINTS = [
  pair('ملف مهني يُنشر بعد التحقق فقط', 'A professional profile published only after verification'),
  pair('طلبات مناسبة لتخصصك وعروض تحدد سعرها بنفسك', 'Requests matched to your field, proposals priced by you'),
  pair('جلسات عن بُعد ودفعات محمية بالتمويل المسبق', 'Remote sessions with funded, protected payments'),
];
const ADMIN_POINTS = [
  pair('الصلاحيات تُطبّق من الخادم وليس من الواجهة', 'Permissions are enforced by the server, not the UI'),
  pair('كل إجراء إداري يُسجَّل في سجل التدقيق', 'Every admin action is written to the audit log'),
  pair('جلسة منفصلة عن حسابات المستخدمين والخبراء', 'A session separate from user and expert accounts'),
];

const account = (points, modes) => ({ points, modes });

export const AUTH_COPY = {
  user: account(USER_POINTS, {
    login: { eyebrow: pair('مساحتك في SolveIt', 'Your SolveIt space'), title: pair('أكمل من حيث توقفت.', 'Pick up where you left off.'), text: pair('تابع حالاتك واستشاراتك وعروض الخبراء من مكان واحد.', 'Follow your cases, consultations and expert proposals in one place.'), cta: pair('ليس لديك حساب؟ أنشئ حسابًا', 'New here? Create an account'), to: PATHS.REGISTER },
    register: { eyebrow: pair('ابدأ مجانًا', 'Get started free'), title: pair('اشرح مشكلتك، ونحن نوصلك بالخبير المناسب.', 'Describe your problem — we match you with the right expert.'), text: pair('أنشئ حسابك خلال دقيقة وابدأ بتجهيز حالتك.', 'Create your account in a minute and start preparing your case.'), cta: pair('لديك حساب؟ سجّل الدخول', 'Already have an account? Sign in'), to: PATHS.LOGIN },
    forgot: { eyebrow: pair('استعادة الوصول', 'Account recovery'), title: pair('نعيد لك الوصول بخطوات بسيطة.', 'We will get you back in, step by step.'), text: pair('سنرسل رابط استعادة محدود الصلاحية دون كشف أي معلومات عن الحساب.', 'We send a time-limited recovery link without revealing any account details.'), cta: pair('العودة لتسجيل الدخول', 'Back to sign in'), to: PATHS.LOGIN },
    reset: { eyebrow: pair('حسابك في أمان', 'Your account is protected'), title: pair('كلمة مرور جديدة، وبداية جديدة.', 'A new password, a fresh start.'), text: pair('اختر كلمة مرور قوية ثم عد لمتابعة حالاتك.', 'Choose a strong password, then return to your cases.'), cta: pair('العودة لتسجيل الدخول', 'Back to sign in'), to: PATHS.LOGIN },
    verify: { eyebrow: pair('خطوة أخيرة', 'One last step'), title: pair('أكّد بريدك وابدأ بثقة.', 'Verify your email and begin.'), text: pair('افتح رسالة التحقق التي أرسلناها لتفعيل حسابك.', 'Open the message we sent to activate your account.'), cta: pair('كتبت البريد بشكل خاطئ؟ العودة للتسجيل', 'Wrong email? Back to sign up'), to: PATHS.REGISTER },
    verified: { eyebrow: pair('تم التأكيد', 'Email confirmed'), title: pair('حسابك جاهز للانطلاق.', 'Your account is ready.'), text: pair('سجّل دخولك وابدأ باستخدام مساحتك في SolveIt.', 'Sign in and start using your SolveIt space.'), cta: pair('تسجيل الدخول', 'Sign in'), to: PATHS.LOGIN },
  }),
  expert: account(EXPERT_POINTS, {
    login: { eyebrow: pair('مساحة الخبراء', 'Expert space'), title: pair('خبرتك تصنع فرقًا.', 'Your expertise makes a difference.'), text: pair('تابع ملفك وطلباتك وعروضك وجلساتك داخل المنصة.', 'Follow your profile, requests, proposals and sessions in the platform.'), cta: pair('انضم كخبير', 'Join as an expert'), to: PATHS.EXPERT_REGISTER },
    register: { eyebrow: pair('انضم إلى الخبراء', 'Join our experts'), title: pair('ابنِ حضورًا مهنيًا موثوقًا.', 'Build a trusted professional presence.'), text: pair('أنشئ حسابك ثم أكمل ملفك ومسار التحقق المهني.', 'Create your account, then complete your profile and verification.'), cta: pair('لديك حساب؟ سجّل دخول الخبير', 'Have an account? Expert sign in'), to: PATHS.EXPERT_LOGIN },
    forgot: { eyebrow: pair('استعادة الوصول', 'Account recovery'), title: pair('استعد وصولك بأمان.', 'Recover your access securely.'), text: pair('نستخدم استجابة محايدة ورابطًا محدود الصلاحية لحماية حساب الخبير.', 'A neutral response and a time-limited link protect your expert account.'), cta: pair('العودة لتسجيل الدخول', 'Back to sign in'), to: PATHS.EXPERT_LOGIN },
    reset: { eyebrow: pair('تأمين الحساب', 'Securing your account'), title: pair('كلمة مرور جديدة ومسار عودة آمن.', 'A new password and a safe way back.'), text: pair('حدّث كلمة المرور ثم عد إلى مساحة عملك.', 'Update your password and return to your workspace.'), cta: pair('العودة لتسجيل الدخول', 'Back to sign in'), to: PATHS.EXPERT_LOGIN },
    verify: { eyebrow: pair('خطوة التفعيل', 'Activation step'), title: pair('أكّد بريدك المهني.', 'Verify your professional email.'), text: pair('بعد التأكيد تنتقل إلى إعداد ملف الخبير.', 'After confirming, you continue to set up your expert profile.'), cta: pair('العودة للتسجيل', 'Back to sign up'), to: PATHS.EXPERT_REGISTER },
    verified: { eyebrow: pair('تم التأكيد', 'Email confirmed'), title: pair('مساحتك المهنية جاهزة.', 'Your expert space is ready.'), text: pair('سجّل دخولك لاستكمال ملفك ومسار التحقق المهني.', 'Sign in to continue your profile and verification path.'), cta: pair('تسجيل دخول الخبير', 'Expert sign in'), to: PATHS.EXPERT_LOGIN },
  }),
  admin: account(ADMIN_POINTS, {
    login: { eyebrow: pair('بوابة الإدارة', 'Admin portal'), title: pair('إدارة واضحة، ووصول آمن.', 'Clear oversight, secure access.'), text: pair('سجّل دخولك لمتابعة شؤون المنصة ضمن صلاحياتك.', 'Sign in to manage the platform within your permissions.') },
    invite: { eyebrow: pair('دعوة إدارية', 'Admin invitation'), title: pair('فعّل حسابك الإداري.', 'Activate your admin account.'), text: pair('عيّن كلمة مرور قوية لإتمام قبول الدعوة.', 'Set a strong password to accept the invitation.'), cta: pair('لديك حساب؟ سجّل الدخول', 'Have an account? Sign in'), to: PATHS.ADMIN_LOGIN },
  }),
};

export const FOOTER_NOTE = {
  user: pair('اتصال آمن • بياناتك لا تُشارك إلا بإذنك', 'Secure connection • Your data stays under your control'),
  expert: pair('مساحة مهنية آمنة • النشر بعد التحقق فقط', 'Secure expert space • Publication follows verification'),
  admin: pair('دخول إداري محمي • الصلاحيات تُطبق من الخادم', 'Protected admin access • Permissions are enforced by the server'),
};

export const MODE_BY_PATH = {
  user: {
    [PATHS.LOGIN]: 'login', [PATHS.REGISTER]: 'register', [PATHS.FORGOT_PASSWORD]: 'forgot',
    [PATHS.RESET_PASSWORD]: 'reset', [PATHS.VERIFY_EMAIL]: 'verify', [PATHS.EMAIL_VERIFIED]: 'verified',
  },
  expert: {
    [PATHS.EXPERT_LOGIN]: 'login', [PATHS.EXPERT_REGISTER]: 'register', [PATHS.EXPERT_FORGOT_PASSWORD]: 'forgot',
    [PATHS.EXPERT_RESET_PASSWORD]: 'reset', [PATHS.EXPERT_VERIFY_EMAIL]: 'verify', [PATHS.EXPERT_EMAIL_VERIFIED]: 'verified',
  },
  admin: { [PATHS.ADMIN_LOGIN]: 'login', [PATHS.ADMIN_ACCEPT_INVITATION]: 'invite' },
};

export const VERIFY_PREFIX = { user: PATHS.VERIFY_EMAIL, expert: PATHS.EXPERT_VERIFY_EMAIL };
