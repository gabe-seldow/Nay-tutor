# Unit 1 architecture

This release extends Phase 1 commit `9f7c656` on successor branch `codex/nay-tutor-unit-1`. Origin is `https://github.com/gabe-seldow/Nay-tutor.git`. Hangeul's worktree, origin, history and deployment remain untouched. The Phase 1 branch and original eight-unit plan are preserved.

## Runtime boundary

`src/curriculum.ts` contains only 14 playable Unit 1 lessons, 145 core exercises plus retained session-compatible IDs and 36 learning items. Seven small `futureUnits` records contain only number/title/description. No future lesson data, audio, exercise players or review items are loaded. `docs/CURRICULUM.md` is an archived plan outside the runtime graph.

`src/types.ts` defines lessons, exercises, items, profiles, sessions, mastery and persistence. `src/learning.ts` owns validation, block composition, option shuffling, personalization, review selection, evidence and session transitions. `src/components/LessonPlayer.tsx` renders introductions, keyboard orientation, eight exercise controls, feedback, completion and review. The existing `App.tsx` shell and Seoul CSS/SVG are retained.

## Stable IDs and updates

Released lessons use `u1-day-01` through `u1-day-14`, intentionally distinct from Phase 1's unplayable outline IDs. Character IDs retain Unicode-based `hangul-...` names; block IDs are `u1-block-...`; phrases start `u1-phrase-...`. Exercise IDs are lesson-prefixed authored keys. Never repurpose IDs or regenerate released IDs by reordering data. Add Unit 2 with new IDs and prerequisite edges from the Unit 1 challenge.

The same `nay-tutor.progress.v1` key holds version 2 state. Phase 1 migration preserves names/preferences and archives old plan completion/mastery/bookmarks without granting Unit 1 credit. Current saves allow additional completion/history IDs to survive updates; counts/review use currently available catalog entries. Subsequent unit additions retain version 2 if its structure stays unchanged. Schema changes need explicit migration.

## Sessions and evidence

Sessions store identity, exercise order/index, answer, hint/audio state, feedback, keyboard readiness and resolution status. Submission is idempotent while resolved; refresh cannot award another attempt. Continue awards completion only after the final resolved question. A mistake appends that question once; its retry is supported. Starting a different session replaces the saved session through its Start control and retains recorded learning.

Recognition, guided phrases and independent recall are separate. Matching returns per-item outcomes. Independent evidence comes from explicit sound-label typing or learned Hangul spelling, not recognition choices. Spelling also updates taught component characters. Hints, audio fallback and immediate retries cannot count as independent recall. Guided exposure cannot become independent reading mastery.

Schedules: 10 minutes after mistakes, one hour after support/recognition, one day after independent recall, three days after one delayed recall and seven after two. Mastery requires three independent recalls, two >=24-hour delayed recalls, two exercise IDs and a clean recent five outcomes. Errors reduce confidence. Review stays available when nothing is due; recent mistakes outweigh a small due-date priority. Only learned items and prerequisite-eligible Unit 1 tasks enter review.

## Korean/audio boundaries

The shared `speech.ts` remains the Phase 1 implementation. Reference cards pass `item.audio`, not isolated jamo. Listen controls use synchronous tap playback and Korean-only voice selection. Audio-first accessible names omit transcripts. A start event enables submission; explicit written support provides a fallback with assistance recorded, including for phrases. No audio autoplays.

Typing uses NFC and preserves script distinctions. IME composition is protected from Enter submission; a tap keyboard is available. A successful Hangul copy precedes spelling practice. Whole expressions disclose unfamiliar letters, register and unconfirmed configurable names. Topic particles follow the configured brother-name ending.

The local repository validates nested data and reports failures. Malformed raw saves are not overwritten merely by loading. No Hangeul key, deployment identity, secret or learner profile is accessed. No account, telemetry, paid audio API or cloud syncing exists.


## Overhaul compatibility

See CHECKPOINT-A.md and CHECKPOINT-B.md for the completed learning and finishing stages. Matching tasks were replaced with recognition while released IDs remain resumable. The same version-2 save accepts optional outcome, confidence, keyboard-decision and local-day streak fields; missing fields on earlier saves remain valid. The retired casual phrase retains its ID and evidence but is excluded from new core teaching. No progress namespace was renamed.
