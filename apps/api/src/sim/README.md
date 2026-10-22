# Simulator (TODO(T08))

Deterministic 30-day farm history for Farm 07, per `../../../../../plan/03-data-model.md` §4:

- `prng.ts`: `mulberry32` (done) and `gaussian` (T08).
- `simulate.ts`: hourly water balance per block, night refills and greenhouse pulses, per-sensor noise, 60 cm lag, 48 h ramp onto the scenario values, the D-3 60 cm gap.
- `seed.ts`: `buildSeed({ anchor })`, which replaces `buildInlineSeed` in `repo/memory.ts`.
- `fixtures/openmeteo-past30.json`: recorded past-30-day ET₀.
- `fixtures/weather-fallback.json`: the weather payload served until T09 (and its stale fallback after).
