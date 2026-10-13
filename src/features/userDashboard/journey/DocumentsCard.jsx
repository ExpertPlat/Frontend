import React, { useRef, useState } from 'react';
import { useBrandFeedback } from '../../../components/BrandFeedback/BrandFeedback';
import { useResource } from '../../../services/hooks';
import { casesService } from '../../../services/user/casesService';
import { getErrorMessage } from '../../../api/errorHandler';
import { useUserI18n } from '../i18n/UserI18nContext';
import UdIcon from '../components/UdIcon';
import { Button, Card, CardHeader, StatusPill } from '../components/ui';
import { SCAN_STATUS, pick } from '../utils/statuses';

const MAX_MB = 10;
const ALLOWED = ['pdf', 'jpg', 'jpeg', 'png'];

/** Optional supporting documents. Only documents the backend reports as `clean` can be shared with an expert. */
export default function DocumentsCard({ caseId, caseData, locked = false }) {
  const { tr, tx, fmtNumber } = useUserI18n();
  const { notify } = useBrandFeedback();
  const input = useRef(null);
  const [uploading, setUploading] = useState(false);
  const docs = useResource(() => casesService.documents.list(caseId), [caseId]);

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED.includes(ext)) { notify({ message: tr('نوع الملف غير مدعوم. المسموح: PDF أو صورة.', 'Unsupported file type. Use a PDF or an image.'), tone: 'error' }); return; }
    if (file.size > MAX_MB * 1024 * 1024) { notify({ message: tr(`الحد الأقصى ${fmtNumber(MAX_MB)} ميغابايت.`, `The limit is ${fmtNumber(MAX_MB)} MB.`), tone: 'error' }); return; }
    setUploading(true);
    try { await casesService.documents.upload(caseData, file); await docs.reload({ silent: true }); notify({ message: tr('رُفع المستند وهو قيد الفحص.', 'Uploaded. It is being scanned.'), tone: 'success' }); } catch (error) { notify({ message: getErrorMessage(error), tone: 'error' }); } finally { setUploading(false); }
  };
  const remove = async (id) => {
    try { await casesService.documents.remove(caseId, id); await docs.reload({ silent: true }); } catch (error) { notify({ message: getErrorMessage(error), tone: 'error' }); }
  };
  const list = docs.data || [];

  return (
    <Card className="jr-card jr-block">
      <CardHeader icon="paperclip" title={tr('مستندات داعمة (اختياري)', 'Supporting documents (optional)')} aside={!locked && <><input ref={input} type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={onFile} /><Button size="sm" variant="secondary" icon="upload" loading={uploading} onClick={() => input.current?.click()}>{tr('إرفاق ملف', 'Attach a file')}</Button></>} />
      {list.length === 0
        ? <p className="jr-lead">{tr('يمكنك إرفاق عقد أو سجل تجاري ليطّلع عليه الخبير بعد موافقتك فقط.', 'Attach a contract or a registration the expert can read, only once you allow it.')}</p>
        : (
          <ul className="jr-files">
            {list.map((doc) => {
              const version = doc.currentVersion;
              const status = pick(SCAN_STATUS, version.scanStatus);
              return (
                <li key={doc.id}>
                  <UdIcon name="file" size={18} /><span><b>{version.title}</b><small>{fmtNumber(Math.max(1, Math.round(version.size / 1024)))} KB</small></span>
                  <StatusPill tone={status.tone}>{tx(status.label)}</StatusPill>
                  {!locked && <button type="button" className="ud-linkbtn" onClick={() => remove(doc.id)} aria-label={tr('حذف', 'Delete')}>{tr('حذف', 'Delete')}</button>}
                </li>
              );
            })}
          </ul>
        )}
    </Card>
  );
}
