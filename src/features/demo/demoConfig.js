/**
 * Trial-phase helpers. Everything under features/demo renders ONLY when VITE_DEMO_MODE=true, so a production build
 * (VITE_DEMO_MODE unset/false) ships without the demo login shortcuts, the walkthrough cards and the "Trial" badges.
 */
export const DEMO_MODE = String(import.meta.env?.VITE_DEMO_MODE ?? '').toLowerCase() === 'true';
export const DEMO_PASSWORD = 'Password123!';

const acc = (email, ar, en, roleAr, roleEn) => ({ email, name: { ar, en }, role: { ar: roleAr, en: roleEn } });

export const DEMO_ACCOUNTS = Object.freeze({
  user: [
    acc('investor@example.com', 'مستثمر تجريبي', 'Demo investor', 'مستخدم · الإمارات', 'User · UAE'),
    acc('ahmed@example.com', 'أحمد سمير', 'Ahmed Samir', 'مستخدم · مصر', 'User · Egypt'),
  ],
  expert: [
    acc('sara@example.com', 'سارة المنصوري', 'Sara Al Mansoori', 'محامية شركات · الإمارات', 'Corporate lawyer · UAE'),
    acc('karim@example.com', 'كريم فؤاد', 'Karim Fouad', 'ضرائب ومحاسبة', 'Tax & accounting'),
    acc('tarek@example.com', 'طارق السعدي', 'Tarek Al Saadi', 'ملكية فكرية', 'Intellectual property'),
    acc('abdullah@example.com', 'عبدالله النعيمي', 'Abdullah Al Nuaimi', 'استشارات أعمال', 'Business advisory'),
    acc('mona@example.com', 'منى حسن', 'Mona Hassan', 'محامية · مصر والأردن', 'Lawyer · Egypt & Jordan'),
    acc('faisal@example.com', 'فيصل الحربي', 'Faisal Al Harbi', 'محامٍ · السعودية والكويت', 'Lawyer · KSA & Kuwait'),
    acc('rania@example.com', 'رانيا الخوري', 'Rania Al Khoury', 'أسرة وهجرة وعمل', 'Family, immigration & labour'),
    acc('khaled@example.com', 'خالد الصباح', 'Khaled Al Sabah', 'عقارات وإقامة · الكويت', 'Real estate & residency · Kuwait'),
    acc('hind@example.com', 'هند القاسمي', 'Hind Al Qasimi', 'عقارات وأسرة · الإمارات', 'Real estate & family · UAE'),
    acc('nour@example.com', 'نور عبدالرحمن', 'Nour Abdelrahman', 'ضرائب · مصر والأردن', 'Tax · Egypt & Jordan'),
    acc('layan@example.com', 'ليان البدر', 'Layan Al Badr', 'تسويق ونمو', 'Marketing & growth'),
    acc('dalia@example.com', 'داليا النجار', 'Dalia Al Najjar', 'مستشارة عامة', 'General advisor'),
    acc('basel@example.com', 'باسل الشريف', 'Basel Al Sharif', 'مستشار عام', 'General advisor'),
  ],
  admin: [
    acc('admin@solveit.test', 'مدير المنصة', 'Platform admin', 'مدير عام (كل الصلاحيات)', 'Super admin (all access)'),
    acc('omar@solveit.test', 'عمر الخطيب', 'Omar Al Khatib', 'مراجع التحقق (KYC)', 'KYC reviewer'),
    acc('rana@solveit.test', 'رنا سليم', 'Rana Salim', 'مدير الكتالوج', 'Catalog manager'),
    acc('yousef@solveit.test', 'يوسف عبيدات', 'Yousef Obeidat', 'المالية', 'Finance'),
    acc('hana@solveit.test', 'هناء يوسف', 'Hana Yousef', 'الدعم', 'Support'),
    acc('layla@solveit.test', 'ليلى حداد', 'Layla Haddad', 'إدارة المستخدمين', 'User manager'),
  ],
});

export const ROLE_LOGIN_PATH = Object.freeze({ user: '/login', expert: '/expert/login', admin: '/admin/login' });

/** Login URL for a role with a demo account pre-selected (the login pages read ?demo=<email>). */
export function demoLoginPath(role, email) {
  const base = ROLE_LOGIN_PATH[role] || ROLE_LOGIN_PATH.user;
  return email ? `${base}?demo=${encodeURIComponent(email)}` : base;
}

export function findDemoAccount(role, email) {
  return (DEMO_ACCOUNTS[role] || []).find((a) => a.email === String(email || '').toLowerCase()) || null;
}

/** Matches a (translated) expert name from an API payload to a demo account, so hand-off buttons can pre-fill it. */
export function findDemoAccountByName(role, name) {
  const n = String(name || '').trim();
  return (DEMO_ACCOUNTS[role] || []).find((a) => a.name.ar === n || a.name.en === n) || null;
}

/** Hand-off actions toward the experts behind some invitations (demo accounts only; generic login otherwise). */
export function expertHandoffActions(experts) {
  const seen = new Set();
  const out = [];
  for (const e of experts) {
    const acc = findDemoAccountByName('expert', e?.name);
    if (acc && !seen.has(acc.email)) {
      seen.add(acc.email);
      out.push({ role: 'expert', email: acc.email, label: { ar: `دخول كـ ${acc.name.ar}`, en: `Sign in as ${acc.name.en}` } });
    }
  }
  return out.length ? out : [{ role: 'expert', label: { ar: 'دخول مساحة الخبير', en: 'Open the expert sign-in' } }];
}

export const USER_HANDOFF = [
  { role: 'user', email: 'investor@example.com', label: { ar: 'دخول كمستخدم (المستثمر)', en: 'Sign in as the user (investor)' } },
  { role: 'user', email: 'ahmed@example.com', label: { ar: 'دخول كأحمد سمير', en: 'Sign in as Ahmed Samir' } },
];
export const ADMIN_HANDOFF = [{ role: 'admin', email: 'admin@solveit.test', label: { ar: 'دخول كمدير المنصة', en: 'Sign in as platform admin' } }];
