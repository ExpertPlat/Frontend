import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from '../../../components/Footer/Footer';
import Logo from '../../../components/Logo/Logo';
import { PATHS } from '../../../routes/paths';
import './LegalPage.css';

const CONTENT = {
  [PATHS.PRIVACY]: {
    eyebrow: 'الخصوصية وحماية البيانات',
    title: 'خصوصيتك جزء من تصميم SolveIt',
    intro: 'نوضح هنا المبادئ التي تحكم جمع بياناتك واستخدامها ومشاركتها داخل الحالات والاستشارات.',
    sections: [
      ['البيانات التي نستخدمها', 'بيانات الحساب والمعلومات التي تضيفها إلى الحالات والمستندات التي تختار رفعها وسجل الإجراءات الضروري لتشغيل الخدمة بأمان.'],
      ['مشاركة السياق', 'لا يحصل الخبير على وصول عام إلى حسابك. تُشارك المعلومات داخل الحالة ووفق الصلاحيات التي تمنحها لكل مشارك.'],
      ['حماية المستندات', 'تُعامل مستندات الحالات والتحقق بوصفها بيانات حساسة، ويُقيد الوصول إليها حسب نوع الحساب والصلاحية.'],
      ['حقوقك', 'يمكنك مراجعة بيانات حسابك وتصحيحها وإدارة الموافقات وطلب نسخة من بياناتك وفق المتطلبات القانونية والتشغيلية.'],
    ],
  },
  [PATHS.TERMS]: {
    eyebrow: 'شروط الاستخدام',
    title: 'قواعد واضحة لتجربة مهنية وآمنة',
    intro: 'تحدد هذه المبادئ العلاقة بين المستخدم والخبراء والمنصة، وتوضح مسؤولية كل طرف أثناء استخدام SolveIt.',
    sections: [
      ['طبيعة الخدمة', 'تساعد SolveIt على تنظيم الحالة والوصول إلى خبرة مناسبة. لا تستبدل المنصة خدمات الطوارئ أو الإجراءات التي تتطلب حضورًا ميدانيًا.'],
      ['دقة المعلومات', 'يتحمل صاحب الحساب مسؤولية تقديم معلومات صحيحة ومحدثة، بينما يلتزم الخبير بالعمل ضمن نطاق خبرته واعتماده.'],
      ['حدود الصلاحيات', 'لا يجوز مشاركة حساب أو مستند أو بيانات تخص طرفًا آخر دون تفويض مناسب، وتطبق صلاحيات الوصول داخل كل حالة.'],
      ['الاستخدام المقبول', 'يُمنع إساءة استخدام المنصة أو محاولة الوصول غير المصرح به أو رفع محتوى ضار أو مضلل.'],
    ],
  },
};

export default function LegalPage() {
  const { pathname } = useLocation();
  const page = CONTENT[pathname] || CONTENT[PATHS.PRIVACY];

  return (
    <div className="legal-page" dir="rtl">
      <header className="legal-page__nav"><Logo /><Link to={PATHS.HOME}>العودة إلى الرئيسية</Link></header>
      <main>
        <section className="legal-page__hero"><span>{page.eyebrow}</span><h1>{page.title}</h1><p>{page.intro}</p></section>
        <section className="legal-page__content">
          {page.sections.map(([title, body], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}
          <aside><b>ملاحظة مهمة</b><p>هذه نسخة واجهة أولية ويجب اعتماد النص القانوني النهائي من مستشار مختص قبل الإطلاق التجاري.</p></aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}
