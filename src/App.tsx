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
  Flame,
  Lock,
} from "lucide-react";
import {
  characters,
  itemById,
  lessonById,
  lessons,
  soundGroups,
  soundId,
  units,
  futureUnits,
} from "./curriculum";
import {
  hangulProgress,
  isUnlocked,
  localProgressRepository,
  nextLesson,
} from "./progress";
import { parseRoute, savedRoute, type Route } from "./navigation";
import type { LearnerProfile, LearnerProgress, Lesson } from "./types";
import { Miguel } from "./components/Miguel";
import { Seoul } from "./components/Seoul";
import { Listen } from "./components/Listen";
import { visibleStreak, localPracticeDate } from "./streak";
import { LessonView, ReviewPage } from "./components/LessonPlayer";
import { learnedItemIds, reviewQueue } from "./learning";

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
    ? "Lesson"
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
          <Miguel className="brand-puppy" />
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
          <span className="phase-tag">Unit 1 · Ready to learn</span>
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
            <LessonView
              key={selected.id}
              lesson={selected}
              progress={progress}
              update={update}
            />
          ) : route.page === "learn" ? (
            <LearningPath progress={progress} />
          ) : route.page === "hangul" ? (
            <Hangul progress={progress} />
          ) : route.page === "review" ? (
            <ReviewPage progress={progress} update={update} />
          ) : (
            <Profile progress={progress} update={update} />
          )}
        </main>
        <footer>
          <span>
            Nay Tutor <span className="footer-dot">·</span> One sound at a time.
          </span>
          <span>14 short lessons · Learn at your pace</span>
        </footer>
      </div>
    </div>
  );
}

