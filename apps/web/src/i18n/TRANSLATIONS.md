# Translations

Saqi ships in English and Arabic (Modern Standard Arabic, the language of Abu Dhabi). The Arabic is machine-assisted and reviewed for consistency, not by a native agronomist. Native review is welcome; the glossary below is the place to start.

`parity.test.ts` fails if a key in `en.json` is missing from `ar.json`, if a message's ICU params differ from English, if a message doesn't compile, or if a string is left in Latin script without being on its allowlist.

## Rules

- Western digits everywhere (`ar-AE-u-nu-latn`), per design.md.
- Units, codes and the brand stay Latin: `m³`, `mm`, `%`, `m³/h`, `GST`, `ET₀`, `D-1`, `RO`, `TSE`, `Saqi`, `Open-Meteo`. Words around them are translated (`لتر/شجرة`, `هكتار`).
- Arrows that show a change over time point with the reading direction: `←` in Arabic reason text, so "from → to" reads right to left. Time ranges built by `formatTimeRangeGst` sit in an LTR-isolated figure and keep `→`.
- Arabic plurals use all six ICU categories where a count is shown (`zero`, `one`, `two`, `few`, `many`, `other`).
- Short, plain sentences. No em dashes or semicolons in prose, in either language.

## Glossary

| English                     | Arabic                     | Note                                                                 |
| --------------------------- | -------------------------- | -------------------------------------------------------------------- |
| PAW (plant-available water) | الماء المتاح (للنبات)      | The long form in chart titles, the short form in labels and reasons. |
| ET₀                         | ET₀ (التبخر-النتح المرجعي) | The symbol stays; the long form only in screen-reader labels.        |
| m³                          | m³                         | A unit; never translated. Screen-reader text spells it: متر مكعب.    |
| Threshold                   | عتبة                       | The refill trigger, a % of PAW.                                      |
| Target                      | الهدف                      | The refill level.                                                    |
| Deficit (decision)          | ري ناقص                    | Deficit irrigation under a tight budget.                             |
| Irrigate / Skip / Pulse     | ري / تخطي / نبضات          | Decision chips; nouns read better than imperatives.                  |
| Pulse (greenhouse)          | نبضة                       | One short substrate irrigation.                                      |
| Block                       | قطعة                       | A field unit (D-1, F-1).                                             |
| Field (screen)              | الحقل                      |                                                                      |
| Simulated sensors           | حساسات محاكاة              | Must stay visible in every locale (honest data).                     |
| Stale                       | قديمة                      | A sensor silent for over 3 h.                                        |
