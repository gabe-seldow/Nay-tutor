import type {
  AudioContent,
  Exercise,
  ExerciseType,
  ItemKind,
  LearningItem,
  Lesson,
  Unit,
} from "./types";

export const CURRICULUM_VERSION = 1;
export const audio = (
  text: string,
  mode: AudioContent["mode"] = "word",
  note?: string,
): AudioContent => ({
  text,
  language: "ko-KR",
  mode,
  ...(note ? { note } : {}),
});
export const soundId = (ko: string) =>
  `hangul-${ko.codePointAt(0)!.toString(16)}`;

// These are approximate learning guides, not one-to-one English phoneme claims.
const vowels: [string, string, string][] = [
  ["ㅏ", "a · open “ah”", "아"],
  ["ㅣ", "i · like “ee”", "이"],
  ["ㅓ", "eo · an open back vowel; listen to 어", "어"],
  ["ㅡ", "eu · an unrounded back vowel; listen to 으", "으"],
  ["ㅗ", "o · rounded lips, without an English glide", "오"],
  ["ㅜ", "u · rounded “oo”", "우"],
  ["ㅑ", "ya · y + ㅏ", "야"],
  ["ㅕ", "yeo · y + ㅓ", "여"],
  ["ㅛ", "yo · y + ㅗ", "요"],
  ["ㅠ", "yu · y + ㅜ", "유"],
  ["ㅐ", "ae · often close to ㅔ in modern speech", "애"],
  ["ㅔ", "e · often close to ㅐ in modern speech", "에"],
  ["ㅒ", "yae · y + ㅐ", "얘"],
  ["ㅖ", "ye · y + ㅔ", "예"],
  ["ㅘ", "wa · ㅗ + ㅏ", "와"],
  ["ㅙ", "wae · ㅗ + ㅐ", "왜"],
  ["ㅚ", "oe · commonly pronounced like “we”", "외"],
  ["ㅝ", "wo · ㅜ + ㅓ", "워"],
  ["ㅞ", "we · ㅜ + ㅔ", "웨"],
  ["ㅟ", "wi · ㅜ + ㅣ", "위"],
  ["ㅢ", "ui · pronunciation depends on position", "의"],
];
const consonants: [string, string, string][] = [
  ["ㅇ", "silent at the start of a syllable; ng at the end", "아"],
  ["ㄴ", "n-like at the start", "나"],
  ["ㅁ", "m-like at the start", "마"],
  ["ㄱ", "plain k/g-like sound; depends on position", "가"],
  ["ㄷ", "plain t/d-like sound; depends on position", "다"],
  ["ㄹ", "a brief tap between vowels; l-like at the end", "라"],
  ["ㅂ", "plain p/b-like sound; depends on position", "바"],
  ["ㅅ", "s-like; changes before i/y sounds", "사"],
  ["ㅈ", "plain affricate; listen to 자", "자"],
  ["ㅎ", "h-like at the start; can affect nearby sounds", "하"],
  ["ㅋ", "aspirated k-like sound", "카"],
  ["ㅌ", "aspirated t-like sound", "타"],
  ["ㅍ", "aspirated p-like sound", "파"],
  ["ㅊ", "aspirated affricate", "차"],
  ["ㄲ", "tense k-like sound", "까"],
  ["ㄸ", "tense t-like sound", "따"],
  ["ㅃ", "tense p-like sound", "빠"],
  ["ㅆ", "tense s-like sound", "싸"],
  ["ㅉ", "tense affricate", "짜"],
];
export const characters: LearningItem[] = [
  ...vowels.map(([ko, meaning, text]) => ({
    id: soundId(ko),
    kind: "vowel" as const,
    ko,
    meaning,
    audio: audio(
      text,
      "vowel-syllable",
      "ㅇ is a silent carrier here. Listen to the vowel in a readable syllable.",
    ),
  })),
  ...consonants.map(([ko, meaning, text]) => ({
    id: soundId(ko),
    kind: "consonant" as const,
    ko,
    meaning,
    audio: audio(
      text,
      "context-syllable",
      "Hear this consonant in a syllable, not as an isolated phoneme. Final sounds are introduced in Unit 4.",
    ),
  })),
];
const catalog: LearningItem[] = [...characters];
type Seed = {
  title: string;
  objective: string;
  explanation: string;
  sounds?: string;
  entries?: [string, ItemKind, string, string][];
  example: [string, string, string];
  practice?: ExerciseType;
  hint: string;
};
const unitSeeds = [
  [
    "First Korean sounds",
    "Meet a few letters. Hear the difference.",
    "Recognize six basic vowels, ㄴ, ㅁ and silent initial ㅇ; build your first blocks.",
  ],
  [
    "Reading Hangul",
    "Turn individual sounds into readable blocks.",
    "Read the common basic consonants and all 21 vowels, with guided keyboard setup.",
  ],
  [
    "More sounds & short words",
    "Notice breath, tension, and familiar words.",
    "Distinguish plain, aspirated and tense sounds using syllables; read first words.",
  ],
  [
    "Final consonants",
    "Discover the sound at the bottom.",
    "Read basic 받침 and notice linking, neutralization, nasalization and aspiration.",
  ],
  [
    "Everyday family Korean",
    "Small phrases for ordinary moments.",
    "Greet family, say thanks, and talk about hunger, tiredness and bedtime politely.",
  ],
  [
    "Questions & answers",
    "Ask a little. Understand a little more.",
    "Use what, where and who questions, with simple answers about people and Miguel.",
  ],
  [
    "Daily routines",
    "Talk about the shape of your day.",
    "Talk about meals, studying, sleeping, destinations and things you want to eat.",
  ],
  [
    "Simple family conversations",
    "Bring the sounds and phrases together.",
    "Follow short family exchanges and compare optional casual speech with polite forms.",
  ],
] as const;
const seeds: Seed[][] = [
  [
    {
      title: "Your first two vowels",
      objective:
        "Recognize ㅏ and ㅣ by sight and sound, using silent ㅇ as a carrier.",
      sounds: "ㅏㅣㅇ",
      explanation:
        "Hangul letters fit into syllable blocks. A vowel needs a starting space: ㅇ fills it silently. 아 carries ㅏ; 이 carries ㅣ. Learn only these two vowels today.",
      example: [
        "아 · 이",
        "a · i",
        "The circle is silent here. These are sound examples, not words to translate.",
      ],
      hint: "For ㅏ, the short stroke points right. Listen before choosing.",
    },
    {
      title: "Two new vowel shapes",
      objective:
        "Tell ㅓ and ㅡ apart from each other and from the first vowels.",
      sounds: "ㅓㅡ",
      explanation:
        "ㅓ has a short stroke pointing left. ㅡ is horizontal. Their sounds do not map neatly onto English; use the audio as your guide. Romanization eo and eu are temporary labels.",
      example: ["어 · 으", "eo · eu", "Keep the two vowel sounds distinct."],
      hint: "Look at whether the vowel has a short side stroke.",
    },
    {
      title: "Round your lips",
      objective: "Recognize the rounded vowels ㅗ and ㅜ.",
      sounds: "ㅗㅜ",
      explanation:
        "ㅗ has its short stroke above the line; ㅜ has it below. Both use rounded lips. Contrast 오 with 우, then revisit 아 and 이.",
      example: ["오 · 우", "o · u", "Avoid adding an English-style glide."],
      hint: "Above: ㅗ. Below: ㅜ.",
    },
    {
      title: "Meet ㄴ and ㅁ",
      objective: "Recognize two initial consonants in pronounceable syllables.",
      sounds: "ㄴㅁ",
      explanation:
        "ㄴ starts 나 with an n-like sound. ㅁ starts 마 with an m-like sound. The audio reads full syllables, because browser speech is unreliable for isolated consonants.",
      example: [
        "나 · 마",
        "na · ma",
        "Focus on the first sound, then the shared ㅏ.",
      ],
      hint: "Listen to the start of 나 and 마.",
    },
    {
      title: "Build your first blocks",
      objective: "Combine ㄴ or ㅁ with a known vowel in the correct layout.",
      entries: [
        ["syllable-na", "syllable", "나", "na"],
        ["syllable-mu", "syllable", "무", "mu"],
      ],
      explanation:
        "A vertical vowel sits to the right: ㄴ + ㅏ = 나. A horizontal vowel sits underneath: ㅁ + ㅜ = 무. Each block is one syllable.",
      example: [
        "나 · 무",
        "na · mu",
        "Read the consonant first, then the vowel.",
      ],
      practice: "build-syllable",
      hint: "Place ㅜ under ㅁ to make 무.",
    },
    {
      title: "Read a little, hear a little",
      objective: "Read and hear a two-syllable word using only known letters.",
      entries: [["word-namu", "vocabulary", "나무", "tree"]],
      explanation:
        "나무 has two blocks: 나 + 무. You already know every letter. Try hearing the word without looking, then read it again. Keep accuracy ahead of speed.",
      example: ["나무", "tree", "Two blocks, two syllables: na-mu."],
      practice: "listen-select",
      hint: "Start with ㄴ + ㅏ, then ㅁ + ㅜ.",
    },
  ],
  [
    {
      title: "Meet ㄱ and ㄷ",
      objective: "Read plain ㄱ and ㄷ in open syllables.",
      sounds: "ㄱㄷ",
      explanation:
        "English k/g and t/d are rough labels. Korean plain consonants vary by position and speaker. Hear 가 and 다 instead of memorizing one fixed English sound.",
      example: [
        "가 · 다",
        "ga · da (approximate guides)",
        "The sound guides do not describe every position.",
      ],
      hint: "Compare the start of 가 with the start of 다.",
    },
    {
      title: "Meet ㄹ and ㅂ",
      objective: "Recognize ㄹ and ㅂ in simple syllables.",
      sounds: "ㄹㅂ",
      explanation:
        "ㄹ can be a brief tongue tap, as in 라. ㅂ is a plain consonant heard in 바. Final ㄹ comes later; do not assume English r is an exact match.",
      example: [
        "라 · 바",
        "ra · ba (approximate guides)",
        "Listen to each starting consonant.",
      ],
      hint: "Focus on the starting sound rather than the shared vowel.",
    },
    {
      title: "Meet ㅅ, ㅈ and ㅎ",
      objective: "Recognize the last three common basic consonants.",
      sounds: "ㅅㅈㅎ",
      explanation:
        "Listen to 사, 자 and 하. ㅅ changes before i/y sounds; 시 sounds different from 사. We will revisit pronunciation changes after the basic alphabet.",
      example: [
        "사 · 자 · 하",
        "sa · ja · ha (approximate guides)",
        "These are syllable examples, not consonant letter names.",
      ],
      hint: "Hear the beginning of each syllable.",
    },
    {
      title: "Add a little y sound",
      objective: "Recognize ㅑ, ㅕ, ㅛ and ㅠ.",
      sounds: "ㅑㅕㅛㅠ",
      explanation:
        "An extra short stroke adds a y-like onset to these familiar vowels. Compare 아/야, 어/여, 오/요 and 우/유. Learn in two pairs, then mix them.",
      example: [
        "야 · 여 · 요 · 유",
        "ya · yeo · yo · yu",
        "Each block starts with silent ㅇ.",
      ],
      hint: "Compare each shape to its one-stroke vowel partner.",
    },
    {
      title: "Similar sounds, different letters",
      objective:
        "Read ㅐ, ㅔ, ㅒ and ㅖ without treating merged sounds as a hearing test.",
      sounds: "ㅐㅔㅒㅖ",
      explanation:
        "Many modern speakers pronounce ㅐ and ㅔ alike. Learn the spelling in context; do not expect to identify the spelling from that sound alone. The same caution applies to ㅒ/ㅖ.",
      example: [
        "애 · 에 · 얘 · 예",
        "ae · e · yae · ye",
        "Use visual matching and supported spelling, not ambiguous audio-only choices.",
      ],
      practice: "character-matching",
      hint: "Use the written shape; these pairs may sound the same.",
    },
    {
      title: "Three combined vowels",
      objective: "Read ㅘ, ㅙ and ㅚ in a small visual group.",
      sounds: "ㅘㅙㅚ",
      explanation:
        "These letters combine familiar vowel shapes. ㅘ is wa; ㅙ and ㅚ often overlap with we-like sounds in modern speech. Compare spelling with visible models before listening in words.",
      example: [
        "와 · 왜 · 외",
        "wa · wae · oe",
        "Do not ask for the spelling of merged vowel sounds from audio alone.",
      ],
      practice: "character-matching",
      hint: "Look at the pieces to the right of ㅗ.",
    },
    {
      title: "Four more vowel combinations",
      objective: "Recognize ㅝ, ㅞ, ㅟ and ㅢ with supported spelling.",
      sounds: "ㅝㅞㅟㅢ",
      explanation:
        "Recognize the parts of each shape first. ㅞ can overlap with ㅙ and ㅚ in speech. ㅢ changes with context; 의 at the start of a word is a useful first model, not a universal pronunciation rule.",
      example: [
        "워 · 웨 · 위 · 의",
        "wo · we · wi · ui",
        "Use visual matching for overlapping sounds and teach context before testing 의 in phrases.",
      ],
      practice: "character-matching",
      hint: "Compare the vowel pieces: ㅜ-based letters, then ㅡ + ㅣ.",
    },
    {
      title: "Your first Korean typing",
      objective:
        "Enable a Korean keyboard and type a word with a visible model before listening.",
      entries: [["word-ai", "vocabulary", "아이", "child"]],
      explanation:
        "Introduce a Korean keyboard before any Hangul typing test. First copy 아이 with a visible model and learn how letters combine into blocks. Only then try a short listen-and-type task. Skip typing until setup is complete; use letter tiles for the orientation.",
      example: [
        "아이",
        "child",
        "Two vowel syllables. Each begins with silent ㅇ. The keyboard introduction comes before independent typing.",
      ],
      practice: "listen-type",
      hint: "아이 has two vowel syllables. Each begins with silent ㅇ.",
    },
  ],
  [
    {
      title: "A little more breath",
      objective: "Contrast plain and aspirated ㄱ/ㅋ and ㄷ/ㅌ in syllables.",
      sounds: "ㅋㅌ",
      explanation:
        "Aspirated sounds release more air. Compare 가/카 and 다/타. Listen to full syllables and try feeling the breath with a hand near your mouth.",
      example: [
        "가 · 카 · 다 · 타",
        "plain / aspirated contrasts",
        "Do not reduce this distinction to English voiced versus unvoiced.",
      ],
      hint: "The aspirated sounds have a stronger release of breath.",
    },
    {
      title: "Two more breathy sounds",
      objective: "Contrast ㅂ/ㅍ and ㅈ/ㅊ, then read a familiar loanword.",
      sounds: "ㅍㅊ",
      entries: [["word-coffee", "vocabulary", "커피", "coffee"]],
      explanation:
        "Compare 바/파 and 자/차. 커피 uses letters you have now met. Speech synthesis is a practice aid; it cannot assess your pronunciation.",
      example: ["커피", "coffee", "Two blocks: 커 + 피."],
      hint: "ㅍ and ㅊ are the aspirated partners in these pairs.",
    },
    {
      title: "Your first tense sounds",
      objective: "Recognize ㄲ and ㄸ in small three-way comparisons.",
      sounds: "ㄲㄸ",
      explanation:
        "Tense consonants have a tighter onset, not simply a louder sound. Compare 가/카/까 first, then 다/타/따. Learn two tense consonants before adding the rest.",
      example: [
        "가 · 카 · 까",
        "plain · aspirated · tense",
        "Listen in context. No microphone grading is implied.",
      ],
      hint: "Double letters mark tense consonants.",
    },
    {
      title: "The other tense sounds",
      objective: "Recognize ㅃ, ㅆ and ㅉ in familiar syllable families.",
      sounds: "ㅃㅆㅉ",
      explanation:
        "Compare 바/파/빠, 사/싸 and 자/차/짜 in small sets. ㅅ does not have a separate aspirated letter partner. Keep the sound distinctions separate from loudness.",
      example: [
        "바 · 파 · 빠",
        "plain · aspirated · tense",
        "Practice one family at a time, then revisit ㄲ and ㄸ.",
      ],
      hint: "Look for the doubled consonant shape.",
    },
    {
      title: "Read your first word set",
      objective: "Read short words with known vowels and consonants.",
      entries: [
        ["word-banana", "vocabulary", "바나나", "banana"],
        ["word-appa", "vocabulary", "아빠", "dad"],
      ],
      explanation:
        "Read 바나나 one block at a time. In 아빠, the second block starts with tense ㅃ. 아빠 is a familiar family word; 아버지 is another word for father.",
      example: [
        "아빠",
        "dad",
        "A familiar family term, not a complete polite sentence.",
      ],
      practice: "listen-type",
      hint: "아빠 starts with silent ㅇ, then a tense ㅃ.",
    },
    {
      title: "Read, then listen again",
      objective: "Read two new words and revisit familiar word spellings.",
      entries: [
        ["word-baby", "vocabulary", "아기", "baby"],
        ["word-meat", "vocabulary", "고기", "meat"],
      ],
      explanation:
        "Read 아기 and 고기 using known letters. Then mix these with 나무, 커피 and 바나나 in short listening practice. A new word can be readable without introducing a new letter.",
      example: [
        "아기 · 고기",
        "baby · meat",
        "Both words use letters already taught.",
      ],
      practice: "listen-select",
      hint: "The first block differs; the second block is 기 in both words.",
    },
  ],
  [
    {
      title: "A sound at the bottom",
      objective: "Read simple final ㄴ, ㅁ and ㅇ.",
      entries: [
        ["word-mun", "vocabulary", "문", "door"],
        ["word-bam", "vocabulary", "밤", "night"],
        ["word-gang", "vocabulary", "강", "river"],
      ],
      explanation:
        "A final consonant sits beneath the rest of the block. At the end, ㅇ is ng, unlike silent initial ㅇ. Read 문, 밤 and 강 slowly.",
      example: ["강", "river", "Final ㅇ is pronounced ng."],
      hint: "Check the bottom letter; final ㅇ is not silent.",
    },
    {
      title: "Closed endings",
      objective:
        "Recognize the unreleased ㄱ, ㄷ and ㅂ final-sound groups, plus final ㄹ.",
      entries: [
        ["word-bap", "vocabulary", "밥", "cooked rice; meal"],
        ["word-ot", "vocabulary", "옷", "clothes"],
        ["word-mul", "vocabulary", "물", "water"],
        ["word-guk", "vocabulary", "국", "soup"],
      ],
      explanation:
        "Final stops are not released with an extra vowel. Several spellings share a final sound: 옷 ends with a t-like stop in isolation, despite written ㅅ. Final ㄹ is l-like.",
      example: [
        "옷",
        "clothes",
        "In isolation, its final ㅅ is realized as an unreleased t-like sound.",
      ],
      hint: "Read the written word, then notice how its final sound closes.",
    },
    {
      title: "Link to the next vowel",
      objective:
        "Notice a final consonant linking before a vowel-initial syllable.",
      entries: [
        ["word-babi", "vocabulary", "밥이", "rice/meal + subject marker"],
      ],
      explanation:
        "In 밥이, final ㅂ links into the next syllable: [바비]. The spelling stays 밥이. Not every boundary follows one simple rule; start with this regular example.",
      example: [
        "밥이",
        "rice/meal + subject marker",
        "Pronounced [바비]; this is a noun with a particle, not a complete sentence.",
      ],
      hint: "The next block begins with silent ㅇ, so listen for linking.",
    },
    {
      title: "Sounds that meet",
      objective:
        "Notice common nasalization and aspiration in two supported words.",
      entries: [
        ["word-gungmul", "vocabulary", "국물", "broth"],
        ["word-jota", "vocabulary", "좋다", "to be good (dictionary form)"],
      ],
      explanation:
        "국물 is pronounced [궁물]: ㄱ becomes ng before ㅁ. 좋다 is [조타]: ㅎ affects the next ㄷ. These are guided examples; do not apply either change everywhere.",
      example: [
        "국물 · 좋다",
        "broth · to be good",
        "[궁물] and [조타] are pronunciation aids; retain the original spelling.",
      ],
      hint: "Notice the neighboring consonants that trigger each change.",
    },
  ],
  [
    {
      title: "Hello, Jaeyeon",
      objective: "Greet someone and recognize polite speech.",
      entries: [["phrase-hello", "phrase", "안녕하세요", "Hello"]],
      explanation:
        "안녕하세요 is a useful polite greeting. Close siblings commonly use casual Korean; this course starts with polite forms for a broad family foundation. We will compare casual forms later.",
      example: [
        "안녕하세요",
        "Hello",
        "Appropriate for greeting someone politely. Names can be added separately when context fits.",
      ],
      practice: "translate",
      hint: "This phrase opens a polite greeting.",
    },
    {
      title: "A little thank you",
      objective: "Choose two natural polite ways to say thanks.",
      entries: [
        ["phrase-thanks", "phrase", "고마워요", "Thank you"],
        ["phrase-thanks-formal", "phrase", "감사합니다", "Thank you"],
      ],
      explanation:
        "고마워요 is polite and conversational. 감사합니다 is more formal and widely used. Both express thanks; do not make them competing answers to an underspecified translation prompt.",
      example: [
        "고마워요",
        "Thank you",
        "Conversational polite thanks; 감사합니다 is also correct thanks in a more formal style.",
      ],
      practice: "translate",
      hint: "Think of what you say after someone helps you.",
    },
    {
      title: "Hungry or tired?",
      objective: "Say how you feel using polite everyday expressions.",
      entries: [
        ["phrase-hungry", "phrase", "배고파요", "I’m hungry"],
        ["phrase-tired", "phrase", "피곤해요", "I’m tired"],
      ],
      explanation:
        "Korean often leaves out a subject when context makes it clear. 배고파요 and 피곤해요 can describe how you feel. Do not add 저는 to every answer automatically.",
      example: [
        "배고파요",
        "I’m hungry",
        "An everyday polite statement; the subject is understood.",
      ],
      practice: "translate",
      hint: "배 is associated with the belly; this phrase describes hunger.",
    },
    {
      title: "Good night, one moment",
      objective: "Use a bedtime wish and a short request to wait.",
      entries: [
        ["phrase-sleep-well", "phrase", "잘 자요", "Sleep well"],
        ["phrase-wait", "phrase", "잠깐만요", "Just a moment"],
      ],
      explanation:
        "잘 자요 fits a bedtime exchange with family or someone close. 잠깐만요 asks for a moment. Polite -요 alone does not make every phrase equally suitable for all elders; 주무세요 is the honorific sleep form.",
      example: [
        "잘 자요",
        "Sleep well",
        "Use with an appropriate close relationship; elders may call for honorific wording.",
      ],
      practice: "complete-phrase",
      hint: "잘 means well in this bedtime phrase.",
    },
  ],
  [
    {
      title: "What are you doing?",
      objective: "Ask a simple polite what-question.",
      entries: [
        ["phrase-what-doing", "phrase", "뭐 해요?", "What are you doing?"],
      ],
      explanation:
        "뭐 asks what. In context, 뭐 해요? asks what someone is doing. To get Jaehun’s attention politely, use a separate name call when appropriate rather than forcing a name into every question.",
      example: [
        "뭐 해요?",
        "What are you doing?",
        "The subject is usually understood from context.",
      ],
      practice: "translate",
      hint: "뭐 is the question word for what.",
    },
    {
      title: "Where is Miguel?",
      objective: "Ask where a person or pet is.",
      entries: [
        [
          "phrase-miguel-where",
          "phrase",
          "미겔은 어디 있어요?",
          "Where is Miguel?",
        ],
        ["word-home", "vocabulary", "집", "home; house"],
      ],
      explanation:
        "어디 asks where, and 있어요 can express being somewhere. 미겔은 makes Miguel the topic. The name spelling is a configurable proposed default, not a verified family preference.",
      example: [
        "미겔은 어디 있어요?",
        "Where is Miguel?",
        "The fixed reading example is labeled with the proposed spelling; personalized wording is deferred until supported by the lesson engine.",
      ],
      practice: "translate",
      hint: "어디 asks about a place.",
    },
    {
      title: "Who is it? Yes or no?",
      objective: "Recognize who, yes and no in short replies.",
      entries: [
        ["phrase-who", "phrase", "누구예요?", "Who is it?"],
        ["word-yes", "vocabulary", "네", "yes"],
        ["word-no", "vocabulary", "아니요", "no"],
      ],
      explanation:
        "누구예요? asks who someone is. 네 and 아니요 are polite yes/no replies. Negative questions need extra care; begin with affirmative questions only.",
      example: [
        "누구예요?",
        "Who is it?",
        "Context determines whether English uses who is it or who are they.",
      ],
      practice: "translate",
      hint: "누구 asks about a person.",
    },
    {
      title: "Miguel is cute",
      objective: "Describe Miguel and answer a simple where-question.",
      entries: [
        ["phrase-cute", "phrase", "미겔이 귀여워요", "Miguel is cute"],
        [
          "phrase-at-home",
          "phrase",
          "집에 있어요",
          "I’m/it’s at home (context decides)",
        ],
      ],
      explanation:
        "귀여워요 means cute. 집에 있어요 says that the understood subject is at home. A question about Miguel makes “He’s at home” a natural contextual translation.",
      example: [
        "미겔이 귀여워요",
        "Miguel is cute",
        "이 marks the subject after the consonant-ending name 미겔.",
      ],
      practice: "complete-phrase",
      hint: "귀여워요 describes being cute.",
    },
  ],
  [
    {
      title: "Have you eaten?",
      objective: "Ask about a meal in a familiar polite check-in.",
      entries: [["phrase-eaten", "phrase", "밥 먹었어요?", "Have you eaten?"]],
      explanation:
        "밥 먹었어요? is a common check-in. It can be caring small talk, not always an invitation. 먹었어요 is a past form; introduce it as a useful chunk before generalizing.",
      example: [
        "밥 먹었어요?",
        "Have you eaten?",
        "Appropriate with familiar people; honorific 식사하셨어요? can suit elders.",
      ],
      practice: "translate",
      hint: "먹었어요 asks about eating that has already happened.",
    },
    {
      title: "Study, rest, sleep",
      objective: "Talk about familiar routines in short polite sentences.",
      entries: [
        ["phrase-study", "phrase", "공부해요", "I study / I’m studying"],
        ["phrase-rest", "phrase", "쉬어요", "I rest / I’m resting"],
        ["phrase-sleep", "phrase", "자요", "I sleep / I’m sleeping"],
      ],
      explanation:
        "Context lets the Korean present tense cover habits and current actions. Use 공부해요 as a short answer to 뭐 해요? rather than teaching an English tense equivalence.",
      example: [
        "공부해요",
        "I’m studying",
        "A natural short answer to what are you doing.",
      ],
      practice: "translate",
      hint: "공부 refers to studying.",
    },
    {
      title: "Where are you going?",
      objective: "Ask about a destination and give a short reply.",
      entries: [
        ["phrase-going-where", "phrase", "어디 가요?", "Where are you going?"],
        ["phrase-go-home", "phrase", "집에 가요", "I’m going home"],
      ],
      explanation:
        "가요 is a polite form of to go. 에 marks the destination in 집에 가요. Notice the difference between going home and being at home.",
      example: [
        "집에 가요",
        "I’m going home",
        "가요 describes going; 있어요 describes being there.",
      ],
      practice: "complete-phrase",
      hint: "가요 is the going part of the sentence.",
    },
    {
      title: "Something you want to eat",
      objective: "Say you want to eat something using -고 싶어요.",
      entries: [
        ["phrase-want-eat", "phrase", "먹고 싶어요", "I want to eat"],
        [
          "phrase-want-banana",
          "phrase",
          "바나나 먹고 싶어요",
          "I want to eat a banana",
        ],
      ],
      explanation:
        "Attach -고 싶어요 to the verb stem: 먹다 → 먹고 싶어요. In casual everyday conversation, the object particle is often omitted, as in 바나나 먹고 싶어요.",
      example: [
        "바나나 먹고 싶어요",
        "I want to eat a banana",
        "The English article a is supplied naturally; Korean does not require one here.",
      ],
      practice: "complete-phrase",
      hint: "Keep 먹고 together before 싶어요.",
    },
  ],
  [
    {
      title: "A small family check-in",
      objective: "Understand a question and reply about studying.",
      entries: [
        [
          "exchange-study",
          "phrase",
          "뭐 해요? — 공부해요",
          "What are you doing? — I’m studying",
        ],
      ],
      explanation:
        "Read two turns, then listen one turn at a time. Match each speaker’s intent before building a response. A complete dialogue is not read as an isolated consonant task.",
      example: [
        "뭐 해요? — 공부해요",
        "What are you doing? — I’m studying",
        "Polite exchange; close siblings may choose casual alternatives.",
      ],
      practice: "translate",
      hint: "Identify the question first, then the answer.",
    },
    {
      title: "Find Miguel",
      objective: "Follow a short exchange about where Miguel is.",
      entries: [
        [
          "exchange-miguel",
          "phrase",
          "미겔은 어디 있어요? — 집에 있어요",
          "Where is Miguel? — He’s at home",
        ],
      ],
      explanation:
        "The second turn leaves out Miguel because both speakers already know who they mean. Use a scene and short audio turns before a cumulative listening check.",
      example: [
        "미겔은 어디 있어요? — 집에 있어요",
        "Where is Miguel? — He’s at home",
        "He is a contextual English translation, not an extra Korean pronoun.",
      ],
      practice: "translate",
      hint: "The reply names a place, not a new person.",
    },
    {
      title: "When siblings speak casually",
      objective: "Compare optional casual forms after a polite foundation.",
      entries: [
        [
          "phrase-casual-what",
          "phrase",
          "뭐 해?",
          "What are you doing? (casual)",
        ],
        ["phrase-casual-night", "phrase", "잘 자", "Sleep well (casual)"],
      ],
      explanation:
        "Close siblings commonly speak casually. 뭐 해? and 잘 자 are familiar alternatives to 뭐 해요? and 잘 자요. Relationship, age and family preference matter; never automatically use these with older relatives.",
      example: [
        "뭐 해요? / 뭐 해?",
        "What are you doing? — polite / casual",
        "Both can be natural between siblings, depending on their relationship.",
      ],
      practice: "translate",
      hint: "Notice which form has -요 and which omits it.",
    },
    {
      title: "Your first little conversation",
      objective:
        "Combine familiar questions, feelings and a bedtime wish with gradually reduced support.",
      entries: [
        [
          "exchange-night",
          "phrase",
          "피곤해요. — 잘 자요",
          "I’m tired. — Sleep well",
        ],
      ],
      explanation:
        "Use several short scenes, not one long test. Revisit weak sounds between conversations. Finish with an optional typed reply using previously taught words; no claim of fluency follows from completing the course.",
      example: [
        "피곤해요. — 잘 자요",
        "I’m tired. — Sleep well",
        "A short exchange between familiar speakers using polite forms.",
      ],
      practice: "listen-type",
      hint: "Listen for the familiar phrase about being tired.",
    },
  ],
];

