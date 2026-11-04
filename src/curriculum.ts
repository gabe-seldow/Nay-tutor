import type {
  AudioContent,
  Exercise,
  ExerciseType,
  LearningItem,
  Lesson,
  Unit,
} from "./types";
export const CURRICULUM_VERSION = 2;
export const audio = (
  text: string,
  mode: AudioContent["mode"] = "word",
  note?: string,
): AudioContent => ({ text, language: "ko-KR", mode, note });
export const soundId = (ko: string) =>
  `hangul-${ko.codePointAt(0)!.toString(16)}`;
const vowelSeeds = [
  ["ㅏ", "a", "a · open “ah”", "아"],
  ["ㅗ", "o", "o · rounded lips, no English glide", "오"],
  ["ㅣ", "i", "i · like “ee”", "이"],
  ["ㅓ", "eo", "eo · open back vowel; listen closely", "어"],
  ["ㅜ", "u", "u · rounded “oo”", "우"],
  ["ㅡ", "eu", "eu · unrounded back vowel", "으"],
];
const consonantSeeds = [
  ["ㄴ", "n-like", "나"],
  ["ㅁ", "m-like", "마"],
  ["ㄱ", "plain k/g-like, depending on position", "가"],
  ["ㄷ", "plain t/d-like, depending on position", "다"],
  ["ㅂ", "plain p/b-like, depending on position", "바"],
  ["ㅅ", "s-like in 사; changes before i/y sounds", "사"],
  ["ㅇ", "silent at the start of a block", "아"],
];
export const characters: LearningItem[] = [
  ...vowelSeeds.map(([ko, rr, meaning, text]) => ({
    id: soundId(ko),
    kind: "vowel" as const,
    ko,
    rr,
    meaning,
    audio: audio(
      text,
      "vowel-syllable",
      "Listen to the vowel. The circle is silent.",
    ),
  })),
  ...consonantSeeds.map(([ko, meaning, text]) => ({
    id: soundId(ko),
    kind: "consonant" as const,
    ko,
    meaning,
    audio: audio(
      text,
      "context-syllable",
      "Listen to the first sound in the block.",
    ),
  })),
];
// Legacy labels are retained solely to translate unfinished saved selections.
const consonantLabels: Record<string, string> = {
  ㄴ: "n",
  ㅁ: "m",
  ㄱ: "g",
  ㄷ: "d",
  ㅂ: "b",
  ㅅ: "s",
  ㅇ: "silent",
};
export const legacySoundLabels: Record<string, string> = {};
for (const item of characters) {
  item.rr ??= consonantLabels[item.ko];
  legacySoundLabels[item.meaning] = item.rr;
  item.meaning = item.rr;
  item.soundAlternatives =
    (
      {
        ㅏ: ["ah"],
        ㅣ: ["ee"],
        ㅜ: ["oo"],
        ㄱ: ["k"],
        ㄷ: ["t"],
        ㅂ: ["p"],
      } as Record<string, string[]>
    )[item.ko] ?? [];
}
const syllableSeeds = [
  ["나", "na"],
  ["너", "neo"],
  ["누", "nu"],
  ["마", "ma"],
  ["모", "mo"],
  ["가", "ga"],
  ["고", "go"],
  ["다", "da"],
  ["도", "do"],
  ["바", "ba"],
  ["보", "bo"],
  ["사", "sa"],
  ["소", "so"],
  ["아", "a"],
  ["오", "o"],
  ["이", "i"],
  ["우", "u"],
];
export const syllableId = (ko: string) =>
  `u1-block-${ko.codePointAt(0)!.toString(16)}`;
