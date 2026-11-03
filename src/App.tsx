import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Headphones,
  MapPin,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Volume2,
} from "lucide-react";
import {
  characters,
  itemById,
  lessonById,
  lessons,
  soundGroups,
  soundId,
  units,
} from "./curriculum";
import {
  hangulProgress,
  isUnlocked,
  localProgressRepository,
  nextLesson,
} from "./progress";
import { parseRoute, savedRoute, type Route } from "./navigation";
import type { LearnerProfile, LearnerProgress, Lesson } from "./types";
import { Seoul } from "./components/Seoul";
import { Listen } from "./components/Listen";

const repository = localProgressRepository(() => window.localStorage);
const nav = [
  { id: "learn", label: "Learning path", Icon: BookOpen },
  { id: "hangul", label: "Hangul sounds", Icon: Volume2 },
  { id: "review", label: "Review", Icon: RotateCcw },
  { id: "settings", label: "Your settings", Icon: Settings },
] as const;
export default function App() {
  const [loaded] = useState(() => repository.load());
  const [progress, setProgress] = useState(loaded.progress);
  const [warning, setWarning] = useState(loaded.warning);
  const [route, setRoute] = useState<Route>(
    () =>
      parseRoute(window.location.hash) ??
      (window.location.hash
        ? { page: "learn", lessonId: null }
        : savedRoute(loaded.progress)),
  );
  const previous = useRef(progress);
  const main = useRef<HTMLElement>(null);
  const initial = useRef(true);
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#main") return;
      const next = parseRoute(window.location.hash) ?? {
        page: "learn" as const,
        lessonId: null,
      };
      setRoute(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (previous.current === progress) return;
    previous.current = progress;
    setWarning(
      repository.save(progress)
        ? null
        : "Your changes could not be saved. This browser may be blocking storage or be out of space. Keep this tab open to retain this session.",
    );
  }, [progress]);
  useEffect(() => {
    setProgress((p) => {
      if (
        p.navigation.page === route.page &&
        p.navigation.previewLessonId === route.lessonId
      )
        return p;
      return {
        ...p,
        navigation: { page: route.page, previewLessonId: route.lessonId },
        updatedAt: new Date().toISOString(),
      };
    });
    if (initial.current) {
      initial.current = false;
    } else {
      main.current?.focus();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [route]);
  function update(fn: (p: LearnerProgress) => LearnerProgress) {
    setProgress((p) => ({ ...fn(p), updatedAt: new Date().toISOString() }));
  }
  const selected = route.lessonId ? lessonById[route.lessonId] : null;
  const title = selected
    ? "Lesson preview"
    : nav.find((n) => n.id === route.page)!.label;
  return (
    <div className="app">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
          main.current?.scrollIntoView({ block: "start" });
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <a href="#/learn" className="brand" aria-label="Nay Tutor home">
          <span className="brand-mark" lang="ko">
            나
          </span>
          <span>
            Nay Tutor<small>KOREAN, AT YOUR PACE</small>
          </span>
        </a>
        <div className="course-label">YOUR SPACE TO LEARN</div>
        <nav aria-label="Main navigation">
          {nav.map(({ id, label, Icon }) => (
            <a
              key={id}
              href={`#/${id}`}
              className={route.page === id ? "nav-link active" : "nav-link"}
              aria-current={route.page === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "learn" && <span className="nav-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="mini-sign">
            서울 <ArrowRight size={16} />
          </span>
          <h3>
            A little Korean.
            <br />A little more connection.
          </h3>
          <p>From your first sound to everyday family conversations.</p>
        </div>
        <a className="learner" href="#/settings">
          <span className="avatar">
            {progress.profile.learner.name.slice(0, 1)}
          </span>
          <span>
            {progress.profile.learner.name}
            <small>
              <span className="save-dot" />
              On this device
            </small>
          </span>
          <SlidersHorizontal size={16} />
        </a>
      </aside>
      <div className="shell">
        <header className="topbar">
          <span className="breadcrumb">
            Your Korean journey <span>/</span> <strong>{title}</strong>
          </span>
          <span className="phase-tag">Foundation preview</span>
          <a href="#/settings" className="mobile-brand">
            Nay Tutor{" "}
            <span className="avatar">
              {progress.profile.learner.name.slice(0, 1)}
            </span>
          </a>
        </header>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {nav.map(({ id, label, Icon }) => (
            <a
              key={id}
              href={`#/${id}`}
              aria-current={route.page === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>
                {id === "learn"
                  ? "Learn"
                  : id === "hangul"
                    ? "Sounds"
                    : id === "settings"
                      ? "Settings"
                      : label}
              </span>
            </a>
          ))}
        </nav>
        {warning && (
          <div role="alert" className="storage-warning">
            {warning}
          </div>
        )}
        <main id="main" ref={main} tabIndex={-1}>
          {selected ? (
            <LessonPreview lesson={selected} progress={progress} />
          ) : route.page === "learn" ? (
            <LearningPath progress={progress} />
          ) : route.page === "hangul" ? (
            <Hangul progress={progress} />
          ) : route.page === "review" ? (
            <Review progress={progress} />
          ) : (
            <Profile progress={progress} update={update} />
          )}
        </main>
        <footer>
          <span>
            Nay Tutor <span className="footer-dot">·</span> One sound at a time.
          </span>
          <span>Phase 1 · Course plan & personal setup</span>
        </footer>
      </div>
    </div>
  );
}

function LearningPath({ progress }: { progress: LearnerProgress }) {
  const next = nextLesson(progress);
  const sounds = hangulProgress(progress);
  const completed = progress.completedLessonIds.length;
  return (
    <>
      <section className="hero">
        <Seoul />
        <div className="hero-content">
          <span className="location">
            <MapPin size={14} /> A LITTLE CLOSER TO SEOUL{" "}
            <span lang="ko">서울</span>
          </span>
          <p className="welcome">Welcome, {progress.profile.learner.name}.</p>
          <h1>
            Your Korean starts
            <br />
            with a sound.
          </h1>
          <p>
            A few minutes. A few new sounds.
            <br />A language that starts to feel familiar.
          </p>
          <div className="hero-meta">
            <span>
              <Clock size={15} /> 3–5 minute lessons
            </span>
            <span>
              <Headphones size={15} /> Listen. Notice. Remember.
            </span>
          </div>
        </div>
        <div className="hero-letter" aria-hidden="true">
          <span>YOUR FIRST SOUND</span>
          <strong lang="ko">ㅏ</strong>
          <small>One small beginning.</small>
        </div>
      </section>
      <section className="next-card">
        <span className="next-icon">
          <BookOpen size={25} />
        </span>
        <div className="next-copy">
          <span className="eyebrow">
            {completed ? "YOUR NEXT STEP" : "LET’S START HERE"}{" "}
            <span>· UNIT {next?.unitId.split("-")[1] ?? "8"}</span>
          </span>
          <h2>{next?.title ?? "Your course plan"}</h2>
          <p>
            {next
              ? "Meet the lesson before the practice begins."
              : "Revisit any lesson outline below."}
          </p>
        </div>
        <a className="primary" href={next ? `#/lesson/${next.id}` : "#/review"}>
          {next ? "Explore lesson" : "Open review"}
          <ArrowRight size={17} />
        </a>
      </section>
      <div className="content-grid">
        <section className="path-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SMALL STEPS, REAL PROGRESS</span>
              <h2>Your learning path</h2>
            </div>
            <span className="subtle">
              8 units · {lessons.length} lessons planned
            </span>
          </div>
          <div className="unit-list">
            {units.map((unit) => (
              <UnitCard key={unit.id} unitId={unit.id} progress={progress} />
            ))}
          </div>
        </section>
        <aside className="right-column">
          <section className="card sound-progress">
            <span className="eyebrow">YOUR HANGUL FOUNDATION</span>
            <div
              className="progress-ring"
              style={
                {
                  "--progress": `${(sounds.practiced / sounds.total) * 100}%`,
                } as React.CSSProperties
              }
            >
              <div>
                <strong>
                  {sounds.practiced}
                  <small>/ {sounds.total}</small>
                </strong>
                <span>letters practiced</span>
              </div>
            </div>
            <h3>Sound by sound.</h3>
            <p>
              Start with a small group. Build confidence before adding more.
            </p>
            <a href="#/hangul" className="text-link">
              Meet your first sounds <ArrowRight size={15} />
            </a>
          </section>
          <section className="card review-card">
            <span className="review-icon">
              <RotateCcw size={21} />
            </span>
            <h3>Make it stick.</h3>
            <p>
              Your review space will bring familiar sounds back at the right
              time.
            </p>
            <a href="#/review" className="text-link">
              Visit review <ArrowRight size={15} />
            </a>
            <span className="quiet-tag">Review engine in Phase 3</span>
          </section>
          <section className="journey-stats">
            <div>
              <strong>{completed}</strong>
              <span>lessons completed</span>
            </div>
            <div>
              <strong>{sounds.mastered}</strong>
              <span>letters mastered</span>
            </div>
          </section>
          <p className="phase-note">
            You’re exploring the course foundation. Interactive lessons arrive
            in Phase 2. Browsing doesn’t mark anything as learned.
          </p>
        </aside>
      </div>
    </>
  );
}
function UnitCard({
  unitId,
  progress,
}: {
  unitId: string;
  progress: LearnerProgress;
}) {
  const unit = units.find((u) => u.id === unitId)!;
  const next = nextLesson(progress);
  const current = next?.unitId === unit.id;
  const completed = unit.lessonIds.filter((id) =>
    progress.completedLessonIds.includes(id),
  ).length;
  return (
    <details
      className={`unit-card ${current ? "current" : ""}`}
      open={unit.number === 1 ? true : undefined}
    >
      <summary>
        <span className="unit-number">
          {String(unit.number).padStart(2, "0")}
        </span>
        <span className="unit-copy">
          <span className="eyebrow">
            UNIT {unit.number}
            {current && <span className="current-label">START HERE</span>}
          </span>
          <h3>{unit.title}</h3>
          <p>{unit.subtitle}</p>
        </span>
        <span className="unit-count">
          {completed}/{unit.lessonIds.length}
        </span>
        <ChevronDown className="chevron" size={18} />
      </summary>
      <div className="lesson-list">
        {unit.lessonIds.map((id, i) => {
          const lesson = lessonById[id];
          const done = progress.completedLessonIds.includes(id);
          return (
            <a className="lesson-row" key={id} href={`#/lesson/${id}`}>
              <span className={`lesson-number ${done ? "complete" : ""}`}>
                {done ? <Check size={16} /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className="lesson-copy">
                <strong>{lesson.title}</strong>
                <small>
                  {done
                    ? "Completed"
                    : isUnlocked(id, progress)
                      ? "Next in your course"
                      : "Later in your course"}{" "}
                  · Preview available
                </small>
              </span>
              <span className="duration">{lesson.minutes} min</span>
              <ArrowRight size={16} />
            </a>
          );
        })}
        <p className="unit-outcome">{unit.outcome}</p>
      </div>
    </details>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
function LessonPreview({
  lesson,
  progress,
}: {
  lesson: Lesson;
  progress: LearnerProgress;
}) {
  const unit = units.find((u) => u.id === lesson.unitId)!;
  const available = isUnlocked(lesson.id, progress);
  return (
    <div className="preview-page">
      <a className="text-link back" href="#/learn">
        <ArrowLeft size={17} /> Back to your path
      </a>
      <PageHeading
        eyebrow={`UNIT ${unit.number} · LESSON ${unit.lessonIds.indexOf(lesson.id) + 1} · ${lesson.minutes} MINUTES PLANNED`}
        title={lesson.title}
        description={lesson.objective}
      />
      <div className="preview-notice">
        <span className="quiet-tag">Lesson preview</span>
        <p>
          The outline is ready. Interactive practice for this lesson is planned
          for Phase {lesson.implementationPhase}. No progress is awarded for
          this preview.
        </p>
      </div>
      <section className="card teaching">
        <span className="eyebrow">THE IDEA</span>
        <h2>One thing to notice.</h2>
        <p>{lesson.explanation}</p>
        {lesson.examples.map((example) => (
          <div key={example.ko} className="example">
            <span lang="ko" className="example-korean">
              {example.ko}
            </span>
            <strong>{example.meaning}</strong>
            <Listen content={example.audio} />
            <p>{example.note}</p>
          </div>
        ))}
      </section>
      <section className="card">
        <span className="eyebrow">WHAT YOU’LL MEET</span>
        <div className="item-chips">
          {lesson.newItemIds.map((id) => (
            <span key={id}>
              <strong lang="ko">{itemById[id].ko}</strong>
              <small>{itemById[id].kind}</small>
            </span>
          ))}
        </div>
      </section>
      <div className="preview-grid">
        <section className="card">
          <h2>Before this lesson</h2>
          {lesson.prerequisites.length ? (
            <>
              <p>
                {available
                  ? "You have the required lesson completion."
                  : "Complete this lesson first when practice is available:"}
              </p>
              {lesson.prerequisites.map((id) => (
                <a key={id} className="text-link" href={`#/lesson/${id}`}>
                  {lessonById[id].title} <ArrowRight size={15} />
                </a>
              ))}
            </>
          ) : (
            <p>No prior Korean needed. This is your starting point.</p>
          )}
        </section>
        <section className="card">
          <h2>We’ll revisit</h2>
          <p>
            {lesson.reviewItemIds.length
              ? lesson.reviewItemIds.map((id) => itemById[id].ko).join(" · ")
              : "These first sounds will return in future lessons."}
          </p>
          <small>
            Review is part of learning, not a separate test to pass.
          </small>
        </section>
      </div>
      <section className="card">
        <h2>Planned practice</h2>
        <ol className="practice-outline">
          {lesson.exercises.map((e) => (
            <li key={e.id}>
              <strong>{e.type.replaceAll("-", " ")}</strong>
              <span>{e.objective}</span>
            </li>
          ))}
        </ol>
        <p className="subtle">
          These are curriculum outlines. Answer controls, hints, grading, and
          lesson completion are added with the exercise engine.
        </p>
      </section>
      <a href="#/learn" className="primary">
        Return to learning path <ArrowRight size={17} />
      </a>
    </div>
  );
}
function Hangul({ progress }: { progress: LearnerProgress }) {
  const summary = hangulProgress(progress);
  return (
    <>
      <PageHeading
        eyebrow="LETTERS BECOME SOUNDS"
        title="A small place to start."
        description="You don’t need the whole alphabet today. Meet your first group, then add more when you’re ready."
      />
      <section className="sound-intro">
        <div>
          <span className="eyebrow">FIRST GROUP · UNIT 1</span>
          <h2>Two vowels. One silent helper.</h2>
          <p>
            These are reference cards, not a quiz. Listening here doesn’t count
            as practice.
          </p>
        </div>
        <span className="sound-counter">
          {summary.practiced} / {characters.length} practiced
        </span>
      </section>
      <div className="sound-cards">
        {Array.from(soundGroups[0].letters).map((ko) => {
          const item = itemById[soundId(ko)];
          return (
            <section className="card sound-card" key={ko}>
              <span lang="ko" className="large-character">
                {ko}
              </span>
              <span className="quiet-tag">{item.kind}</span>
              <h3>{item.meaning}</h3>
              <Listen content={item.audio} />
              <p>{item.audio.note}</p>
            </section>
          );
        })}
      </div>
      <a className="primary" href="#/lesson/u1-l1">
        Explore the first lesson <ArrowRight size={17} />
      </a>
      <div className="section-heading later-heading">
        <h2>Further along the path</h2>
        <span className="subtle">Open one group at a time</span>
      </div>
      <div className="sound-groups">
        {soundGroups.slice(1).map((group) => (
          <details className="card" key={group.title}>
            <summary>
              <span>
                <strong>{group.title}</strong>
                <small>{group.description}</small>
              </span>
              <ChevronDown size={18} />
            </summary>
            <div className="letter-reference">
              {Array.from(group.letters).map((ko) => (
                <div key={ko}>
                  <strong lang="ko">{ko}</strong>
                  <span>{itemById[soundId(ko)].meaning}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
      <p className="phase-note">
        Consonants are heard in carefully chosen syllables. Browser voices vary;
        isolated consonant phonemes are not guaranteed. No pronunciation
        assessment is performed.
      </p>
    </>
  );
}
function Review({ progress }: { progress: LearnerProgress }) {
  const practiced = Object.keys(progress.mastery).length;
  return (
    <>
      <PageHeading
        eyebrow="GIVE YOUR MEMORY A LITTLE SPACE"
        title="Familiar, then unforgettable."
        description="A place to return to the sounds and words that need another listen."
      />
      <section className="card empty-state">
        <div className="empty-illustration">
          <RotateCcw size={34} />
          <span lang="ko">아</span>
        </div>
        <span className="eyebrow">YOUR REVIEW SPACE</span>
        <h2>
          {practiced
            ? "Your review history is saved."
            : "Your first review starts with a lesson."}
        </h2>
        <p>
          Spaced repetition and weak-sound practice arrive in Phase 3. This
          foundation stores progress separately for letters, syllables, words,
          and phrases.
        </p>
        <a href="#/learn" className="primary">
          Explore your learning path <ArrowRight size={16} />
        </a>
      </section>
      <div className="review-principles">
        <section>
          <span>01</span>
          <h3>Notice what’s tricky.</h3>
          <p>Mistakes will guide what comes back sooner.</p>
        </section>
        <section>
          <span>02</span>
          <h3>Leave a little space.</h3>
          <p>Confident answers will earn more time between reviews.</p>
        </section>
        <section>
          <span>03</span>
          <h3>Keep moving forward.</h3>
          <p>No hearts, streaks, or points. Just practice.</p>
        </section>
      </div>
    </>
  );
}
function Profile({
  progress,
  update,
}: {
  progress: LearnerProgress;
  update: (fn: (p: LearnerProgress) => LearnerProgress) => void;
}) {
  const [draft, setDraft] = useState<LearnerProfile>(() =>
    structuredClone(progress.profile),
  );
  const [saved, setSaved] = useState(false);
  function field(
    person: keyof Omit<LearnerProfile, "spellingsConfirmed">,
    key: "name" | "koreanName",
    value: string,
  ) {
    setSaved(false);
    setDraft((d) => ({
      ...d,
      [person]: { ...d[person], [key]: value },
      spellingsConfirmed: false,
    }));
  }
  return (
    <>
      <PageHeading
        eyebrow="A COURSE THAT FEELS LIKE YOURS"
        title="Your names. Your pace."
        description="Set up the people and little details that will make future practice familiar."
      />
      <form
        className="card profile-form"
        onSubmit={(e) => {
          e.preventDefault();
          const profile = structuredClone(draft);
          (["learner", "brother", "dog"] as const).forEach((k) => {
            profile[k].name = profile[k].name.trim();
            profile[k].koreanName = profile[k].koreanName
              .trim()
              .normalize("NFC");
          });
          if (
            Object.values(profile).some(
              (p) => typeof p === "object" && (!p.name || !p.koreanName),
            )
          )
            return;
          update((p) => ({ ...p, profile }));
          setDraft(profile);
          setSaved(true);
        }}
      >
        <h2>Your family circle</h2>
        <p>
          The Korean spellings below are proposed defaults. Confirm them with
          your family or edit them here. Fixed reading examples retain their
          labeled course spelling.
        </p>
        {(
          [
            ["learner", "You"],
            ["brother", "Your brother"],
            ["dog", "Your dog"],
          ] as const
        ).map(([key, label]) => (
          <fieldset key={key}>
            <legend>{label}</legend>
            <div className="field-pair">
              <label>
                <span>Name</span>
                <input
                  name={`${key}-name`}
                  required
                  maxLength={60}
                  value={draft[key].name}
                  onChange={(e) => field(key, "name", e.target.value)}
                />
              </label>
              <label>
                <span>Korean spelling</span>
                <input
                  lang="ko"
                  name={`${key}-korean`}
                  required
                  maxLength={60}
                  value={draft[key].koreanName}
                  onChange={(e) => field(key, "koreanName", e.target.value)}
                />
              </label>
            </div>
          </fieldset>
        ))}
        <label className="checkbox">
          <input
            type="checkbox"
            checked={draft.spellingsConfirmed}
            onChange={(e) => {
              setDraft((d) => ({ ...d, spellingsConfirmed: e.target.checked }));
              setSaved(false);
            }}
          />
          <span>I’ve confirmed these Korean spellings with my family.</span>
        </label>
        <button className="primary" type="submit">
          Save personal details <Check size={17} />
        </button>
        {saved && (
          <p role="status" className="saved-message">
            Details updated in this session.{" "}
            {progress.profile.spellingsConfirmed
              ? "Your spellings are marked as confirmed."
              : "Spellings remain unconfirmed."}
          </p>
        )}
      </form>
      <section className="card settings-section">
        <h2>A little reading support</h2>
        <label className="select-label">
          <span>Romanization in future lessons</span>
          <select
            value={progress.preferences.romanization}
            onChange={(e) =>
              update((p) => ({
                ...p,
                preferences: {
                  romanization: e.target
                    .value as LearnerProgress["preferences"]["romanization"],
                },
              }))
            }
          >
            <option value="early-support">
              Early support, then on request
            </option>
            <option value="on-demand">Only when I ask</option>
          </select>
        </label>
        <p>
          English letters are approximate guides. Hangul stays central, and
          reading checks will keep answers hidden until you submit.
        </p>
      </section>
      <section className="card settings-section">
        <h2>When it’s time to type</h2>
        <p>
          Typing starts after keyboard orientation in Unit 2. You can explore
          the course without a Korean keyboard.
        </p>
        <details>
          <summary>
            How to add a Korean keyboard <ChevronDown size={17} />
          </summary>
          <p>
            On iPhone: open Settings → General → Keyboard → Keyboards → Add New
            Keyboard, then choose Korean. In a text field, use the globe key to
            switch keyboards.
          </p>
          <a
            className="text-link"
            href="https://support.apple.com/guide/iphone/add-or-change-keyboards-iph73b71eb/ios"
            target="_blank"
            rel="noreferrer"
          >
            Apple’s keyboard guide <ArrowRight size={14} />
          </a>
        </details>
      </section>
      <section className="card settings-section">
        <h2>Stored here, for you.</h2>
        <p>
          Your names, settings, and last preview stay in this browser on this
          device when local storage is available. This version has no account or
          cloud sync. Clearing browser data removes local progress.
        </p>
        <span className="quiet-tag">Independent Nay Tutor storage</span>
      </section>
    </>
  );
}