function LearningPath({ progress }: { progress: LearnerProgress }) {
  const [, setDay] = useState(() => localPracticeDate());
  useEffect(() => {
    const timer = setInterval(() => setDay(localPracticeDate()), 60000);
    return () => clearInterval(timer);
  }, []);
  const next = nextLesson(progress);
  const sounds = hangulProgress(progress);
  const completed = lessons.filter((l) =>
    progress.completedLessonIds.includes(l.id),
  ).length;
  return (
    <>
      <section className="hero">
        <span
          className="practice-streak"
          aria-label={`${visibleStreak(progress.streak)} day practice streak`}
          title="Daily practice"
        >
          <Flame size={15} aria-hidden="true" />
          {visibleStreak(progress.streak)}
        </span>
        <Seoul />
        <div className="hero-content">
          <span className="location">
            <MapPin size={14} /> A LITTLE CLOSER TO SEOUL{" "}
            <span lang="ko">서울</span>
          </span>
          <p className="welcome">Hi, {progress.profile.learner.name}!</p>
          <h1>
            Ready for some Korean?
          </h1>
          <p>
            One sound at a time, with Miguel by your side.
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
        <div className="hero-miguel"><Miguel /><span>MIGUEL · YOUR PRACTICE PAL</span></div>
      </section>
      <section className="next-card">
        <span className="next-icon">
          <BookOpen size={25} />
        </span>
        <div className="next-copy">
          <span className="eyebrow">
            {completed ? "YOUR NEXT STEP" : "LET’S START HERE"}{" "}
            <span>· UNIT {next?.unitId.split("-")[1] ?? "1"}</span>
          </span>
          <h2>{next?.title ?? "Unit 1 complete"}</h2>
          <p>
            {next
              ? "Listen, notice, and practice one small step."
              : "Keep your learned sounds familiar with review."}
          </p>
        </div>
        <a className="primary" href={next ? `#/lesson/${next.id}` : "#/review"}>
          {next
            ? progress.session?.lessonId === next.id
              ? "Resume lesson"
              : "Open lesson"
            : "Open review"}
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
              Unit 1 · {completed} / {lessons.length} lessons complete
            </span>
          </div>
          <div className="unit-list">
            {units.map((unit) => (
              <UnitCard key={unit.id} unitId={unit.id} progress={progress} />
            ))}
            {futureUnits.map((unit) => (
              <section className="unit-card future-unit" key={unit.number}>
                <span className="unit-number">
                  {String(unit.number).padStart(2, "0")}
                </span>
                <div className="unit-copy">
                  <span className="eyebrow">
                    UNIT {unit.number} · COMING SOON
                  </span>
                  <h3>{unit.title}</h3>
                  <p>{unit.description}</p>
                </div>
                <Lock size={18} aria-label="Coming soon, locked" />
              </section>
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
        <Miguel mood="review" className="review-miguel" />
            <span className="review-icon">
              <RotateCcw size={21} />
            </span>
            <h3>Make it stick.</h3>
            <p>
              {reviewQueue(progress).filter((q) => q.due).length} items are
              ready. Practice your learned sounds any time.
            </p>
            <a href="#/review" className="text-link">
              Visit review <ArrowRight size={15} />
            </a>
            <span className="quiet-tag">Weak sounds return sooner</span>
          </section>
          <section className="journey-stats">
            <div>
              <strong>{completed}</strong>
              <span>lessons completed</span>
            </div>
            <div>
              <strong>{sounds.mastered}</strong>
              <span>letters remembered</span>
            </div>
          </section>
          <p className="phase-note">
            One lesson a day is a gentle two-week path. Move at your pace; there
            are no calendar locks.
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
          const available = isUnlocked(id, progress);
          return (
            <a
              className={`lesson-row ${available ? "" : "locked"}`}
              key={id}
              href={available ? `#/lesson/${id}` : undefined}
              aria-disabled={!available}
              onClick={(event) => {
                if (!available) event.preventDefault();
              }}
            >
              <span className={`lesson-number ${done ? "complete" : ""}`}>
                {done ? <Check size={16} /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className="lesson-copy">
                <strong>{lesson.title}</strong>
                <small>
                  {done
                    ? "Completed"
                    : isUnlocked(id, progress)
                      ? "Ready to practice"
                      : "Complete the previous lesson"}{" "}
                </small>
              </span>
              <span className="duration">{lesson.minutes} min</span>
              {available ? <ArrowRight size={16} /> : <Lock size={15} />}
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
function Hangul({ progress }: { progress: LearnerProgress }) {
  const summary = hangulProgress(progress);
  const learned = learnedItemIds(progress);
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
          <h2>Your first three vowels.</h2>
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
      <a className="primary" href="#/lesson/u1-day-01">
        Open the first lesson <ArrowRight size={17} />
      </a>
      <div className="section-heading later-heading">
        <h2>Further along the path</h2>
        <span className="subtle">Open one group at a time</span>
      </div>
      <div className="sound-groups">
        {soundGroups
          .slice(1)
          .filter((group) =>
            Array.from(group.letters).some((ko) => learned.has(soundId(ko))),
          )
          .map((group) => (
            <details className="card" key={group.title}>
              <summary>
                <span>
                  <strong>{group.title}</strong>
                  <small>{"Introduced through Unit 1 practice."}</small>
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
        Listen to the Korean examples. If audio is unavailable, use the written
        help in your lesson.
      </p>
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
        description="Set up the people and little details that make your family practice familiar."
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
          your family or edit them here. Family phrases use these names; they
          are guided whole-phrase practice.
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
          <span>Sound help in examples</span>
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
          reading checks keep sound guides hidden until you request a hint or
          submit.
        </p>
      </section>
      <section className="card settings-section">
        <h2>When it’s time to type</h2>
        <p>
          Hangul typing starts after keyboard orientation in Lesson 11. You can
          explore the course without a Korean keyboard.
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
          Your names, settings, lesson position, and learning history stay in
          this browser on this device when local storage is available. This
          version has no account or cloud sync. Clearing browser data removes
          local progress.
        </p>
        <span className="quiet-tag">Independent Nay Tutor storage</span>
      </section>
    </>
  );
}
