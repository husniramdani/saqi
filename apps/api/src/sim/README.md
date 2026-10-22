# Simulator

Deterministic 30-day history for Farm 07 (plan/03-data-model.md §4). Same seed, same bytes.

- `prng.ts`: `mulberry32` and `gaussian` (Box–Muller).
- `simulate.ts`: hourly water balance per block in PAW space (diurnal crop use, night refills below threshold at 22:00, greenhouse pulses at 07/11/15), sensor noise, the 6 h lag at 60 cm, and a 48 h ramp onto the scenario values.
- `seed.ts`: `buildSeed({ anchor })` → `SeedData` (readings, events, tasks, allocation). The anchor defaults to the latest 21:00 GST.
- `fixtures/openmeteo-past30.json`: recorded past-30-day ET₀ for Al Ain (Open-Meteo, fetched 2026-10-22).
- `fixtures/weather-fallback.json`: the weather payload served until T09, and its stale fallback after.

Print the scenario: `pnpm --filter api seed`.
