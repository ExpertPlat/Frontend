import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrandFeedback } from '../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage } from '../../../api/errorHandler';
import { casesService } from '../../../services/user/casesService';
import { useUserI18n } from '../i18n/UserI18nContext';
import UdIcon from '../components/UdIcon';
import { Button, Card, CardHeader, Checkbox, Chip, IconTile, PageHeader, StatusPill } from '../components/ui';
import { stagePath } from './journeyData';
import { useJourney } from './JourneyContext';
import DocumentsCard from './DocumentsCard';
import { LoadError } from './parts';
import '../../demo/demo.css';

const STEPS = [
  ['قراءة حالتك وفهم لغتك', 'Reading your case and language'],
  ['استخراج المعلومات الأساسية', 'Extracting the key facts'],
  ['تحديد التخصصات المطلوبة وترتيبها', 'Finding and ranking the specialties you need'],
  ['تجهيز الأسئلة التي يحتاجها الخبراء', 'Preparing the questions experts need'],
];
const PRIORITY = {
  high: { tone: 'warning', label: ['أولوية عالية', 'High priority'] },
  medium: { tone: 'amber', label: ['أولوية متوسطة', 'Medium priority'] },
  low: { tone: 'neutral', label: ['أولوية منخفضة', 'Lower priority'] },
};

