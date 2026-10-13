/* Landing page content. Arabic is the source language; English mirrors it. Tuple order is documented per export. */

// [number, title, text, icon]
export const landingSteps = [
  ['01', 'احكِ ما يحدث', 'اكتب أو اشرح الحالة بطريقتك، دون أن تحتاج لمعرفة التخصص مسبقًا.', 'case'],
  ['02', 'نرتّب السياق', 'نحوّل التفاصيل إلى أسئلة وهدف ومعلومات قابلة للمراجعة قبل مشاركتها.', 'spark'],
  ['03', 'نطابق الخبرة', 'نقترح الخبراء الأنسب حسب المجال واللغة والبلد والتوفر، وتختار من تدعوه.', 'search'],
  ['04', 'تبدأ بخطوة واضحة', 'تستلم عرضًا مكتوبًا، ثم جلسة عن بُعد ومخرجًا واضحًا بتوصيات مرتبطة بحالتك.', 'check'],
];
export const landingStepsEn = [
  ['01', 'Tell us what happened', 'Describe your situation in your own words. You do not need to know the specialty first.', 'case'],
  ['02', 'We organize the context', 'We turn the details into questions, goals, and information you can review before sharing.', 'spark'],
  ['03', 'We match expertise', 'Find suitable experts by field, language, country, and availability, then choose whom to invite.', 'search'],
  ['04', 'Move forward clearly', 'Receive a written proposal, then a remote session and a clear outcome tied to your case.', 'check'],
];

// [title, text, icon]
export const contextItems = [
  ['الأسئلة والأهداف', 'ما الذي تريد الوصول إليه؟ وما السؤال الذي يحتاج جوابًا؟', 'spark'],
  ['المستندات', 'نسخ واضحة ومحددة، تختار أنت ما يصل منها للخبير.', 'file'],
  ['الخبراء', 'كل خبير بمهمة وصلاحية ونطاق محدد.', 'user'],
  ['الجلسات', 'مواعيد وملاحظات وخلاصة قابلة للرجوع إليها.', 'clock'],
  ['التوصيات والمهام', 'خطوة تالية مفهومة بدل نصائح متناثرة.', 'check'],
  ['الصلاحيات', 'أنت تحدد ما الذي يراه كل مشارك في الحالة.', 'lock'],
];
export const contextItemsEn = [
  ['Questions and goals', 'What are you trying to achieve, and what needs an answer?', 'spark'],
  ['Documents', 'Clear, relevant versions. You choose what reaches the expert.', 'file'],
  ['Experts', 'A defined task, permission, and scope for every expert.', 'user'],
  ['Sessions', 'Meetings, notes, and summaries you can revisit.', 'clock'],
  ['Recommendations and tasks', 'A useful next step instead of scattered advice.', 'check'],
  ['Permissions', 'You decide what each participant can see.', 'lock'],
];

// { tag, q, experts, out, icon, facts }
export const useCases = [
  { tag: 'عقار', icon: 'layers', q: 'أفكر بشراء عقار… ماذا لو فاتني شيء مهم؟', experts: ['مهندس', 'محامٍ'], out: 'صورة أوضح للعقار والالتزامات قبل القرار.', facts: ['تقرير المعاينة', 'عقد البيع المقترح', 'سؤال: هل توجد التزامات خفية؟'] },
  { tag: 'أعمال', icon: 'nodes', q: 'مشروعي يبيع جيدًا… فلماذا لا يحقق ربحًا؟', experts: ['محاسب', 'مختص تشغيل'], out: 'ربط الأرقام بطريقة التشغيل بدل نصائح منفصلة.', facts: ['تقارير المبيعات والتكاليف', 'خطوات التشغيل الحالية', 'سؤال: أين تتسرب الأرباح؟'] },
  { tag: 'مسار مهني', icon: 'user', q: 'وصلني عرض وظيفي ممتاز… هل هو فعلًا القرار الأفضل؟', experts: ['مستشار مهني', 'محامي عقود'], out: 'فهم الدور والبنود والأسئلة التي تستحق التوضيح.', facts: ['عرض العمل', 'بنود العقد', 'سؤال: ما الذي يجب التفاوض عليه؟'] },
];
export const useCasesEn = [
  { tag: 'Property', icon: 'layers', q: 'I am buying a property. What if I miss something important?', experts: ['Engineer', 'Lawyer'], out: 'A clearer picture of the property and obligations before you decide.', facts: ['Inspection report', 'Proposed sale contract', 'Question: any hidden obligations?'] },
  { tag: 'Business', icon: 'nodes', q: 'Sales are good. Why is my business not profitable?', experts: ['Accountant', 'Operations specialist'], out: 'Connect financial results to how the business actually runs.', facts: ['Sales and cost reports', 'Current operating steps', 'Question: where do profits leak?'] },
  { tag: 'Career', icon: 'user', q: 'I received a great offer. Is it really the right move?', experts: ['Career adviser', 'Contract lawyer'], out: 'Understand the role, terms, and questions worth asking.', facts: ['Job offer', 'Contract terms', 'Question: what should I negotiate?'] },
];

