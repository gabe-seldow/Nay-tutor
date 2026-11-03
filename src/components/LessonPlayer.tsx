import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  HelpCircle,
  Keyboard,
  Lock,
  RotateCcw,
} from "lucide-react";
import {
  audio,
  characters,
  exerciseById,
  itemById,
  lessonById,
  lessons,
} from "../curriculum";
import {
  completionPercent,
  composeBlock,
  continueSession,
  evaluateAnswer,
  isAnswerReady,
  makeSession,
  normalizeAnswer,
  personalText,
  resolveExercise,
  reviewQueue,
  shuffled,
  submitAnswer,
} from "../learning";
import { isUnlocked, nextLesson } from "../progress";
import type {
  Answer,
  Exercise,
  LearnerProgress,
  Lesson,
  PracticeSession,
} from "../types";
import { Listen } from "./Listen";
type Update = (fn: (p: LearnerProgress) => LearnerProgress) => void;
export function LessonView({
  lesson,
  progress,
  update,
}: {
  lesson: Lesson;
  progress: LearnerProgress;
  update: Update;
}) {
  const [finished, setFinished] = useState(false),
    [copy, setCopy] = useState("");
  if (!isUnlocked(lesson.id, progress))
    return (
      <section className="card empty-state">
        <Lock size={28} />
        <h1>This step is coming up.</h1>
        <p>Complete the previous lesson first. There are no calendar locks.</p>
        <a className="primary" href={`#/lesson/${lesson.prerequisites[0]}`}>
          Open previous lesson <ArrowRight size={16} />
        </a>
      </section>
    );
  const session =
    progress.session?.lessonId === lesson.id ? progress.session : null;
  if (finished) {
    const next = nextLesson(progress);
    return (
      <section className="card lesson-finished">
        <span className="finished-mark">
          <Check size={32} />
        </span>
        <span className="eyebrow">
          {lesson.day === 14 ? "UNIT 1 COMPLETE" : "ONE SMALL STEP, COMPLETE"}
        </span>
        <h1>
          {lesson.day === 14
            ? "A sound foundation."
            : "You made that connection."}
        </h1>
        <p>
          {lesson.day === 14
            ? "You can recognize your first sounds and read simple blocks. Keep them familiar with review."
            : `${lesson.title} is complete. Sounds become familiar with practice over time.`}
        </p>
        <p className="subtle">
          Hints and mistakes are part of learning. Completion is separate from
          long-term mastery.
        </p>
        <div className="finish-actions">
          <a
            className="primary"
            href={next ? `#/lesson/${next.id}` : "#/review"}
          >
            {next ? "Next lesson" : "Practice your sounds"}{" "}
            <ArrowRight size={16} />
          </a>
          <a className="text-link" href="#/learn">
            Back to your path
          </a>
        </div>
      </section>
    );
  }
  if (session)
    return (
      <PracticePlayer
        progress={progress}
        update={update}
        session={session}
        title={lesson.title}
        onFinish={() => setFinished(true)}
      />
    );
  const keyboard = lesson.keyboardIntro && !progress.keyboardIntroduced;
  const showGuides =
    progress.preferences.romanization === "early-support" && lesson.day <= 3;
  function start() {
    update((p) => {
      const next = keyboard ? { ...p, keyboardIntroduced: true } : p;
      return { ...next, session: makeSession(next, lesson.id) };
    });
  }
  return (
    <div className="preview-page">
      <a className="text-link back" href="#/learn">
        <ArrowLeft size={17} /> Your learning path
      </a>
      <div className="page-heading">
        <span className="eyebrow">
          UNIT 1 · LESSON {lesson.day} OF 14 · ABOUT 4 MINUTES
        </span>
        <h1>{lesson.title}</h1>
        <p>{lesson.objective}</p>
      </div>
      <section className="card teaching">
        <span className="eyebrow">ONE THING TO NOTICE</span>
        <p className="lesson-explanation">{lesson.explanation}</p>
        {lesson.examples.map((example) => {
          const text = example.profileTemplate
            ? personalText(example.profileTemplate, progress.profile)
            : example.ko;
          const meaning = example.meaning
            .replace("Miguel", progress.profile.dog.name)
            .replace("Jaehun", progress.profile.brother.name);
          return (
            <div className="example" key={example.ko}>
              <span className="example-korean" lang="ko">
                {text}
              </span>
              {lesson.day >= 12 || showGuides ? (
                <strong>{meaning}</strong>
              ) : (
                <details className="sound-guide">
                  <summary>Show sound guide</summary>
                  <strong>{meaning}</strong>
                </details>
              )}
              <Listen content={audio(text, "phrase")} />
              <p>{example.note}</p>
            </div>
          );
        })}
      </section>
      {lesson.newItemIds.length > 0 && (
        <section className="card">
          <h2>Your new sounds & expressions</h2>
          <div className="intro-items">
            {lesson.newItemIds.map((id) => {
              const item = itemById[id];
              const text = item.profileTemplate
                ? personalText(item.profileTemplate, progress.profile)
                : item.ko;
              return (
                <div key={id}>
                  <strong lang="ko">{text}</strong>
                  <details
                    className="sound-guide"
                    open={item.kind === "phrase" || showGuides}
                  >
                    <summary>
                      {item.kind === "phrase"
                        ? "Whole-phrase meaning"
                        : "Sound guide"}
                    </summary>
                    <span>
                      {item.meaning
                        .replace("Miguel", progress.profile.dog.name)
                        .replace("Jaehun", progress.profile.brother.name)}
                    </span>
                  </details>
                  <Listen
                    content={
                      item.profileTemplate ? audio(text, "phrase") : item.audio
                    }
                    label="Hear example"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}
      {lesson.day >= 12 && !progress.profile.spellingsConfirmed && (
        <p className="name-note">
          Family spellings are editable defaults. You can confirm or change them
          in <a href="#/settings">settings</a>.
        </p>
      )}
      {keyboard && (
        <section className="card keyboard-orientation">
          <Keyboard size={24} />
          <h2>A small keyboard check</h2>
          <p>
            On iPhone: Settings → General → Keyboard → Keyboards → Add New
            Keyboard → Korean. Use the globe key to switch. On Windows: Settings
            → Time & language → Language & region → add Korean and its keyboard;
            use Windows + Space to switch.
          </p>
          <p>
            You may also use the tap keyboard in the lessons. First enter{" "}
            <strong lang="ko">나</strong> here, using either method. On a
            standard Korean two-set keyboard, press s then k.
          </p>
          <label>
            <span>Copy the model 나 in Hangul</span>
            <input
              id="keyboard-copy"
              lang="ko"
              autoComplete="off"
              value={copy}
              onChange={(e) => setCopy(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="secondary"
            onClick={() => setCopy(composeBlock("ㄴ", "ㅏ"))}
          >
            Tap ㄴ + ㅏ → 나
          </button>
          <p role="status">
            {normalizeAnswer(copy) === "나"
              ? "Ready — you entered a Korean syllable."
              : "The sound label na is not Hangul spelling."}
          </p>
        </section>
      )}
      {progress.session && progress.session.lessonId !== lesson.id && (
        <p className="phase-note">
          One practice session is saved at a time. Starting this lesson replaces
          the other saved session; your recorded learning stays saved.
        </p>
      )}
      <button
        type="button"
        className="primary start-lesson"
        disabled={keyboard && normalizeAnswer(copy) !== "나"}
        onClick={start}
      >
        {keyboard
          ? "I can enter Hangul — start practice"
          : progress.completedLessonIds.includes(lesson.id)
            ? "Practice this lesson again"
            : "Start practice"}{" "}
        <ArrowRight size={17} />
      </button>
      <p className="phase-note">
        {lesson.exercises.length} short exercises · No rush · Hints are always
        available.
      </p>
    </div>
  );
}
function PracticePlayer({
  progress,
  update,
  session,
  title,
  onFinish,
}: {
  progress: LearnerProgress;
  update: Update;
  session: PracticeSession;
  title: string;
  onFinish: () => void;
}) {
  const e = resolveExercise(
    exerciseById[session.exerciseIds[session.index]],
    progress.profile,
  );
  const feedback = useRef<HTMLDivElement>(null);
  function patch(change: Partial<PracticeSession>) {
    update((p) =>
      p.session?.id === session.id
        ? { ...p, session: { ...p.session, ...change } }
        : p,
    );
  }
  function check() {
    update((p) => submitAnswer(p, p.session?.answer ?? ""));
    requestAnimationFrame(() => feedback.current?.focus());
  }
  const ready =
    isAnswerReady(e, session.answer) &&
    (!e.audio || session.heardAudio || session.hintUsed);
  const correction = session.exerciseIds.slice(0, session.index).includes(e.id);
  return (
    <div className="player">
      <a href="#/learn" className="text-link back">
        <ArrowLeft size={16} /> Save & leave
      </a>
      <div className="player-top">
        <span>{title}</span>
        <strong>
          {session.index + 1} / {session.exerciseIds.length}
        </strong>
      </div>
      <div
        className="lesson-progress"
        role="progressbar"
        aria-label="Lesson progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completionPercent(session)}
      >
        <span style={{ width: `${completionPercent(session)}%` }} />
      </div>
      <section className="exercise-card" key={`${session.id}-${session.index}`}>
        <span className="eyebrow">
          {e.guided
            ? "SUPPORTED WHOLE PHRASE"
            : e.input === "romanization"
              ? "SOUND RECALL · ENGLISH LETTERS"
              : e.input === "Hangul"
                ? "KOREAN SPELLING · HANGUL"
                : e.type.replaceAll("-", " ")}
        </span>
        <h1>{e.prompt}</h1>
        {e.display && (
          <div
            className={`exercise-display ${e.guided ? "phrase-display" : ""}`}
            lang="ko"
          >
            {e.display}
          </div>
        )}
        {e.guided && (
          <p className="guided-note">
            Some letters are new. Use the full model and audio; this is meaning
            practice, not independent reading.
          </p>
        )}
        {e.audio && (
          <div className="question-audio">
            <Listen
              content={e.audio}
              hideText={!e.guided}
              label="Listen to the question"
              onPlayback={() => {
                if (!session.resolved && !session.heardAudio)
                  patch({ heardAudio: true });
              }}
            />
            {
              <button
                type="button"
                className="text-link"
                disabled={session.resolved}
                onClick={() => patch({ hintUsed: true })}
              >
                Use written support
              </button>
            }
            {session.hintUsed && !e.guided && (
              <p className="written-support" lang="ko">
                Written audio model: {e.audio.text}
              </p>
            )}
          </div>
        )}
        <ExerciseControls
          key={`${e.id}-${session.index}`}
          exercise={e}
          answer={session.answer}
          setAnswer={(answer) => patch({ answer })}
          disabled={session.resolved}
          seed={`${session.id}-${session.index}`}
          onSubmit={check}
        />
        {!session.resolved && (
          <div className="hint-area">
            <button
              className="hint-button"
              type="button"
              onClick={() => patch({ hintUsed: true })}
            >
              <HelpCircle size={17} />{" "}
              {session.hintUsed ? "Hint requested" : "I’d like a hint"}
            </button>
            {(session.hintUsed || correction) && (
              <p role="note" className="hint-content">
                {e.hint}
              </p>
            )}
          </div>
        )}
        {session.resolved ? (
          <div
            className={`feedback ${session.lastCorrect ? "correct" : "incorrect"}`}
            role="status"
            tabIndex={-1}
            ref={feedback}
          >
            <h2>
              {session.lastCorrect ? "That’s it." : "A useful one to revisit."}
            </h2>
            <p>{session.feedback}</p>
            {session.hintUsed && (
              <small>Supported practice — no independent recall credit.</small>
            )}
            <button
              type="button"
              className="primary continue"
              onClick={() => {
                if (session.index === session.exerciseIds.length - 1)
                  onFinish();
                update(continueSession);
              }}
            >
              {session.index === session.exerciseIds.length - 1
                ? "Finish practice"
                : "Continue"}{" "}
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="primary check-answer"
            disabled={!ready}
            onClick={check}
          >
            Check answer <Check size={17} />
          </button>
        )}
      </section>
    </div>
  );
}
export function ExerciseControls({
  exercise: e,
  answer,
  setAnswer,
  disabled,
  seed,
  onSubmit,
}: {
  exercise: Exercise;
  answer: Answer;
  setAnswer: (answer: Answer) => void;
  disabled: boolean;
  seed: string;
  onSubmit: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null),
    [tapOnset, setTapOnset] = useState("");
  const composing = useRef(false);
  if (e.options)
    return (
      <div
        className={`answer-options ${e.type === "sound-to-character" ? "hangul-options" : ""}`}
        role="group"
        aria-label="Answer choices"
      >
        {shuffled(e.options, seed).map((o) => (
          <button
            type="button"
            className={`answer-option ${answer === o.value ? "selected" : ""}`}
            key={o.value}
            disabled={disabled}
            aria-pressed={answer === o.value}
            onClick={() => setAnswer(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  if (e.pairs) {
    const matches = typeof answer === "string" ? {} : answer;
    return (
      <div className="matching">
        <p>
          Choose a letter on the left, then a sound on the right. Tap a letter
          again to change its match.
        </p>
        <div className="match-columns">
          <div>
            {shuffled(e.pairs, `${seed}-left`).map((pair) => (
              <button
                type="button"
                key={pair.itemId}
                disabled={disabled}
                aria-label={`Letter ${pair.left}${matches[pair.itemId] ? ", match selected" : ""}`}
                aria-pressed={selected === pair.itemId}
                className={`match-letter ${selected === pair.itemId ? "selected" : ""}`}
                onClick={() => setSelected(pair.itemId)}
              >
                <span lang="ko">{pair.left}</span>
                {matches[pair.itemId] && (
                  <small>
                    {
                      e.pairs!.find((p) => p.itemId === matches[pair.itemId])
                        ?.right
                    }
                  </small>
                )}
              </button>
            ))}
          </div>
          <div>
            {shuffled(e.pairs, `${seed}-right`).map((pair) => (
              <button
                type="button"
                key={pair.itemId}
                disabled={disabled || !selected}
                className="match-sound"
                onClick={() => {
                  setAnswer({ ...matches, [selected!]: pair.itemId });
                  setSelected(null);
                }}
              >
                {pair.right}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (e.type === "build-syllable") {
    const value = typeof answer === "string" ? {} : answer;
    const block = composeBlock(value.onset ?? "", value.vowel ?? "");
    return (
      <div className="block-builder">
        <output className="built-block" aria-label="Your syllable" lang="ko">
          {block || "□"}
        </output>
        {(
          [
            ["onset", "Choose a consonant", e.onsets],
            ["vowel", "Choose a vowel", e.vowels],
          ] as const
        ).map(([key, label, letters]) => (
          <fieldset key={key}>
            <legend>{label}</legend>
            <div className="letter-buttons">
              {letters?.map((ko) => (
                <button
                  type="button"
                  lang="ko"
                  key={ko}
                  disabled={disabled}
                  aria-pressed={value[key] === ko}
                  onClick={() => setAnswer({ ...value, [key]: ko })}
                >
                  {ko}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    );
  }
  return (
    <form
      className="typing-answer"
      onSubmit={(event) => {
        event.preventDefault();
        if (!composing.current && !disabled) onSubmit();
      }}
    >
      <label htmlFor="answer">
        {e.input === "Hangul"
          ? "Your answer in Hangul"
          : "Your sound guide in romanization"}
      </label>
      <input
        id="answer"
        name="answer"
        lang={e.input === "Hangul" ? "ko" : "en"}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        value={typeof answer === "string" ? answer : ""}
        disabled={disabled}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
        }}
        onChange={(event) => setAnswer(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            (event.nativeEvent.isComposing ||
              composing.current ||
              event.keyCode === 229)
          )
            event.preventDefault();
        }}
      />
      {e.input === "Hangul" ? (
        <details className="tap-keyboard">
          <summary>
            <Keyboard size={17} /> Use the tap keyboard
          </summary>
          <p>
            Choose the starting consonant, then a vowel to enter a block. This
            is the same spelling task.
          </p>
          <div className="letter-buttons">
            {characters
              .filter((i) => i.kind === "consonant")
              .map((i) => (
                <button
                  type="button"
                  key={i.id}
                  lang="ko"
                  aria-pressed={tapOnset === i.ko}
                  disabled={disabled}
                  onClick={() => setTapOnset(i.ko)}
                >
                  {i.ko}
                </button>
              ))}
          </div>
          <div className="letter-buttons">
            {characters
              .filter((i) => i.kind === "vowel")
              .map((i) => (
                <button
                  type="button"
                  key={i.id}
                  lang="ko"
                  disabled={disabled || !tapOnset}
                  onClick={() => {
                    setAnswer(composeBlock(tapOnset, i.ko));
                    setTapOnset("");
                  }}
                >
                  {i.ko}
                </button>
              ))}
          </div>
        </details>
      ) : (
        <p className="input-note">
          Use English letters for the taught sound label. Hangul spelling is a
          different task.
        </p>
      )}
    </form>
  );
}
export function ReviewPage({
  progress,
  update,
}: {
  progress: LearnerProgress;
  update: Update;
}) {
  const [finished, setFinished] = useState(false);
  const queue = reviewQueue(progress),
    due = queue.filter((q) => q.due);
  if (progress.session?.kind === "review")
    return (
      <PracticePlayer
        progress={progress}
        update={update}
        session={progress.session}
        title="A little review"
        onFinish={() => setFinished(true)}
      />
    );
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">A LITTLE SPACE, A STRONGER MEMORY</span>
        <h1>
          {finished ? "Good to hear them again." : "Keep your sounds familiar."}
        </h1>
        <p>
          {due.length
            ? `${due.length} items are ready for review. Weak sounds come back sooner.`
            : queue.length
              ? "Nothing is due yet. You can still practice any learned sound."
              : "Your first lesson will give you something to return to."}
        </p>
      </div>
      <section className="card review-start">
        <RotateCcw size={25} />
        <h2>
          {queue.length
            ? "A few minutes to make it stick."
            : "Start with a sound."}
        </h2>
        <p>
          Wrong answers return after about 10 minutes. Supported practice
          returns after an hour. Independent recall earns a longer gap. Mastery
          needs varied recall after time has passed.
        </p>
        {queue.length ? (
          <button
            type="button"
            className="primary"
            onClick={() => {
              setFinished(false);
              update((p) => ({ ...p, session: makeSession(p, null) }));
            }}
          >
            Practice {Math.min(8, queue.length)} learned items{" "}
            <ArrowRight size={16} />
          </button>
        ) : (
          <a className="primary" href="#/lesson/u1-day-01">
            Meet Hangul <ArrowRight size={16} />
          </a>
        )}
        {progress.session && (
          <p className="phase-note">
            Starting review replaces the current saved practice session.
          </p>
        )}
      </section>
      <div className="review-list">
        {queue.map(({ itemId, due, weakness }) => {
          const item = itemById[itemId],
            state = progress.mastery[itemId];
          return (
            <section className="card review-item" key={itemId}>
              <strong lang="ko">
                {item.profileTemplate
                  ? personalText(item.profileTemplate, progress.profile)
                  : item.ko}
              </strong>
              <div>
                <h3>{state?.level ?? "new"}</h3>
                <p>
                  {due
                    ? "Ready now"
                    : `Next: ${new Date(state!.nextReviewAt!).toLocaleString()}`}
                  {weakness >= 10 ? " · Recent mistakes: extra practice" : ""}
                </p>
                <small>
                  {state?.correctAttempts ?? 0} correct ·{" "}
                  {state?.incorrectAttempts ?? 0} incorrect ·{" "}
                  {state?.hintedAttempts ?? 0} supported
                </small>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
