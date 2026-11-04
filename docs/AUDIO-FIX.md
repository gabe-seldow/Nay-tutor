# Korean audio startup fix

Compared the current default-branch Hangeul `src/speech.ts` (blob `6eb7250bdcbdc64b7c7c7b5cb12dea6aa2eaeb14`) and `src/components/common.tsx` with Nay Tutor. The speech services were equivalent; Hangeul's control is a direct Listen action, while Nay Tutor had added a tap-to-stop state. No newer Hangeul engine fix was found. Hangeul was read only.

Established code gaps: an empty voice list aborted playback before calling speak; silent requests had no start timeout; repeated tapping the active Nay Tutor control canceled it. The precise physical-iPhone failure is not established without device diagnostics.

Retained Hangeul's synchronous user-tap path, Korean voice selection, fresh utterances and strong reference. When the voice list is empty, request ko-KR in the tap without assigning an unrelated voice. Explicit non-Korean-only lists still fail gracefully. Bounded voice discovery probes handle missing voiceschanged events without autoplay. Repeated taps on the same active sample do not interrupt it. Different samples/navigation still cancel the previous owner. Unexpected cancellation and an eight-second failure to start now report a useful error; retries require a fresh tap. The button stays Listen at one speed.

No curriculum, progress schema, storage or scheduling changes. Written support remains explicitly requested and records assistance in listening and phrase exercises. Automated speech mocks verify events and failure paths, not audible pronunciation or a physical iPhone.

On iPhone Safari, reload the production site, tap a vowel reference, replay after it finishes, try rapid taps, leave/return, and try a listening question and family phrase. If no sound starts, wait for the error and test written support. Check device volume/output and an installed Korean system voice. Do not clear website data, which would erase local progress.

Browser synthesis depends on the OS/browser voices and remains a limitation. If it is still unreliable, the most dependable next step is reviewed Korean audio recordings bundled as static files and played by a tap. That requires sourcing/reviewing the recordings; no new service or audio assets were added here.

Reference: [Web Speech API specification](https://wicg.github.io/speech-api/) describes language-based voice selection and speech errors. Language-only startup is an attempted fallback, not proof that a usable Korean voice exists.
