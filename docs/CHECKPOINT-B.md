# Checkpoint B — finishing and release

Checkpoint A (`cba5b4e`) was committed and reported before this stage began. The app retains fourteen lessons with 9–12 core questions (145 total), seven exercise types, the existing manual Korean audio service and the modern Seoul identity. No matching games, new future units, backend, accounts, dependencies or notifications were added.

## Quiet practice streak

A small flame/count appears at the upper-right of the learning hero. A valid Check answer submission qualifies, including a mistake: it is substantive practice. Partial and hinted answers count too. A blocked/blank submission, opening a page/lesson, Listen, requesting a hint, and skipping typing do not count. Each learner-local calendar date counts once, regardless of questions or sessions. No historical streak is invented for old saves.

Date arithmetic uses calendar dates, not fixed 24-hour durations, so daylight-saving changes do not double-count days. Consecutive dates increment; a missed date displays zero and the next practice starts at one. A backwards device-date/time-zone change adds no extra day and preserves the recorded count until the date catches up. The count persists in the existing progress namespace; no server clock, notifications, popup, freeze or recovery mechanism exists.

## Phone flow

Questions use natural height, short prompts, large letters, short answer labels, comfortable touch targets, compact feedback and safe-area navigation. Short viewports reduce decorative character height; typing focus scrolls the input into view. Keyboard help has two clear choices, and a skipped spelling task uses neutral feedback. There is no fixed-height card that clips content. Existing audio remains manual and unchanged from the deployed audio fix.

## Five expressions without lost history

New core practice teaches 네, 아니요, 안녕하세요, 미겔 어디 있어요? and 재훈은 뭐 해요?. The casual 안녕 ID and its released question IDs remain for old saved sessions and for review when actual old practice evidence exists. They are not introduced to a new learner or granted merely by completing the updated lesson. Historical lesson/item IDs and completion are preserved. Family spellings remain configurable and unconfirmed until the learner confirms them.

## Verification and limits

Automated checks include grading, capped retries, saved selections, old matching-session translation, ready/skip behavior, all fourteen lessons, streak dates/persistence, and retained phrase evidence. Production-browser automation checks short/normal/large phone sizes, reduced-height typing, explicit partial-credit feedback, manual listening and written fallback, no matching controls, completion, review, three reload/resume points and same-day streak persistence. Counts and commits are reported with delivery.

Final verification passed: 110 automated tests, TypeScript, curriculum validation and production build; 1,004 browser assertions, 145 core questions plus five intentional-error corrections, all fourteen lessons, and three reload/resume checks. Viewports were 1440×1000, 375×812, 390×844, 430×932 and a 390×460 keyboard simulation. Representative screenshots were visually inspected.

Browser speech is mocked for repeatable event/error checks. Neither audible physical-iPhone audio, a native phone keyboard, learner-paced timing nor native-speaker review is claimed. Physical Safari should still be checked for audio, keyboard opening, comfortable scrolling, reload retention and the three answer outcomes.
