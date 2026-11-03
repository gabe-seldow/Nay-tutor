export const VOICE_UNAVAILABLE =
  "Korean audio is unavailable or still loading. Check your device’s speech settings and try again.";
export const SPEECH_UNSUPPORTED = "Audio is not available in this browser.";
export const PLAYBACK_FAILED =
  "Audio could not play. Check your device settings and try again.";
export const NORMAL_RATE = 0.8;

// BCP 47 language tags may use different casing; do not match unrelated tags such as "kok".
export function koreanVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const tag = (voice: SpeechSynthesisVoice) =>
    voice.lang.toLowerCase().replaceAll("_", "-");
  return (
    voices.find((v) => tag(v) === "ko-kr") ||
    voices.find((v) => /^ko(?:-|$)/.test(tag(v)))
  );
}

export type SpeechDiagnostics = {
  koreanVoices: number;
  voice: string | null;
  requested: boolean;
  started: boolean;
  status: "idle" | "requested" | "started" | "ended" | "failed" | "cancelled";
  error: string | null;
  rate: number | null;
  durationMs: number | null;
};
export class KoreanSpeech {
  private diagnostics: SpeechDiagnostics = {
    koreanVoices: 0,
    voice: null,
    requested: false,
    started: false,
    status: "idle",
    error: null,
    rate: null,
    durationMs: null,
  };
  private observers = new Set<() => void>();
  snapshot(): SpeechDiagnostics {
    return { ...this.diagnostics };
  }
  subscribe(listener: () => void): () => void {
    this.observers.add(listener);
    return () => this.observers.delete(listener);
  }
  private update(change: Partial<SpeechDiagnostics>) {
    this.diagnostics = { ...this.diagnostics, ...change };
    this.observers.forEach((fn) => fn());
  }
  refreshVoices(): void {
    try {
      const voices = this.synth.getVoices();
      const ko = voices.filter((v) =>
        /^ko(?:-|$)/.test(v.lang.toLowerCase().replaceAll("_", "-")),
      );
      this.update({
        koreanVoices: ko.length,
        voice: koreanVoice(voices)?.name || null,
      });
    } catch {
      this.update({ koreanVoices: 0, voice: null, error: "voice-list-error" });
    }
  }

  private serial = 0;
  private active?: { owner: symbol; utterance: SpeechSynthesisUtterance };
  constructor(
    private synth: SpeechSynthesis,
    private makeUtterance: (text: string) => SpeechSynthesisUtterance,
  ) {}

  // Start loading voices before a tap. A later event only updates availability; it never starts speech.
  watchVoices(onReady: () => void): () => void {
    const changed = () => {
      this.refreshVoices();
      if (this.diagnostics.koreanVoices) onReady();
    };
    this.synth.addEventListener("voiceschanged", changed);
    changed();
    return () => this.synth.removeEventListener("voiceschanged", changed);
  }

  // This method is synchronous so speak() remains inside the button's user gesture on iOS.
  speak(
    owner: symbol,
    text: string,
    rate: number,
    onError: (message: string) => void,
  ): boolean {
    const serial = ++this.serial;
    this.update({
      requested: true,
      started: false,
      status: "requested",
      error: null,
      rate,
      durationMs: null,
    });
    let startedAt: number | undefined;
    try {
      if (this.active || this.synth.speaking || this.synth.pending) {
        this.active = undefined;
        this.synth.cancel();
      }
    } catch {
      this.update({ status: "failed", error: "cancel-error" });
      onError(PLAYBACK_FAILED);
      return false;
    }
    let voice: SpeechSynthesisVoice | undefined;
    try {
      const voices = this.synth.getVoices();
      voice = koreanVoice(voices);
      this.update({
        koreanVoices: voices.filter((v) =>
          /^ko(?:-|$)/.test(v.lang.toLowerCase().replaceAll("_", "-")),
        ).length,
        voice: voice?.name || null,
      });
    } catch {
      this.update({ status: "failed", error: "voice-list-error" });
      onError(VOICE_UNAVAILABLE);
      return false;
    }
    if (!voice) {
      this.update({ status: "failed", error: "no-korean-voice" });
      onError(VOICE_UNAVAILABLE);
      return false;
    }
    try {
      if (this.synth.paused) this.synth.resume();
      const utterance = this.makeUtterance(text);
      utterance.lang = "ko-KR";
      utterance.voice = voice;
      utterance.rate = rate;
      this.active = { owner, utterance }; // Keep a strong reference until the utterance ends.
      utterance.onstart = () => {
        if (this.serial === serial) {
          startedAt = performance.now();
          this.update({ started: true, status: "started" });
        }
      };
      utterance.onend = () => {
        if (this.serial === serial) {
          this.active = undefined;
          this.update({
            status: "ended",
            durationMs:
              startedAt === undefined
                ? null
                : Math.round(performance.now() - startedAt),
          });
        }
      };
      utterance.onerror = (event) => {
        if (this.serial !== serial) return;
        this.active = undefined;
        this.update({
          status:
            event.error === "interrupted" || event.error === "canceled"
              ? "cancelled"
              : "failed",
          error: event.error || "unknown",
        });
        if (event.error !== "interrupted" && event.error !== "canceled")
          onError(PLAYBACK_FAILED);
      };
      this.synth.speak(utterance);
      return true;
    } catch {
      if (this.serial === serial) {
        this.active = undefined;
        this.update({ status: "failed", error: "speak-exception" });
      }
      onError(PLAYBACK_FAILED);
      return false;
    }
  }

  stop(owner: symbol): void {
    if (this.active?.owner !== owner) return;
    ++this.serial;
    this.active = undefined;
    this.update({ status: "cancelled", error: null });
    try {
      this.synth.cancel();
    } catch {
      /* Navigation should still work if speech is unavailable. */
    }
  }
}

let browserSpeech: KoreanSpeech | undefined;
export function getKoreanSpeech(): KoreanSpeech | undefined {
  if (
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    typeof window.SpeechSynthesisUtterance !== "function"
  )
    return undefined;
  return (browserSpeech ??= new KoreanSpeech(
    window.speechSynthesis,
    (text) => new window.SpeechSynthesisUtterance(text),
  ));
}