/** "AI is thinking": four lines tick off while the real assessment call runs. */
function Thinking({ done }) {
  const { tr } = useUserI18n();
  return (
    <Card className="jr-card jr-thinking" aria-live="polite">
      <span className="jr-thinking__orb"><UdIcon name="sparkle" size={30} /></span>
      <h2>{tr('نحلّل حالتك الآن…', 'Analysing your case…')}</h2>
      <ul>
        {STEPS.map((step, index) => (
          <li key={index} className={index < done ? 'is-done' : index === done ? 'is-active' : ''}>
            <span>{index < done ? <UdIcon name="check" size={14} stroke={3} /> : null}</span>{tr(...step)}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * Stage 2: AI summary, ranked specialties and the questions experts need.
 * POST /assessment -> PUT /scopes -> POST+PUT /ai-questions -> POST /confirm -> POST /submit
 */
export default function AnalysisStep() {
  const { tr, tx, fmtNumber } = useUserI18n();
  const navigate = useNavigate();
  const { notify } = useBrandFeedback();
  const journey = useJourney();
  const { caseData, caseId } = journey;
  const [phase, setPhase] = useState('loading'); // loading | thinking | ready | error
  const [tick, setTick] = useState(0);
  const [scopes, setScopes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [setId, setSetId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [summary, setSummary] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [setVersion, setSetVersion] = useState(1);
  const started = useRef(false);
  const locked = !!caseData && !['draft', 'intake_in_progress', 'needs_clarification'].includes(caseData.status);

  const hydrate = (data, set) => {
    setScopes(data.scopes || []); setSummary(data.summary || ''); setAnswers(set?.answers || data.answers || {});
    setQuestions(set?.questions || []); setSetId(set?.id ?? data.aiQuestionSetId ?? null); setSetVersion(set?.version ?? 1);
  };

  useEffect(() => {
    if (!caseData || started.current) return undefined;
    started.current = true;
    let timer;
    const load = async () => {
      try {
        if (caseData.scopes?.length) {
          const set = caseData.aiQuestionSetId ? await casesService.questionSet(caseId) : await casesService.createQuestionSet(caseData);
          hydrate(caseData, set); setPhase('ready'); return;
        }
        setPhase('thinking');
        timer = window.setInterval(() => setTick((value) => value + 1), 650);
        const [assessment] = await Promise.all([casesService.assess(caseData), new Promise((resolve) => window.setTimeout(resolve, 650 * (STEPS.length + 1)))]);
        const set = await casesService.createQuestionSet(assessment.case);
        hydrate(assessment.case, set); setPhase('ready'); journey.refresh();
      } catch (e) { setError(getErrorMessage(e)); setPhase('error'); } finally { window.clearInterval(timer); }
    };
    load();
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData]);

  const included = scopes.filter((item) => item.included);
  const answered = questions.filter((item) => answers[item.id] != null).length;
  const complete = included.length > 0 && questions.length > 0 && answered === questions.length;

  const confirm = async () => {
    if (locked) { navigate(stagePath(caseId, 'experts')); return; }
    if (!complete || saving) return;
    setSaving(true);
    try {
      // Each call returns the updated case; the next one sends its version as `expectedVersion`.
      let current = caseData;
      if (summary !== caseData.summary) current = await casesService.update(current, { summary });
      current = await casesService.setScopes(current, scopes);
      await casesService.saveAnswers(caseId, { id: setId, version: setVersion }, answers);
      current = await casesService.confirm(current);
      await casesService.submit(current, { selectedScopeIds: included.map((item) => item.id) });
      await journey.refresh();
      navigate(stagePath(caseId, 'experts'));
    } catch (e) { notify({ message: getErrorMessage(e), tone: 'error' }); } finally { setSaving(false); }
  };

  return (
    <div className="jr-page">
      <PageHeader icon="sparkle" title={tr('هذا ما فهمناه من حالتك', 'This is what we understood')} subtitle={tr('راجع الملخص والتخصصات والأسئلة، ثم أكّد لنعرض لك الخبراء المناسبين.', 'Review the summary, specialties and questions, then confirm to see the right experts.')} />
      {phase === 'error' && <LoadError message={error} onRetry={() => { started.current = false; setPhase('loading'); journey.reload(); }} />}
      {(phase === 'loading' || phase === 'thinking') && <Thinking done={phase === 'loading' ? 0 : tick} />}
      {phase === 'ready' && (
        <>
          {locked && <div className="jr-banner is-success"><UdIcon name="checkCircle" size={20} /><span>{tr('اعتمدت هذا التحليل وأُرسلت حالتك للمطابقة.', 'You confirmed this analysis and your case went to matching.')}</span></div>}
          <div className="jr-grid">
            <Card className="jr-card jr-block">
              <CardHeader icon="file" title={tr('1. ملخص حالتك', '1. Your case summary')} aside={!locked && <button type="button" className="ud-linkbtn" onClick={() => setEditing((v) => !v)}>{editing ? tr('تم', 'Done') : tr('تعديل', 'Edit')}</button>} />
              {editing
                ? <div className="ud-input ud-input--area"><textarea rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} aria-label={tr('ملخص الحالة', 'Case summary')} /></div>
                : <p className="jr-summary">{summary}</p>}
              <ul className="jr-facts">
                {(caseData.facts || []).map((fact) => (
                  <li key={fact.icon}><IconTile icon={fact.icon} tone="olive" size={36} iconSize={17} /><span><small>{tx(fact.label)}</small><b>{tx(fact.value)}</b></span></li>
                ))}
              </ul>
            </Card>

            <Card className="jr-card jr-block">
              <CardHeader icon="target" title={tr('2. التخصصات التي تحتاجها بالترتيب', '2. Specialties you need, in order')} />
              <p className="jr-lead">{tr('لا تحتاج كل التخصصات دفعة واحدة. ابدأ بالأعلى أولوية، وألغِ ما لا تريده.', 'You do not need everything at once. Start with the top priority and untick what you do not want.')}</p>
              <ol className="jr-specs">
                {scopes.map((item, index) => {
                  const priority = PRIORITY[item.priority] || PRIORITY.medium;
                  return (
                    <li key={item.id} className={item.included ? '' : 'is-off'}>
                      <span className="jr-specs__rank">{fmtNumber(index + 1)}</span>
                      <IconTile icon={item.icon} tone={item.priority === 'high' ? 'peach' : 'earth'} size={42} iconSize={20} />
                      <span className="jr-specs__copy">
                        <b>{item.label}{item.isGeneral && <StatusPill tone="earth" dot={false}>{tr('مسار عام', 'General track')}</StatusPill>}</b>
                        {item.isGeneral
                          ? <small>{item.included ? tr('مسار يضمن وصول حالتك إلى خبير حتى لو لم نجد تخصصًا مطابقًا.', 'A track that makes sure your case reaches an expert even when no specialty matches.') : item.why}</small>
                          : <small>{item.why}</small>}
                        {item.isGeneral && item.included && <span className="demo-general"><b>{tr('لماذا ظهر لك؟', 'Why you see this')}</b><span>{item.why}</span></span>}
                        <span className="jr-bar" aria-hidden="true"><i style={{ inlineSize: `${item.score}%` }} /></span>
                      </span>
                      <span className="jr-specs__side">
                        <StatusPill tone={priority.tone}>{tx(priority.label)}</StatusPill>
                        <Checkbox checked={!!item.included} disabled={locked} onChange={(value) => setScopes((list) => list.map((s) => (s.id === item.id ? { ...s, included: value } : s)))} label={tr('ضمّنه', 'Include')} />
                      </span>
                    </li>
                  );
                })}
              </ol>
            </Card>
          </div>

          <Card className="jr-card jr-block">
            <CardHeader icon="help" title={tr('3. أسئلة يحتاجها الخبراء', '3. Questions the experts need')} />
            <ol className="jr-questions">
              {questions.map((question, number) => (
                <li key={question.id}>
                  <p><em>{fmtNumber(number + 1)}</em>{question.label}</p>
                  <div className="jr-options" role="radiogroup" aria-label={question.label}>
                    {question.options.map((option, index) => (
                      <button key={index} type="button" role="radio" aria-checked={answers[question.id] === index} disabled={locked} className={answers[question.id] === index ? 'is-on' : ''} onClick={() => setAnswers((current) => ({ ...current, [question.id]: index }))}>
                        {answers[question.id] === index && <UdIcon name="check" size={15} stroke={2.6} />}{option}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <DocumentsCard caseId={caseId} caseData={caseData} locked={locked} />

          <div className="jr-confirmbar">
            <p><Chip icon={complete || locked ? 'checkCircle' : 'info'} tone={complete || locked ? 'success' : 'neutral'}>{complete || locked ? tr('كل شيء جاهز', 'All set') : tr(`أجبت عن ${fmtNumber(answered)} من ${fmtNumber(questions.length)} أسئلة`, `${fmtNumber(answered)} of ${fmtNumber(questions.length)} questions answered`)}</Chip></p>
            <Button size="lg" icon="check" loading={saving} disabled={!locked && !complete} onClick={confirm}>{locked ? tr('متابعة إلى الخبراء', 'Continue to experts') : tr('أؤكد، أرني الخبراء', 'Confirm and show experts')}</Button>
          </div>
        </>
      )}
    </div>
  );
}
