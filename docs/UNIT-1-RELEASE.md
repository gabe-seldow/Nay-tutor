# Unit 1 verification

The release contains 14 playable lessons and 140 authored exercises across eight types. Lessons target 3–5 minutes with optional 2–5-minute review; learner timings remain unmeasured.

Keyboard setup follows [Apple's iPhone keyboard guide](https://support.apple.com/guide/iphone/add-or-change-keyboards-iph73b71eb/ios) and [Microsoft's keyboard/language settings guide](https://support.microsoft.com/en-gb/windows/hardware/input-devices/manage-the-language-and-keyboard-input-layout-settings-in-windows). Approximate sound labels follow the [National Institute of Korean Language romanization reference](https://www.korean.go.kr/front_eng/roman/roman_01.do); they are not fixed English phoneme equivalents.

## Checks

Final checks passed: **59 automated tests**, TypeScript, curriculum validation, production build, and **823 production-browser assertions**. The journey submitted 145 questions: all 140 authored exercises plus five correction repeats, with three reload/resume checks. All eight exercise types were exercised. Representative screenshots were visually inspected after the production run.

Unit tests cover every lesson's answers/audio, prerequisites, supported phrases, script-specific typing/NFC, matching, block composition, stable IDs, shuffling, personalization, hint/audio gating, mistake recycling, idempotent submission, completion/unlocking, schedules, mastery restrictions, weak review, typing evidence, session persistence, Phase 1 migration, update compatibility and Hangeul-key isolation. The original fourteen speech regression tests remain.

Curriculum validation rejects untaught independent reading, isolated/mismatched audio, invalid choices, unbuildable blocks and premature Hangul typing. TypeScript and the production build must pass.

The browser journey plays every exercise in all fourteen lessons through the UI, makes intentional mistakes, requests hints, checks corrections, resumes after reload, checks IME composition, finishes the course and practices review. It checks locked lessons, noninteractive future cards, refused future routes, hidden transcripts/accessibility names, written fallback for sound and phrase tasks, reference syllable audio, profiles and storage isolation.

Screens are checked at 1440×1000, 375×812, 390×844 and 430×932. Screenshots/reports remain locally in ignored `qa-output/`. Final counts and commit SHA accompany delivery. Speech uses deterministic system-voice/utterance mocks, not verified audible output.

## Remaining checks

Physical iPhone Safari: Korean voice loading and audible tap playback, stopping/replacing audio, unavailable-voice support, native keyboard/IME, tap keyboard and local storage. Test lesson/review pacing and confusing sound pairs with Jaeyeon. Obtain Korean editorial/native-speaker review before claiming it. These real-device/editorial checks were not performed here.

## GitHub and deployment

Initially only `codex/nay-tutor-phase-1` existed; there was no `main`, and GitHub returned no rulesets. The successor retains Phase 1 as an ancestor. Publication uses ordinary non-force pushes and remote-SHA verification. If main is still absent after a re-fetch, it can be initialized from the tested release without overwriting history.

Vercel build configuration exists, but no Vercel project/domain is connected and no deployment is claimed. Import Nay Tutor as a new project and select the reviewed release branch (main once published). Keep Hangeul unchanged. GitHub's default branch can be switched to main in repository settings; creating main alone does not change that setting.
