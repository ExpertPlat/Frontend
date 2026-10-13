import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../../routes/paths';
import './NotFound.css';

export default function NotFound() {
  return (
    <main className="not-found-page" dir="rtl">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <span className="not-found-code">404</span>
        <h1 id="not-found-title">الصفحة غير موجودة</h1>
        <p>الرابط الذي فتحته غير متاح أو تم نقله. يمكنك العودة إلى الصفحة الرئيسية ومتابعة التصفح.</p>
        <Link className="not-found-action" to={PATHS.HOME}>العودة إلى الرئيسية</Link>
      </section>
    </main>
  );
}
