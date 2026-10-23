import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { textLinkClasses } from '@/ui';
import { SectionIndex } from './TopSections';

export function FieldSection() {
  const { t } = useTranslation();
  return (
    <section className="landing-wrap landing-section" id="field">
      <div className="landing-field">
        <div>
          <SectionIndex number="07" label={t('landing.field.eyebrow')} />
          <h2>{t('landing.field.title')}</h2>
          <div className="landing-field__points">
            {(['targets', 'outbox', 'languages'] as const).map((key) => (
              <div key={key}>
                <b>{t(`landing.field.points.${key}.label`)}</b>
                <p>{t(`landing.field.points.${key}.body`)}</p>
              </div>
            ))}
          </div>
          <Link to="/field" className={textLinkClasses}>
            {t('landing.field.open')}
          </Link>
        </div>
        <div role="img" aria-label={t('landing.field.phoneDescription')}>
          <div className="landing-phones" aria-hidden="true">
            <Phone language="en" direction="ltr" />
            <Phone language="ar" direction="rtl" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Phone({ language, direction }: { language: 'en' | 'ar'; direction: 'ltr' | 'rtl' }) {
  const arabic = language === 'ar';
  return (
    <div className={`landing-phone landing-phone--${language}`}>
      <div className="landing-phone__screen" lang={language} dir={direction}>
        <div className="landing-phone__top">
          <b>{arabic ? 'ساقي · الحقل' : 'Saqi · Field'}</b>
          <span>EN · ع · ار</span>
        </div>
        <div>
          <strong>{arabic ? 'صباح الخير، رحيم' : 'Good morning, Rahim'}</strong>
          <small>{arabic ? 'الخميس 23 أكتوبر · 5 مهام' : 'Thu 23 Oct · 5 tasks'}</small>
        </div>
        <div className="landing-phone__offline">
          {arabic ? 'غير متصل · تم حفظ تغييرين' : 'Offline · 2 changes saved'}
        </div>
        <small>D-1 · {arabic ? 'نخيل خلاص' : 'Khalas palms'}</small>
        <div className="landing-phone__task">
          <b>{arabic ? 'تنظيف المنقّطات، الصف 4' : 'Clear bubblers, row 4'}</b>
          <span>{arabic ? 'تم الإنجاز' : 'Mark done'}</span>
        </div>
        <small>D-3 · {arabic ? 'نخيل فرض' : 'Fard palms'}</small>
        <div className="landing-phone__task">
          <b>{arabic ? 'فحص حساس 60 سم' : 'Check 60 cm sensor'}</b>
          <small>{arabic ? 'لا بيانات منذ 12:00' : 'No data since 12:00'}</small>
          <span>{arabic ? 'تم الإنجاز' : 'Mark done'}</span>
        </div>
        <div className="landing-phone__done">{arabic ? 'أُنجز اليوم (1)' : 'Done today (1)'}</div>
      </div>
    </div>
  );
}