// [initials, role, specialty, languages]
export const experts = [
  ['ق', 'خبير قانوني', 'عقود والتزامات', 'العربية • English'],
  ['ت', 'خبير تقني', 'منتجات وأنظمة', 'العربية • English'],
  ['م', 'خبير مالي', 'تحليل وتخطيط', 'العربية'],
];
export const expertsEn = [
  ['L', 'Legal expert', 'Contracts and obligations', 'Arabic • English'],
  ['T', 'Technology expert', 'Products and systems', 'Arabic • English'],
  ['F', 'Finance expert', 'Analysis and planning', 'Arabic'],
];

// [title, text, icon]
export const engagementSteps = [
  ['تدعو الخبير الذي اخترته', 'تراجع ملخص حالتك وتعتمده، وتختار المستندات التي يراها الخبير فقط.', 'user'],
  ['يرسل الخبير عرضًا بسعر محدد', 'مخرجات واضحة ومدة ومراحل. تقبل العرض أو تطلب تعديلًا أو ترفضه.', 'file'],
  ['تموّل الاتفاق قبل بدء العمل', 'لا يبدأ العمل المدفوع قبل أن يؤكد مزود الدفع التمويل. حجز الموعد وحده لا يعني ذلك.', 'card'],
  ['جلسة عن بُعد', 'مكالمة فيديو أو صوت أو استشارة مكتوبة، وفق ما اتفقتما عليه.', 'video'],
  ['تقيّم تجربتك', 'بعد اكتمال الخدمة تكتب تقييمك ويُراجَع قبل نشره في ملف الخبير.', 'star'],
];
export const engagementStepsEn = [
  ['Invite the expert you chose', 'Review and approve your case brief, and pick the only documents the expert can see.', 'user'],
  ['The expert sends a priced proposal', 'Clear deliverables, timing, and milestones. Accept, ask for changes, or decline.', 'file'],
  ['Fund the agreement before work starts', 'Paid work does not begin until the payment provider confirms funding. Booking a slot alone does not.', 'card'],
  ['A remote session', 'Video call, audio call, or written consultation, as you agreed.', 'video'],
  ['Review your experience', 'After the service is complete, write a review. It is moderated before it appears on the expert profile.', 'star'],
];

// [question, answer]
export const faqItems = [
  ['هل الخدمات حضورية أم عن بُعد؟', 'كل الخدمات على SolveIt تُقدَّم عن بُعد. تختار طريقة التقديم التي تناسبك: مكالمة فيديو، مكالمة صوتية، أو استشارة مكتوبة.'],
  ['من يحدد سعر الخدمة؟', 'الخبير يحدد السعر في عرض مكتوب يتضمن المخرجات والمدة والمراحل. لك أن تقبل العرض أو تطلب تعديله أو ترفضه.'],
  ['متى يبدأ العمل؟', 'بعد قبول العرض وتأكيد التمويل من مزود الدفع. العودة من صفحة الدفع أو حجز موعد لا يكفيان وحدهما لبدء العمل.'],
  ['ماذا يرى الخبير من معلوماتي؟', 'يرى فقط ملخص الحالة الذي راجعته واعتمدته، والمستندات التي اخترتها بنفسك. بياناتك الشخصية (الاسم والبريد والجوال) لا تظهر له قبل موافقتك.'],
  ['هل يقرر الذكاء الاصطناعي حالتي أو يختار الخبير؟', 'لا. إن فعّلته فهو مساعد صياغة اختياري يقترح أسئلة توضيحية، ولا يؤثر على أهلية حالتك ولا على نتائج المطابقة.'],
  ['كيف أنضم كخبير؟', 'أنشئ حساب خبير ثم أكمل التحقق المهني. لا يُنشر ملفك ولا تُعتمد خدماتك قبل اكتمال التحقق.'],
];
export const faqItemsEn = [
  ['Are services in person or remote?', 'Every service on SolveIt is delivered remotely. Choose the format that suits you: a video call, an audio call, or a written consultation.'],
  ['Who sets the price?', 'The expert sets the price in a written proposal with deliverables, timing, and milestones. You can accept it, ask for changes, or decline.'],
  ['When does the work start?', 'After you accept the proposal and the payment provider confirms funding. Returning from the payment page or booking a slot is not enough on its own.'],
  ['What does the expert see of my information?', 'Only the case brief you reviewed and approved, and the documents you picked yourself. Your personal details (name, email, phone) stay hidden until you agree to share them.'],
  ['Does AI decide my case or pick the expert?', 'No. If you turn it on, it is an optional drafting helper that suggests clarifying questions. It never affects your case eligibility or the matching results.'],
  ['How do I join as an expert?', 'Create an expert account and complete professional verification. Your profile is not published and your services are not approved until verification is complete.'],
];