const syllables: LearningItem[] = syllableSeeds.map(([ko, rr]) => ({
  id: syllableId(ko),
  kind: "syllable",
  ko,
  rr,
  meaning: rr,
  audio: audio(ko, "context-syllable"),
}));
const phrases: LearningItem[] = [
  {
    id: "u1-phrase-yes",
    kind: "phrase",
    ko: "네",
    meaning: "Yes",
    audio: audio("네", "phrase"),
    speechLevel: "polite",
    guided: true,
  },
  {
    id: "u1-phrase-no",
    kind: "phrase",
    ko: "아니요",
    meaning: "No",
    audio: audio("아니요", "phrase"),
    speechLevel: "polite",
    guided: true,
  },
  {
    id: "u1-phrase-hi",
    kind: "phrase",
    ko: "안녕",
    meaning: "Hi (casual)",
    audio: audio("안녕", "phrase"),
    speechLevel: "casual",
    guided: true,
  },
  {
    id: "u1-phrase-hello",
    kind: "phrase",
    ko: "안녕하세요",
    meaning: "Hello (polite)",
    audio: audio("안녕하세요", "phrase"),
    speechLevel: "polite",
    guided: true,
  },
  {
    id: "u1-phrase-miguel",
    kind: "phrase",
    ko: "미겔 어디 있어요?",
    meaning: "Where is Miguel?",
    audio: audio("미겔 어디 있어요?", "phrase"),
    speechLevel: "polite",
    guided: true,
    profileTemplate: "{dog} 어디 있어요?",
  },
  {
    id: "u1-phrase-jaehun",
    kind: "phrase",
    ko: "재훈은 뭐 해요?",
    meaning: "What is Jaehun doing?",
    audio: audio("재훈은 뭐 해요?", "phrase"),
    speechLevel: "polite",
    guided: true,
    profileTemplate: "{brotherTopic} 뭐 해요?",
  },
];
export const items: LearningItem[] = [...characters, ...syllables, ...phrases];
export const itemById: Record<string, LearningItem> = Object.fromEntries(
  items.map((i) => [i.id, i]),
);
export const futureUnits = [
  {
    number: 2,
    title: "Reading Hangul",
    description: "More letters and confident block reading.",
  },
  {
    number: 3,
    title: "More sounds & short words",
    description: "Breath, tension, and your next useful words.",
  },
  {
    number: 4,
    title: "Final consonants",
    description: "Discover the sound at the bottom.",
  },
  {
    number: 5,
    title: "Everyday family Korean",
    description: "Greetings, feelings, and everyday kindness.",
  },
  {
    number: 6,
    title: "Questions & answers",
    description: "Ask a little. Understand a little more.",
  },
  {
    number: 7,
    title: "Daily routines",
    description: "Talk about the shape of your day.",
  },
  {
    number: 8,
    title: "Simple family conversations",
    description: "Bring your Korean into short exchanges.",
  },
];
type Spec = {
  title: string;
  objective: string;
  explanation: string;
  letters?: string;
  blocks?: string[];
  phraseIds?: string[];
  review?: string;
  examples: [string, string, string][];
  keyboardIntro?: boolean;
  weakReview?: boolean;
};
const specs: Spec[] = [
  {
    title: "Meet Hangul",
    objective: "Recognize ㅏ, ㅗ and ㅣ and recall their sound labels.",
    letters: "ㅏㅗㅣ",
    explanation:
      "Hangul is the Korean alphabet. Start with just three vowels. Audio reads 아, 오 and 이: each vowel sits in a block with a silent circle holder. You only need to identify the vowel today; we will study the circle in Lesson 10. Romanization is a temporary sound label, not Korean spelling.",
    examples: [
      [
        "아 · 오 · 이",
        "a · o · i",
        "ㅏ points right. ㅗ points up. ㅣ is a straight vertical line.",
      ],
    ],
  },
  {
    title: "More vowels",
    objective: "Distinguish ㅓ, ㅜ and ㅡ from the first three vowels.",
    letters: "ㅓㅜㅡ",
    review: "ㅏㅗㅣ",
    explanation:
      "ㅓ has a short stroke pointing left; ㅜ points down; ㅡ is horizontal. eo and eu are labels for Korean vowels, not English words. Compare 어/오 and 우/으 carefully. Use your ears alongside the written shapes.",
    examples: [
      [
        "어 · 우 · 으",
        "eo · u · eu",
        "For ㅡ, keep the lips unrounded. Revisit ㅓ and ㅗ without treating them as the same sound.",
      ],
    ],
  },
  {
    title: "First consonants",
    objective: "Recognize ㄴ and ㅁ at the start of a syllable.",
    letters: "ㄴㅁ",
    review: "ㅏㅜ",
    explanation:
      "ㄴ starts 나 with an n-like sound. ㅁ starts 마 with an m-like sound. The Listen button reads the full syllable. Focus on its beginning; we are not claiming that a browser can speak isolated consonant phonemes reliably.",
    examples: [
      [
        "나 · 마",
        "na · ma",
        "Both examples use ㅏ. Notice only the beginning for now.",
      ],
    ],
  },
  {
    title: "Your first syllables",
    objective: "Read and build 나, 너, 누, 마 and 모.",
    blocks: ["나", "너", "누", "마", "모"],
    review: "ㄴㅁㅏㅓㅜㅗ",
    explanation:
      "A block combines sounds into one syllable. Put a vertical vowel to the right: ㄴ + ㅏ = 나. Put a horizontal vowel underneath: ㅁ + ㅗ = 모. Each block is one syllable. First read, then tap a consonant and vowel to build a block.",
    examples: [
      [
        "나 · 너 · 누 · 마 · 모",
        "na · neo · nu · ma · mo",
        "These are sound blocks, not a vocabulary translation test.",
      ],
    ],
  },
  {
    title: "Two more consonants",
    objective: "Recognize plain ㄱ and ㄷ in pronounceable examples.",
    letters: "ㄱㄷ",
    review: "ㄴㅁㅓㅗ",
    explanation:
      "ㄱ and ㄷ are plain Korean consonants. English k/g and t/d are rough guides: the sound varies with position and speaker. Listen to 가 and 다, rather than memorizing one fixed English letter. Strong breath and tense consonants come later.",
    examples: [
      [
        "가 · 다",
        "ga · da (approximate guides)",
        "The guide g does not mean ㄱ always sounds like English g.",
      ],
    ],
  },
  {
    title: "Reading practice",
    objective:
      "Read and build 가, 고, 다 and 도 while revisiting earlier blocks.",
    blocks: ["가", "고", "다", "도"],
    review: "ㄱㄷㄴㅁ",
    explanation:
      "Use the consonant first and the vowel second. 가/고 share ㄱ; 다/도 share ㄷ. Change one part at a time, then mix the blocks so the answer is not tied to a position.",
    examples: [
      [
        "가 · 고 · 다 · 도",
        "ga · go · da · do",
        "Recall the sound guide before requesting a hint.",
      ],
    ],
  },
  {
    title: "Review challenge",
    objective: "Recall the six vowels and four consonants learned so far.",
    review: "ㅏㅗㅣㅓㅜㅡㄴㅁㄱㄷ",
    weakReview: true,
    explanation:
      "No new letters today. Try recall before a hint, and listen again when two sounds feel close. Previously missed characters move to the front of this short challenge. Mistakes are useful information, not lost lives.",
    examples: [
      [
        "너 · 고",
        "neo · go",
        "Compare the vowels carefully: ㅓ and ㅗ are different.",
      ],
    ],
  },
  {
    title: "New consonants",
    objective: "Recognize and combine ㅂ and ㅅ.",
    letters: "ㅂㅅ",
    review: "ㄴㅁㄱㄷ",
    explanation:
      "ㅂ is a plain p/b-like sound in 바. ㅅ starts 사 with an s-like sound; it changes before i/y sounds, which we are not testing here. Practice the full examples without treating them as isolated consonant recordings.",
    examples: [
      [
        "바 · 사",
        "ba · sa",
        "Compare the beginning, keeping the shared ㅏ the same.",
      ],
    ],
  },
  {
    title: "More syllables",
    objective: "Read and build 바, 보, 사 and 소 with mixed earlier blocks.",
    blocks: ["바", "보", "사", "소"],
    review: "ㅂㅅㅏㅗ",
    explanation:
      "바 and 보 share ㅂ. 사 and 소 share ㅅ. Take a moment to read each block without a pronunciation guide, then check by listening. Keep these sound blocks separate from meanings of words you have not learned.",
    examples: [
      [
        "바 · 보 · 사 · 소",
        "ba · bo · sa · so",
        "Read from the consonant into the vowel.",
      ],
    ],
  },
  {
    title: "Meet ㅇ",
    objective: "Recognize silent initial ㅇ and read 아, 오, 이 and 우.",
    letters: "ㅇ",
    blocks: ["아", "오", "이", "우"],
    review: "ㅏㅗㅣㅜ",
    explanation:
      "A vowel cannot stand alone as a written syllable block. Initial ㅇ fills the consonant space silently: ㅇ + ㅏ = 아. The sound is the vowel. At the end of a block, ㅇ has a different job; final consonants are outside this unit.",
    examples: [
      [
        "아 · 오 · 이 · 우",
        "a · o · i · u",
        "Choose silent as the initial sound of ㅇ. Do not add a spoken consonant.",
      ],
    ],
  },
  {
    title: "Listen, read, type",
    objective:
      "Set up a Korean keyboard and type familiar syllables after listening.",
    review: "ㅏㅓㅗㅜㅡㅣㄴㅁㄱㄷㅂㅅㅇ",
    keyboardIntro: true,
    explanation:
      "First set up a Korean keyboard, or use the on-screen letter buttons. Copy one familiar model before listening independently. A Hangul answer needs a Korean block such as 나; a romanized sound label such as na belongs only in an explicitly labeled romanization question.",
    examples: [
      [
        "나 · 고 · 아",
        "na · go · a",
        "On the standard two-set keyboard, 나 uses s then k; 고 uses r then h. The on-screen tap keyboard also works.",
      ],
    ],
  },
  {
    title: "First useful expressions",
    objective: "Understand 네, 아니요 and 안녕 as guided whole expressions.",
    phraseIds: ["u1-phrase-yes", "u1-phrase-no", "u1-phrase-hi"],
    review: "ㅓㅗ",
    explanation:
      "네 means yes; 아니요 means no in a polite reply. 안녕 is a casual hi (or bye when parting), used with close people. Here the scene is arriving and saying hi. These expressions contain letters and endings not taught individually: learn their whole sound and meaning, not independent decoding.",
    examples: [
      [
        "네 · 아니요",
        "Yes · No",
        "Begin with affirmative questions; replies to negative questions need more context.",
      ],
      [
        "안녕",
        "Hi (casual)",
        "For close people. Polite greetings arrive next lesson. This is whole-expression exposure.",
      ],
    ],
  },
  {
    title: "Jaeyeon and family",
    objective:
      "Understand a polite hello and two short family questions with full support.",
    phraseIds: ["u1-phrase-hello", "u1-phrase-miguel", "u1-phrase-jaehun"],
    review: "ㄴㅁㅏㅗ",
    explanation:
      "안녕하세요 is a polite hello. Hear a question about where your dog is and what your brother is doing. These are guided whole phrases, not reading tests. Close siblings often use casual Korean; we start with polite forms, useful across everyday situations. Family name spellings are editable defaults, not confirmed preferences.",
    examples: [
      [
        "안녕하세요",
        "Hello (polite)",
        "Use this greeting with familiar people or people you should address politely.",
      ],
      [
        "미겔 어디 있어요?",
        "Where is Miguel?",
        "The name can change in your settings. The rest is a supported phrase.",
      ],
      [
        "재훈은 뭐 해요?",
        "What is Jaehun doing?",
        "This asks about your brother; it does not require you to address him by name.",
      ],
    ],
  },
  {
    title: "Unit 1 challenge",
    objective:
      "Bring together character recall, listening, building, typing and guided phrase meaning.",
    review: "ㅏㅗㅣㅓㅜㅡㄴㅁㄱㄷㅂㅅㅇ",
    weakReview: true,
    explanation:
      "Use the letters you know in several short tasks. Romanization stays hidden until you ask or check an answer. Phrase questions keep their full Korean model and whole-expression support. Completing the challenge is a beginning, not a claim of fluency; review remains available afterward.",
    examples: [
      [
        "나 · 도 · 우",
        "na · do · u",
        "Read, listen, and recall. A hint is always allowed and is recorded as support.",
      ],
    ],
  },
];
export const lessons: Lesson[] = [];
const c = (letters: string) => Array.from(letters).map(soundId);
const ids = (blocks: string[]) => blocks.map(syllableId);
function optionsFor(
  field: "ko" | "meaning" | "rr",
  pool: LearningItem[],
  correct: string,
) {
  const choices = pool
    .map((x) => ({ value: x[field]!, label: x[field]! }))
    .filter((x) => !!x.value);
  return [
    ...choices.filter((x) => x.value === correct),
    ...choices.filter((x) => x.value !== correct).slice(0, 3),
  ];
}
function base(
  lid: string,
  key: string,
  type: ExerciseType,
  item: LearningItem,
): Exercise {
  return {
    id: `${lid}-${key}`,
    type,
    objective: `Connect ${item.kind === "phrase" ? "the phrase and its meaning" : "the written form and its sound"}.`,
    prompt: "",
    itemIds: [item.id],
    answers: [],
    hint:
      item.kind === "phrase"
        ? `It means ${item.meaning}.`
        : `The sound is ${item.rr ?? item.meaning}.`,
    feedback: {
      correct: `${item.ko} — ${item.meaning}.`,
      incorrect: `It’s ${item.rr ?? item.meaning}.`,
    },
  };
}
function recognize(
  lid: string,
  key: string,
  id: string,
  pool: LearningItem[],
): Exercise {
  const item = itemById[id];
  return {
    ...base(
      lid,
      key,
      item.kind === "syllable" ? "syllable-reading" : "character-recognition",
      item,
    ),
    prompt:
      item.kind === "syllable" ? "Choose the sound." : "What sound is this?",
    display: item.ko,
    answers: [item.kind === "syllable" ? item.rr! : item.meaning],
    options: optionsFor(
      item.kind === "syllable" ? "rr" : "meaning",
      pool,
      item.kind === "syllable" ? item.rr! : item.meaning,
    ),
  };
}
function listen(
  lid: string,
  key: string,
  id: string,
  pool: LearningItem[],
): Exercise {
  const item = itemById[id];
  return {
    ...base(lid, key, "sound-to-character", item),
    prompt:
      item.kind === "vowel"
        ? "Listen and choose."
        : item.kind === "consonant"
          ? "Which letter starts the sound?"
          : "Listen and choose.",
    answers: [item.ko],
    options: optionsFor("ko", pool, item.ko),
    audio: item.audio,
  };
}
function recall(lid: string, key: string, id: string): Exercise {
  const item = itemById[id];
  return {
    ...base(lid, key, "type-sound", item),
    prompt: "Type the sound.",
    display: item.ko,
    answers: [item.rr!],
    input: "romanization",
    soundAlternatives: item.soundAlternatives ?? [],
  };
}
function build(lid: string, key: string, id: string): Exercise {
  const item = itemById[id];
  return {
    ...base(lid, key, "build-syllable", item),
    prompt: `Build the syllable: ${item.rr}.`,
    answers: [item.ko],
    onsets: ["ㄴ", "ㅁ", "ㄱ", "ㄷ", "ㅂ", "ㅅ", "ㅇ"],
    vowels: ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"],
  };
}
function revisit(lid: string, key: string, group: string[]): Exercise {
  return recognize(
    lid,
    key,
    group[0],
    group.map((id) => itemById[id]),
  );
}
function phrase(
  lid: string,
  key: string,
  id: string,
  pool: LearningItem[],
): Exercise {
  const item = itemById[id];
  return {
    ...base(lid, key, "guided-phrase", item),
    prompt: "What does this mean?",
    display: item.ko,
    answers: [item.meaning],
    options: optionsFor("meaning", pool, item.meaning),
    audio: item.audio,
    guided: true,
    profileTemplate: item.profileTemplate,
  };
}
for (const [index, spec] of specs.entries()) {
  const day = index + 1,
    lid = `u1-day-${String(day).padStart(2, "0")}`;
  const newItemIds = [
      ...c(spec.letters ?? ""),
      ...ids(spec.blocks ?? []),
      ...(spec.phraseIds ?? []),
    ],
    reviewItemIds = c(spec.review ?? "");
  const knownIds = new Set([
    ...lessons.flatMap((l) => l.newItemIds),
    ...newItemIds,
  ]);
  const knownChars = characters.filter((item) => knownIds.has(item.id)),
    knownVowels = knownChars.filter((item) => item.kind === "vowel"),
    availableConsonants = knownChars.filter(
      (item) => item.kind === "consonant",
    ),
    knownBlocks = syllables.filter((item) => knownIds.has(item.id));
  const exercises: Exercise[] = [];
  if (spec.phraseIds) {
    const pool = phrases.filter((item) => knownIds.has(item.id));
    for (const [i, id] of spec.phraseIds.entries())
      exercises.push(
        phrase(lid, `phrase-${i + 1}`, id, pool),
        phrase(lid, `phrase-${i + 1}-again`, id, pool),
      );
    for (const [i, id] of reviewItemIds.slice(0, 4).entries())
      exercises.push(
        itemById[id].rr
          ? recall(lid, `recall-${i}`, id)
          : listen(lid, `listen-${i}`, id, availableConsonants),
      );
  } else if (spec.keyboardIntro) {
    for (const [i, ko] of [
      "나",
      "마",
      "고",
      "도",
      "보",
      "소",
      "아",
    ].entries()) {
      const item = itemById[syllableId(ko)];
      exercises.push({
        ...base(lid, `type-${i + 1}`, "listen-type", item),
        prompt: "Type what you hear in Korean.",
        answers: [item.ko],
        audio: item.audio,
        input: "Hangul",
        requiresKeyboard: true,
      });
    }
    exercises.push(
      revisit(lid, "vowels", c("ㅓㅗㅜ")),
      ...["ㅏ", "ㅓ", "ㅡ"].map((ko, i) =>
        recall(lid, `recall-${i}`, soundId(ko)),
      ),
    );
  } else if (spec.blocks) {
    for (const [i, id] of ids(spec.blocks).entries())
      exercises.push(
        recognize(lid, `read-${i}`, id, knownBlocks),
        i % 2 === 0
          ? build(lid, `build-${i}`, id)
          : listen(lid, `listen-${i}`, id, knownBlocks),
      );
    if (spec.letters)
      exercises.unshift(recognize(lid, "carrier", soundId("ㅇ"), knownChars));
    for (const [i, id] of c("ㅓㅗ").entries())
      exercises.push(recall(lid, `recall-${i}`, id));
  } else if (spec.letters) {
    const focus = c(spec.letters);
    for (const [i, id] of focus.entries()) {
      const item = itemById[id],
        pool = item.kind === "vowel" ? knownVowels : availableConsonants;
      exercises.push(
        recognize(lid, `recognize-${i}`, id, pool),
        listen(lid, `listen-${i}`, id, pool),
      );
      if (item.rr) exercises.push(recall(lid, `recall-${i}`, id));
    }
    exercises.push(revisit(lid, "match", focus));
    for (const [i, id] of reviewItemIds.slice(0, 3).entries())
      exercises.push(
        itemById[id].rr
          ? recall(lid, `earlier-${i}`, id)
          : listen(lid, `earlier-${i}`, id, availableConsonants),
      );
  } else {
    for (const [i, id] of reviewItemIds.slice(0, 6).entries())
      exercises.push(
        i % 2 === 0
          ? recall(lid, `recall-${i}`, id)
          : listen(lid, `listen-${i}`, id, knownVowels),
      );
    exercises.push(revisit(lid, "match", c("ㄴㅁㄱㄷ")));
    for (const [i, id] of ids(
      day === 14 ? ["바", "도", "아"] : ["나", "고", "너"],
    ).entries())
      exercises.push(
        i === 1
          ? build(lid, `build-${i}`, id)
          : recognize(lid, `read-${i}`, id, knownBlocks),
      );
    if (day === 14) {
      const item = itemById[syllableId("우")];
      exercises.push(
        {
          ...base(lid, "type", "listen-type", item),
          prompt: "Type what you hear in Korean.",
          answers: [item.ko],
          audio: item.audio,
          input: "Hangul",
          requiresKeyboard: true,
        },
        phrase(
          lid,
          "phrase",
          "u1-phrase-miguel",
          phrases.filter((p) => p.speechLevel === "polite"),
        ),
      );
    }
  }
  exercises.forEach((e) => {
    if (e.onsets) e.onsets = e.onsets.filter((ko) => knownIds.has(soundId(ko)));
    if (e.type === "listen-type") {
      const n = e.answers[0].codePointAt(0)! - 0xac00;
      const onset = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"[
        Math.floor(n / 588)
      ];
      const vowel = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"[
        Math.floor((n % 588) / 28)
      ];
      e.itemIds.push(soundId(onset), soundId(vowel));
    }
  });
  lessons.push({
    id: lid,
    unitId: "unit-1",
    day,
    title: spec.title,
    objective: spec.objective,
    prerequisites: day === 1 ? [] : [lessons.at(-1)!.id],
    newItemIds,
    reviewItemIds,
    explanation: spec.explanation,
    examples: spec.examples.map(([ko, meaning, note]) => ({
      ko,
      meaning,
      note,
      audio: audio(ko, "phrase"),
      ...(ko === "미겔 어디 있어요?"
        ? { profileTemplate: "{dog} 어디 있어요?" }
        : ko === "재훈은 뭐 해요?"
          ? { profileTemplate: "{brotherTopic} 뭐 해요?" }
          : {}),
    })),
    exercises,
    minutes: 4,
    status: "available",
    keyboardIntro: spec.keyboardIntro,
    weakReview: spec.weakReview,
  });
}
// Retain all released IDs so existing in-progress sessions remain resumable.
const retainedExercises = lessons.flatMap((l) => l.exercises);
const shortIdeas = [
  "Start with three sounds: a, o, i. Listen, then try them. The circle in the audio examples is silent.",
  "Three more sounds: eo, u, eu. Notice which way each small stroke points. Listen to eo and o, then u and eu.",
  "ㄴ sounds like n. ㅁ sounds like m. Listen to them at the start of 나 and 마.",
  "One block is one syllable. ㄴ + ㅏ makes 나. ㅁ + ㅗ makes 모.",
  "Learn g in 가 and d in 다. You may also hear k and t in other words. Listen to the Korean examples.",
  "Change one part at a time: 가, 고, 다, 도. Then mix in the blocks you know.",
  "No new letters today. Try the sounds you remember, and ask for a hint when you need one.",
  "Learn b in 바 and s in 사. The first can also sound like p. Listen before you try.",
  "Try 바, 보, 사, 소. Read the first letter, then the vowel.",
  "ㅇ is silent at the start. ㅇ + ㅏ makes 아. Just say the vowel.",
  "Listen and type a Korean block. You can ask for keyboard help or skip typing for now.",
  "Learn a few whole expressions by listening. Some letters are new, so use the examples to help.",
  "Listen to a polite hello and two family questions. Close siblings often speak casually; here we practice polite Korean.",
  "Put your sounds together. Try a little reading, listening, and typing.",
];
for (const l of lessons) {
  l.explanation = shortIdeas[l.day - 1];
  if (l.day <= 11) {
    l.examples.forEach((x) => {
      x.note =
        l.day === 3 || l.day === 5 || l.day === 8
          ? "Listen to the first sound in each block."
          : "Listen, then try saying it.";
    });
  }
  const known = new Set(
    lessons.filter((x) => x.day <= l.day).flatMap((x) => x.newItemIds),
  );
  const knownChars = characters.filter((i) => known.has(i.id));
  const reviews = l.reviewItemIds
    .slice(0, Math.min(3, l.reviewItemIds.length))
    .map((id, i) => recall(l.id, "mixed-" + i, id));
  const focus = l.newItemIds.filter((id) => itemById[id].kind !== "phrase");
  // Recognition comes first; independent recall follows for every new character.
  let core = l.exercises.filter(
    (e) =>
      !e.id.includes("-earlier-") &&
      !e.id.includes("-recall-") &&
      !e.id.endsWith("-match") &&
      !e.id.endsWith("-vowels"),
  );
  if (l.day === 1 || l.day === 2)
    core = l.newItemIds.flatMap((id, i) => [
      recognize(
        l.id,
        "recognize-" + i,
        id,
        knownChars.filter((x) => x.kind === "vowel"),
      ),
      listen(
        l.id,
        "listen-" + i,
        id,
        knownChars.filter((x) => x.kind === "vowel"),
      ),
      recall(l.id, "recall-" + i, id),
    ]);
  else if ([3, 5, 8, 10].includes(l.day)) {
    const letters = focus.filter((id) => itemById[id].kind === "consonant");
    const added = letters.map((id, i) => recall(l.id, "remember-" + i, id));
    core.splice(Math.min(core.length, 4), 0, ...added);
  }
  const targetCount = ([2, 14].includes(l.day) ? 12 : 10) - reviews.length;
  const selected = core.slice(0, targetCount);
  // Preserve phrase coverage and introduce every new letter before mixed review.
  for (const id of l.newItemIds) {
    if (!selected.some((e) => e.itemIds.includes(id))) {
      const e = l.exercises.find((e) => e.itemIds.includes(id));
      if (e) selected.push(e);
    }
  }
  for (const e of [...selected, ...reviews]) {
    if (e.type === "type-sound")
      e.soundAlternatives = itemById[e.itemIds[0]].soundAlternatives ?? [];
  }
  let fill = 0;
  const sources = focus.length ? focus : l.reviewItemIds;
  while (selected.length + reviews.length < 10) {
    const id = sources[fill % sources.length];
    const item = itemById[id];
    selected.push(
      item.kind === "phrase"
        ? phrase(
            l.id,
            "practice-" + fill,
            id,
            items.filter((x) => x.kind === "phrase" && known.has(x.id)),
          )
        : recall(l.id, "practice-" + fill, id),
    );
    fill++;
  }
  l.exercises = [...selected, ...reviews];
  l.exercises.forEach((e) => {
    const item = itemById[e.itemIds[0]];
    e.feedback = {
      correct:
        item.kind === "phrase"
          ? item.meaning + "."
          : item.ko + " = " + (item.rr ?? item.meaning) + ".",
      incorrect:
        item.kind === "phrase"
          ? "It means " + item.meaning + "."
          : "It’s " + (item.rr ?? item.meaning) + ".",
    };
  });
}
export const compatibleExercises = retainedExercises;
export const units: Unit[] = [
  {
    id: "unit-1",
    number: 1,
    title: "First Korean sounds",
    subtitle: "Fourteen little steps. A sound foundation.",
    outcome:
      "Six vowels, seven consonants, first blocks, and a few supported family expressions.",
    lessonIds: lessons.map((l) => l.id),
  },
];
export const lessonById: Record<string, Lesson> = Object.fromEntries(
  lessons.map((l) => [l.id, l]),
);
export const exerciseById: Record<string, Exercise> = Object.fromEntries(
  [...retainedExercises, ...lessons.flatMap((l) => l.exercises)].map((e) => [
    e.id,
    e,
  ]),
);
export const soundGroups = [
  { title: "First vowels", letters: "ㅏㅗㅣ" },
  { title: "More vowels", letters: "ㅓㅜㅡ" },
  { title: "First consonants", letters: "ㄴㅁ" },
  { title: "Plain consonants", letters: "ㄱㄷ" },
  { title: "Two more consonants", letters: "ㅂㅅ" },
  { title: "Silent initial", letters: "ㅇ" },
];

// Different-format correction tasks; these never enter the core lesson count.
for (const source of Object.values(exerciseById)) {
  const item = itemById[source.itemIds[0]];
  if (item.kind === "phrase") {
    exerciseById["retry-" + source.id] = {
      ...source,
      id: "retry-" + source.id,
    };
    continue;
  }
  const pool = items.filter(
    (i) =>
      i.kind === item.kind &&
      lessons.find((l) => l.newItemIds.includes(i.id))!.day <=
        lessons.find((l) => l.id === source.id.slice(0, 9))!.day,
  );
  const task =
    source.type === "character-recognition" ||
    source.type === "syllable-reading"
      ? recall("retry", source.id, item.id)
      : recognize("retry", source.id, item.id, pool);
  task.id = "retry-" + source.id;
  exerciseById[task.id] = task;
}
