# Nay Tutor — Unit 1

A personal Korean-learning app for Jaeyeon: **14 playable lessons, 145 core exercises, 13 letters, 17 syllable blocks, and 5 guided whole expressions**. One lesson a day is a two-week suggestion; progression has no calendar locks. Lessons target 3–5 minutes, with optional 2–5-minute review. Actual learner timings remain unmeasured.

The modern Seoul design, original illustration, Korean speech service, navigation and profile setup continue from Phase 1. Nay Tutor is independent of `gabe-seldow/Korean-tutor`; Hangeul is unchanged.

## Run and verify

Use Node.js 22+ and pnpm 11.25.0. Unit 1 adds no dependencies.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm curriculum:plan
# With the dev server running, use its printed URL:
pnpm test:browser http://127.0.0.1:5173/
# Or test a production preview:
pnpm build
pnpm preview
```

`pnpm check` runs tests, TypeScript, curriculum validation and the production build. The browser journey requires Chrome (`CHROME_PATH` overrides its default path), creates an isolated temporary profile, and writes ignored screenshots/reports under `qa-output/`. Speech mocks verify lifecycle and missing-voice handling; they do not prove audible output on a real device. Use the same browser and origin/port to retain the same local progress.

## The two-week path

| Lesson | Focus |
| --- | --- |
| 1. Meet Hangul | ㅏ, ㅗ, ㅣ; recognize, listen, recall |
| 2. More vowels | ㅓ, ㅜ, ㅡ; revisit earlier vowels |
| 3. First consonants | ㄴ and ㅁ in pronounceable syllables |
| 4. Your first syllables | 나, 너, 누, 마, 모; read and build |
| 5. Two more consonants | Plain ㄱ and ㄷ, with positional caveats |
| 6. Reading practice | 가, 고, 다, 도; mixed earlier blocks |
| 7. Review challenge | No new letters; missed sounds move forward |
| 8. New consonants | ㅂ and ㅅ in syllable examples |
| 9. More syllables | 바, 보, 사, 소; reading/building |
| 10. Meet ㅇ | Silent initial carrier; 아, 오, 이, 우 |
| 11. Listen, read, type | Keyboard orientation; every consonant gets a typing task |
| 12. First expressions | 네, 아니요; guided meaning |
| 13. Jaeyeon and family | Polite hello, where the dog is, what the brother is doing |
| 14. Unit 1 challenge | Recall, listening, reading, building, typing, supported meaning |

Initial vowel audio uses readable syllables (아, 오, etc.); the holder is disclosed early and taught as a character in Lesson 10. Consonants use full syllable examples, never isolated jamo speech. No complex 받침 rules, tense consonants or advanced grammar are tested.

The five active expressions are 네, 아니요, 안녕하세요, 미겔 어디 있어요?, and 재훈은 뭐 해요?. Unfamiliar letters remain supported whole-phrase exposure, never independent decoding or typing targets. The previously taught casual 안녕 remains available only in existing saved sessions and review with prior evidence. The polite foundation acknowledges that close siblings commonly speak casually. Family spellings are configurable, unconfirmed defaults.

[Full Unit 1 inventory](docs/UNIT-1.md) · [architecture](docs/ARCHITECTURE.md) · [Checkpoint A](docs/CHECKPOINT-A.md) · [Checkpoint B and release checks](docs/CHECKPOINT-B.md)

## Practice and persistence

- Seven exercise types: character/sound choices, listening, syllable reading/building, explicitly labeled romanization recall, Hangul typing, and guided phrase meaning.
- No unsolicited hints or permanent romanization during assessments. Audio transcripts are hidden from visible text and accessible names. Requested hints/written audio fallback record support.
- Listening requires playback to start or explicit written support. No autoplay, Slower, paid API, microphone or pronunciation scoring.
- The first Korean typing task offers Gabe’s help, I’m ready and Skip for now. Skipping is ungraded, does not reduce mastery, and is remembered for the session. Native Korean IME, NFC normalization and a tap keyboard are supported. Composition Enter cannot submit prematurely. Romanization cannot pass a spelling task.
- Wrong answers queue a different-format retry near the end, capped at three distinct retry items. Feedback is immediate. Hints/mistakes never remove completion; completion is separate from mastery.
- Selections, hints, listening state, feedback, correction queue and lesson position survive refresh. One active session is saved at a time; starting another replaces it while retaining recorded learning.
- Prerequisites unlock the next lesson. Completed lessons and review remain available after Lesson 14.

Storage remains **`nay-tutor.progress.v1`**, now with schema/curriculum version 2 inside the save. Phase 1 names/preferences migrate; old planned lesson data is archived without inventing new completion. Hangeul keys are never accessed. Released IDs remain stable; normal updates retain Unit 1 completion, mastery and recent history. No backend, account or cloud sync exists.

## Three answer outcomes and quiet daily practice

English sound recall distinguishes exact labels, approved sound approximations, and incorrect answers. For example, i is exact for ㅣ and ee earns “You got the sound!” with lower confidence and an earlier spelling review; e is rejected. Hangul spelling remains strict. No fuzzy matching is used. The explicit alternatives are documented in Checkpoint A.

A small flame/count marks practice on the learner’s local calendar day. A valid answer submission counts once per day, including mistakes. Opening pages, Listen, hints and skipped typing do not count. No reminders, notifications, streak popups or purchases exist. Existing progress gains no retroactive streak.

## Spaced review

Recently wrong or supported sounds receive priority, with a small due-date priority. Mistakes return in about 10 minutes; recognition/support after an hour; independent recall after a day, then three and seven days with delayed recall. Repeated recognition alone never earns mastery. Mastery requires three independent recalls, two recalls delayed by at least 24 hours, two exercise IDs, and a clean recent record. Immediate retries remain supported. Hangul spelling also records its constituent characters.

Aggregate attempts, hints and dates are per item; the most recent 30 outcomes and 2,000 session attempts are retained. Learned material can be practiced even when nothing is due. Only Unit 1 data enters review.

## Future units and deployment

Units 2–8 are **Coming soon** metadata cards with a lock, title and short description. They have no lesson buttons, completion counters, playable routes, audio or review items. The original [eight-unit plan](docs/CURRICULUM.md) remains historical documentation outside the app runtime.

Production uses the existing Vercel project **naytutor**, repository **gabe-seldow/Nay-tutor**, branch **main**, and domain **https://naytutor.vercel.app**. Keep that project/domain and deploy updates normally from main. Do not create another project or alter Hangeul. The build remains frozen pnpm install / `pnpm build` / `dist`, with no environment variables required.

Physical iPhone Safari audio/keyboard checks, learner timing and Korean editorial/native-speaker review remain. Automated Chrome emulation is not physical iPhone verification.
