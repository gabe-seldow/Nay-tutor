# Nay Tutor

A personal Korean-learning app for Jaeyeon, built around Hangul sounds and everyday family conversation. Independent from Hangeul, with its own repository, Git history, curriculum, visual identity, and browser storage.

**Phase 1 is complete.** This release is a working foundation and curriculum explorer. Interactive exercises, grading, lesson completion, mastery updates, and review scheduling are intentionally reserved for later phases. Exploring an outline or listening to an example awards no learning credit.

## Run locally

Use Node.js 22+ and pnpm 11.25.0. The committed lockfile retains Hangeul’s proven dependency versions; no environment, secrets, deployment identity, or learner data were copied.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Use the URL Vite prints. Progress belongs to that browser and origin; changing the port creates a separate save. The Phase 1 development preview used port 5182.

```sh
pnpm test
pnpm typecheck
pnpm validate:curriculum
pnpm build
# Or run all four:
pnpm check

# With a development or production preview server running:
pnpm test:browser http://127.0.0.1:5182/

# Refresh the full, reviewable curriculum outline:
pnpm curriculum:plan
```

The browser check requires installed Chrome. Set `CHROME_PATH` if it is not at the platform default. It creates an isolated temporary browser profile, never opens the learner’s personal profile, and writes ignored screenshots/report files under `qa-output/`.

## What works

- Modern Seoul design: a blue/charcoal/soft-white palette, original SVG skyline and N Seoul Tower, responsive desktop navigation and a fixed mobile navigation bar.
- Home: next planned lesson, eight-unit path, completion counters, Hangul progress, and review entry point. All counters start at zero.
- Forty lesson previews: objectives, teaching examples, prerequisites, new material, review material, and planned exercise sequences.
- Small-group Hangul reference: first two vowels and silent initial ㅇ shown first; later groups remain collapsed.
- Tap-to-listen reference audio reuses Hangeul’s synchronous, Korean-voice-only speech service. No autoplay, paid API, or Slower feature. Consonants use readable syllables, not claimed isolated phonemes.
- Local profile: Jaeyeon/재연, Jaehun/재훈, Miguel/미겔 are editable defaults. Korean spellings stay unconfirmed until the user explicitly checks the confirmation box. Editing a name clears that confirmation.
- Saved names, preferences, and last page/lesson preview. Storage failures produce a visible warning. Malformed saves are left intact until a deliberate state change.

## Curriculum and architecture

The course has **8 units, 40 planned lessons, 87 learning items, and 120 representative exercise specifications**. The larger combined-vowel and tense-consonant groups are split into separate lessons to keep the sound load manageable. Three-to-five-minute durations are design targets, not measured learner timings.

See [the full curriculum plan](docs/CURRICULUM.md), [architecture](docs/ARCHITECTURE.md), and [verification and phase boundary](docs/PHASE-1.md).

| Unit | Planned lessons | Main goal |
| --- | ---: | --- |
| First Korean sounds | 6 | Six basic vowels, ㄴ/ㅁ/ㅇ, blocks and 나무 |
| Reading Hangul | 8 | Remaining basic consonants, all vowels, keyboard orientation |
| More sounds & short words | 6 | Aspirated/tense consonants and short words |
| Final consonants | 4 | Basic 받침, linking and common changes |
| Everyday family Korean | 4 | Greetings, thanks, feelings, bedtime and waiting |
| Questions & answers | 4 | What, where, who, and short replies |
| Daily routines | 4 | Meals, studying, going places and wanting food |
| Simple family conversations | 4 | Short exchanges, cumulative practice, optional casual forms |

The initial course emphasizes polite Korean. It explicitly explains that close siblings often use casual Korean, introduces optional casual comparisons later, and notes when honorific expressions are more appropriate for elders. Family names are used selectively. Fixed course examples retain their disclosed default spelling; profile-aware exercise substitution is Phase 4 work.

## Independent storage

The sole storage key is **`nay-tutor.progress.v1`** with curriculum version 1. The app never reads, migrates, clears, or writes any Hangeul key. No account, backend, cloud syncing, progress import, or reset tool is implemented. The repository interface allows a sync adapter to be added later.

## Vercel preparation

No deployment was attempted during Phase 1. `vercel.json` declares Vite, the frozen pnpm install, `pnpm build`, and output `dist`. There is no inherited `.vercel` folder, Vercel project ID, production domain, or secret.

For the release phase:

1. In Vercel, create a **new** project and import [`gabe-seldow/Nay-tutor`](https://github.com/gabe-seldow/Nay-tutor). Do not select Korean-tutor or an existing Hangeul project.
2. Set repository root to this project’s root and framework to Vite. Use the committed install/build/output settings. No environment variables are required.
3. Select the reviewed release branch. The initial implementation branch is `codex/nay-tutor-phase-1`; the repository was empty when it was created, so no existing `main` history was assumed.
4. Check a preview deployment before choosing a distinct production domain. Do not change Hangeul’s domains.
5. Complete native-language review, learner timing, and physical iPhone/Safari audio checks before treating the course as release-ready.

Hash navigation works from static hosting without server rewrites. See [Vercel’s Vite documentation](https://vercel.com/docs/frameworks/frontend/vite).

## What comes next

**Phase 2:** reusable character recognition, sound-to-character, matching, syllable reading/building, listening/selecting and Korean typing controls; implement Units 1–2; explicit hints, concealed audio-first answers, concise feedback, keyboard setup gating, and completion/resume tests.

**Phase 3:** actual mastery updates and spaced review. **Phase 4:** implement remaining units and profile-aware family examples. **Phase 5:** linguistic review, device/audio testing, polish and independent deployment. No later phase has been silently implemented here.
