# Phase 1 completion and verification

## Delivered boundary

Independent app and Git repository; responsive modern Seoul visual identity; working hash navigation; configurable, initially unconfirmed family-name spellings; local progress repository; complete eight-unit curriculum plan; reference audio adapted from Hangeul; reproducible checks; independent Vercel build preparation.

The final plan has 40 lessons. During planning, combined vowels and tense consonants were separated into smaller groups instead of leaving oversized lessons. Units 1–2 are planned for Phase 2; remaining interactive lesson content is Phase 4. The review screen is deliberately a clearly labeled Phase 3 placeholder.

## Verified

- **48 automated tests:** 34 foundation tests and 14 reused audio-service tests. Covers complete plan inventory, prerequisite ordering and malformed dependencies, missing answers, untaught reading letters, audio transcript leaks, merged-vowel treatment, keyboard sequencing, phrase speech-level tags, storage namespace isolation, deep save validation, malformed/blocked storage, round trips, no initial credit, and route parsing/resume.
- **TypeScript:** `pnpm typecheck` passes.
- **Curriculum validation:** `pnpm validate:curriculum` passes for 8 units, 40 lessons and 87 learning items. All lesson and exercise records are marked planned.
- **Production build:** `pnpm build` passes and emits a standalone `dist/`.
- **Production browser smoke check: 70 assertions pass.** Desktop 1440×1000 and mobile 375×812, 390×844 and 430×932; all four main pages plus a lesson preview; no horizontal overflow; mobile navigation targets at least 44 pixels. Includes actual form updates/reload, preview resume from a fresh URL, history back, invalid routes, skip-to-content focus without a route change, required inputs, no false learning credit, missing-voice fallback, corrupt save preservation and unchanged Hangeul-key sentinel.
- Representative desktop and mobile screenshots were visually inspected. Generated reports/screenshots are ignored under `qa-output/`.

## Not claimed

No exercise engine, answer grading, hint engine, lesson completion writes, mastery updates or spaced scheduling is implemented. Corresponding automated behavior tests will accompany those phases. The structural plan validator does not prove every semantic prerequisite or Korean grammatical nuance. Duration targets have not been measured with Jaeyeon. No native-speaker review, physical iPhone test, Safari playback test, recorded native audio, or production deployment occurred.

## Before Phase 2

Implement reusable exercise controls, expand representative plans into fully authored 3–5-minute lessons for Units 1–2, choose unambiguous distractors, withhold audio transcripts/romanization during assessments, introduce keyboard setup before typing, handle Korean IME composition/NFC, and test correct/incorrect/hinted attempts, lesson resume/completion and navigation. Keep actual review/mastery scheduling in Phase 3. Ask about family spellings through the existing settings flow rather than treating defaults as authoritative.

## References used for planning

- [National Institute of Korean Language: Revised Romanization](https://www.korean.go.kr/front_eng/roman/roman_01.do): vowel labels, position-dependent consonant guides and the limits of simple English-letter mappings. This is a reference, not a native-speaker review of these lessons.
- [Apple: add or change keyboards on iPhone](https://support.apple.com/guide/iphone/add-or-change-keyboards-iph73b71eb/ios): the optional keyboard setup instructions.
- [Vercel: Vite framework](https://vercel.com/docs/frameworks/frontend/vite): independent deployment preparation. Deployment is reserved for the release phase.
