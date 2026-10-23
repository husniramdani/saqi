# Translations

Arabic (Modern Standard Arabic) and Urdu are machine-assisted and reviewed for consistency, not by a native agronomist. Native review is welcome; the glossary below is the place to start.

`parity.test.ts` fails if a key in `en.json` is missing from `ar.json` or `ur.json`, if a message's ICU params differ from English, if a message doesn't compile, or if a string is left in Latin script without being on its allowlist.

## Rules

- Western digits everywhere (`ar-AE-u-nu-latn`, `ur-PK-u-nu-latn`), per design.md.
- Units, codes and the brand stay Latin: `m³`, `mm`, `%`, `m³/h`, `GST`, `ET₀`, `D-1`, `RO`, `TSE`, `Saqi`, `Open-Meteo`. Words around them are translated (`لتر/شجرة`, `لیٹر/درخت`, `هكتار`, `ہیکٹر`).
- Arrows that show a change over time point with the reading direction: `←` in Arabic and Urdu reason text, so "from → to" reads right to left. Time ranges built by `formatTimeRangeGst` sit in an LTR-isolated figure and keep `→`.
- Arabic plurals use all six ICU categories where a count is shown (`zero`, `one`, `two`, `few`, `many`, `other`). Urdu uses `one` and `other`.
- Short sentences; sentence case doesn't apply to these scripts.

## Glossary

| English                     | Arabic                     | Urdu                            | Note                                                                         |
| --------------------------- | -------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| PAW (plant-available water) | الماء المتاح (للنبات)      | (پودے کے لیے) دستیاب پانی       | The long form in chart titles, the short form in labels and reasons.         |
| ET₀                         | ET₀ (التبخر-النتح المرجعي) | ET₀ (حوالہ جاتی بخارات و تبخیر) | The symbol stays; the long form only in screen-reader labels.                |
| m³                          | m³                         | m³                              | A unit; never translated. Screen-reader text spells it: متر مكعب, مکعب میٹر. |
| Threshold                   | عتبة                       | حد                              | The refill trigger, a % of PAW.                                              |
| Target                      | الهدف                      | ہدف                             | The refill level.                                                            |
| Deficit (decision)          | ري ناقص                    | کم آبپاشی                       | Deficit irrigation under a tight budget.                                     |
| Irrigate / Skip / Pulse     | ري / تخطي / نبضات          | آبپاشی / چھوڑیں / قسط وار       | Decision chips; nouns in Arabic and Urdu read better than imperatives.       |
| Pulse (greenhouse)          | نبضة                       | قسط                             | One short substrate irrigation.                                              |
| Block                       | قطعة                       | بلاک                            | A field unit (D-1, F-1). Urdu uses the farm loanword.                        |
| Field (screen)              | الحقل                      | کھیت                            |                                                                              |
| Simulated sensors           | حساسات محاكاة              | مصنوعی سینسر                    | Must stay visible in every locale (honest data).                             |
| Stale                       | قديمة                      | پرانا                           | A sensor silent for over 3 h.                                                |
