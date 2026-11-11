-- Two topics that the sweeps kept filing under `other`:
--   trustworthy-ai     explainability, fairness, uncertainty, robustness, unlearning, privacy
--   signal-processing  radar, telecom and radio, sensors, classical signal processing
-- Keep this list in sync with TOPICS in scripts/build_seed.py and src/lib/validate.ts.

alter table public.offers drop constraint if exists offers_topics_check;

alter table public.offers add constraint offers_topics_check check (
  cardinality(topics) <= 5 and topics <@ array[
    'computer-vision', '3d-vision', 'llm', 'agents', 'nlp', 'rl', 'time-series',
    'foundation-models', 'generative-models', 'health', 'neuro', 'bio-chem',
    'robotics', 'earth-observation', 'climate-energy', 'physics-sim',
    'speech-audio', 'graphs', 'optimization', 'theory', 'recsys-ir',
    'efficiency', 'trustworthy-ai', 'signal-processing', 'other'
  ]::text[]
);