export const lessons: Lesson[] = [];
export const units: Unit[] = unitSeeds.map(([title, subtitle, outcome], i) => ({
  id: `unit-${i + 1}`,
  number: i + 1,
  title,
  subtitle,
  outcome,
  lessonIds: [],
}));
seeds.forEach((group, ui) =>
  group.forEach((seed, li) => {
    const id = `u${ui + 1}-l${li + 1}`;
    const newItems: LearningItem[] = (seed.entries ?? []).map(
      ([itemId, kind, ko, meaning]) => {
        const base = {
          id: itemId,
          ko,
          meaning,
          audio: audio(
            ko,
            kind === "phrase"
              ? "phrase"
              : kind === "syllable"
                ? "context-syllable"
                : "word",
          ),
        };
        return kind === "phrase"
          ? {
              ...base,
              kind,
              speechLevel: itemId.includes("casual")
                ? "casual"
                : itemId === "phrase-thanks-formal"
                  ? "formal-polite"
                  : "haeyoche",
            }
          : { ...base, kind };
      },
    );
    catalog.push(...newItems);
    const newItemIds = [
      ...Array.from(seed.sounds ?? "").map(soundId),
      ...newItems.map((x) => x.id),
    ];
    const previous = lessons.at(-1);
    const target = catalog.find((x) => x.id === newItemIds[0])!;
    const listeningTarget =
      seed.practice === "listen-type" ? (newItems[0] ?? target) : target;
    const recognition: Exercise = {
      id: `${id}-recognize`,
      status: "planned",
      type:
        target.kind === "vowel" || target.kind === "consonant"
          ? "character-recognition"
          : "translate",
      objective: seed.objective,
      prompt: `Choose the ${target.kind === "vowel" || target.kind === "consonant" ? "sound guide" : "meaning"} for ${target.ko}.`,
      itemIds: [target.id],
      requiredItemIds: newItemIds,
      answers: [target.meaning],
      hint: seed.hint,
      feedback: {
        correct: `Yes — ${target.ko}: ${target.meaning}.`,
        incorrect: `Look and listen again. ${target.ko}: ${target.meaning}.`,
      },
      input: "English",
    };
    const contextualOnly = [
      "Similar sounds, different letters",
      "Three combined vowels",
      "Four more vowel combinations",
    ].includes(seed.title);
    const isLetter = target.kind === "vowel" || target.kind === "consonant";
    const listening: Exercise = {
      id: `${id}-listen`,
      status: "planned",
      type: contextualOnly
        ? "character-matching"
        : isLetter
          ? "sound-to-character"
          : "listen-select",
      objective: contextualOnly
        ? "Match the written letter with its sound guide."
        : "Recognize a taught item by listening.",
      prompt: contextualOnly
        ? `Match ${target.ko} to its written sound guide.`
        : isLetter
          ? `Listen to a syllable. Choose its ${target.kind === "vowel" ? "vowel" : "starting consonant"}.`
          : "Listen, then select the matching Korean spelling.",
      itemIds: [target.id],
      requiredItemIds: newItemIds,
      answers: [contextualOnly ? target.meaning : target.ko],
      hint: seed.hint,
      feedback: {
        correct: "That matches the taught example.",
        incorrect: `Revisit the example: ${target.ko}.`,
      },
      ...(contextualOnly ? {} : { audio: target.audio }),
    };
    const taskType =
      id === "u1-l6"
        ? "syllable-reading"
        : (seed.practice ?? "character-matching");
    const clozeParts = target.ko.split(" ");
    const missing = clozeParts.pop()!;
    const task: Exercise = {
      id: `${id}-practice`,
      status: "planned",
      type: taskType,
      objective: seed.objective,
      prompt:
        taskType === "listen-type"
          ? "Listen and type the taught item in Hangul."
          : taskType === "listen-select"
            ? "Listen and choose the taught spelling."
            : taskType === "build-syllable"
              ? "Combine ㄴ and ㅏ into one block."
              : taskType === "translate"
                ? `What does ${target.ko} mean in this lesson’s context?`
                : taskType === "complete-phrase"
                  ? `Complete the taught phrase for “${target.meaning}”: ${clozeParts.join(" ")} ____.`
                  : taskType === "syllable-reading"
                    ? `Read ${target.ko} and choose its sound guide.`
                    : `Match ${target.ko} to its ${isLetter ? "sound guide" : "meaning"}.`,
      itemIds: [listeningTarget.id],
      requiredItemIds: newItemIds,
      answers: [
        taskType === "build-syllable"
          ? "나"
          : taskType === "complete-phrase"
            ? missing
            : taskType === "translate" || taskType === "character-matching"
              ? target.meaning
              : taskType === "syllable-reading"
                ? "na-mu"
                : listeningTarget.ko,
      ],
      hint: seed.hint,
      feedback: {
        correct: `That fits the taught example: ${target.ko}.`,
        incorrect: `Revisit ${target.ko}: ${target.meaning}.`,
      },
      ...(["listen-type", "listen-select"].includes(taskType)
        ? {
            ...(taskType === "listen-type" ? { input: "Hangul" as const } : {}),
            audio: listeningTarget.audio,
          }
        : {}),
    };
    const lesson: Lesson = {
      id,
      unitId: `unit-${ui + 1}`,
      title: seed.title,
      objective: seed.objective,
      prerequisites: previous ? [previous.id] : [],
      newItemIds,
      reviewItemIds: previous ? previous.newItemIds.slice(0, 2) : [],
      explanation: seed.explanation,
      examples: [
        {
          ko: seed.example[0],
          meaning: seed.example[1],
          note: seed.example[2],
          audio: audio(seed.example[0], "phrase"),
        },
      ],
      exercises: [recognition, listening, task],
      minutes: 4,
      status: "planned",
      implementationPhase: ui < 2 ? 2 : 4,
    };
    lessons.push(lesson);
    units[ui].lessonIds.push(id);
  }),
);
export const items: LearningItem[] = catalog;
export const itemById = Object.fromEntries(
  items.map((item) => [item.id, item]),
);
export const lessonById = Object.fromEntries(
  lessons.map((lesson) => [lesson.id, lesson]),
);
export const soundGroups = [
  {
    title: "Start small",
    description: "Two vowels and a silent carrier. This is your first group.",
    letters: "ㅏㅣㅇ",
  },
  {
    title: "The other basic vowels",
    description: "Two small pairs, introduced across Lessons 2 and 3.",
    letters: "ㅓㅡㅗㅜ",
  },
  {
    title: "Basic consonants",
    description: "Learn these in small groups across Units 1 and 2.",
    letters: "ㄴㅁㄱㄷㄹㅂㅅㅈㅎ",
  },
  {
    title: "Y vowels",
    description: "Meet the extra short stroke.",
    letters: "ㅑㅕㅛㅠ",
  },
  {
    title: "Similar & combined vowels",
    description: "Learn spelling in context when sounds overlap.",
    letters: "ㅐㅔㅒㅖㅘㅙㅚㅝㅞㅟㅢ",
  },
  {
    title: "Aspirated consonants",
    description: "A little more breath. Introduced in Unit 3.",
    letters: "ㅋㅌㅍㅊ",
  },
  {
    title: "Tense consonants",
    description: "A tighter onset. Introduced in Unit 3.",
    letters: "ㄲㄸㅃㅆㅉ",
  },
];
