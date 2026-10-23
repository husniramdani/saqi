import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { SectionIndex } from './LandingIcons';

const POINTS = ['targets', 'outbox', 'languages'] as const;

/**
 * What each phone shows. The phones are pictures of the Field screen in English and in Arabic,
 * so their text is fixed per phone rather than following the page language.
 */
const PHONES = [
  {
    dir: 'ltr',
    lang: 'en',
    className: 'phone phone-a',
    brand: 'Saqi · Field',
    on: 0,
    hello: 'Good morning, Rahim',
    date: 'Thu 23 Oct · 5 tasks',
    offline: 'Offline · 2 changes saved',
    tasks: [
      { group: 'D-1 · Khalas palms', title: 'Clear bubblers, row 4' },
      { group: 'D-3 · Fard palms', title: 'Check 60 cm sensor', note: 'No data since 12:00' },
    ],
    done: 'Mark done',
    doneToday: 'Done today (1)',
  },
  {
    dir: 'rtl',
    lang: 'ar',
    className: 'phone phone-b',
    brand: 'ساقي · الحقل',
    on: 1,
    hello: 'صباح الخير، رحيم',
    date: 'الخميس 23 أكتوبر · 5 مهام',
    offline: 'غير متصل · تم حفظ تغييرين',
    tasks: [
      { group: 'D-1 · نخيل خلاص', title: 'تنظيف المنقّطات، الصف 4' },
      { group: 'D-3 · نخيل فرض', title: 'فحص حساس 60 سم', note: 'لا بيانات منذ 12:00' },
    ],
    done: 'تم الإنجاز',
    doneToday: 'أُنجز اليوم (1)',
  },
] as const;

export function FieldSection() {
  const { t } = useTranslation();
  return (
    <section className="wrap" id="field" style={{ paddingBottom: 'clamp(72px, 9vw, 128px)' }}>
      <div className="field">
        <div>
          <SectionIndex number="07" label={t('landing.field.eyebrow')} />
          <h2 className="h2" style={{ marginTop: 18 }}>
            {t('landing.field.title')}
          </h2>
          <div className="fpoints">
            {POINTS.map((point) => (
              <div key={point} className="fpoint rv">
                <b>
                  {point === 'languages' ? 'EN · ع · ار' : t(`landing.field.points.${point}.label`)}
                </b>
                <p>{t(`landing.field.points.${point}.body`)}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}>
            <Link className="tlink" to="/field">
              {t('landing.field.open')}
            </Link>
          </div>
        </div>

        <div className="phones" role="img" aria-label={t('landing.field.phoneDescription')}>
          {PHONES.map((phone) => (
            <div key={phone.lang} className={phone.className}>
              <div className="screen" dir={phone.dir} lang={phone.lang}>
                <div className="ph-top">
                  <span className="ph-brand">{phone.brand}</span>
                  <span className="ph-lang">
                    {['EN', 'ع', 'ار'].map((label, index) => (
                      <span
                        key={label}
                        className={[index > 0 ? 'ar' : '', index === phone.on ? 'on' : '']
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {label}
                      </span>
                    ))}
                  </span>
                </div>
                <div>
                  <p className="ph-hi">{phone.hello}</p>
                  <p className="ph-sub" style={{ marginTop: 6 }}>
                    {phone.date}
                  </p>
                </div>
                <div className="ph-off">
                  <span className="dot off" />
                  {phone.offline}
                </div>
                {phone.tasks.map((task) => (
                  <PhoneTask key={task.group} task={task} done={phone.done} />
                ))}
                <div className="ph-done">
                  <span>{phone.doneToday}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3.5 6L8 10.5 12.5 6" className="ic" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface PhoneTaskProps {
  task: { group: string; title: string; note?: string };
  done: string;
}

function PhoneTask({ task, done }: PhoneTaskProps) {
  return (
    <>
      <span className="ph-grp">{task.group}</span>
      <div className="ph-card">
        <p>{task.title}</p>
        {task.note ? <small>{task.note}</small> : null}
        <span className="ph-btn">{done}</span>
      </div>
    </>
  );
}
