import { describe, expect, it, vi } from "vitest";
import {
  KoreanSpeech,
  koreanVoice,
  NORMAL_RATE,
  VOICE_UNAVAILABLE,
  PLAYBACK_FAILED,
} from "./speech";

const voice = (lang: string) => ({ lang, name: lang }) as SpeechSynthesisVoice;
function setup() {
  let voices: SpeechSynthesisVoice[] = [];
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const utterances: SpeechSynthesisUtterance[] = [];
  const synth = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: vi.fn(() => voices),
    speak: vi.fn(),
    cancel: vi.fn(),
    resume: vi.fn(),
    addEventListener: vi.fn(
      (_type: string, listener: EventListenerOrEventListenerObject) =>
        listeners.add(listener),
    ),
    removeEventListener: vi.fn(
      (_type: string, listener: EventListenerOrEventListenerObject) =>
        listeners.delete(listener),
    ),
  };
  const service = new KoreanSpeech(
    synth as unknown as SpeechSynthesis,
    (text) => {
      const u = {
        text,
        lang: "",
        voice: null,
        rate: 1,
        onend: null,
        onerror: null,
      } as unknown as SpeechSynthesisUtterance;
      utterances.push(u);
      return u;
    },
  );
  return {
    service,
    synth,
    utterances,
    setVoices: (next: SpeechSynthesisVoice[]) => {
      voices = next;
    },
    changed: () => {
      for (const l of listeners)
        if (typeof l === "function") l(new Event("voiceschanged"));
    },
  };
}

describe("Korean speech playback", () => {
  it("records voice availability and lifecycle without storing the spoken text", () => {
    const m = setup(),
      notify = vi.fn();
    const un = m.service.subscribe(notify);
    m.setVoices([voice("en-US"), voice("ko-KR")]);
    m.service.refreshVoices();
    expect(m.service.snapshot()).toMatchObject({
      koreanVoices: 1,
      voice: "ko-KR",
      status: "idle",
    });
    m.service.speak(Symbol(), "사적인 문장", NORMAL_RATE, vi.fn());
    expect(m.service.snapshot()).toMatchObject({
      requested: true,
      started: false,
      status: "requested",
    });
    expect(JSON.stringify(m.service.snapshot())).not.toContain("사적인");
    m.utterances[0].onstart?.({} as SpeechSynthesisEvent);
    expect(m.service.snapshot()).toMatchObject({
      started: true,
      status: "started",
    });
    m.utterances[0].onend?.({} as SpeechSynthesisEvent);
    expect(m.service.snapshot().status).toBe("ended");
    expect(notify).toHaveBeenCalled();
    un();
  });
  it("reports missing voices and browser errors without accepting an English voice", () => {
    const m = setup();
    m.setVoices([voice("en-US")]);
    m.service.speak(Symbol(), "안녕", NORMAL_RATE, vi.fn());
    expect(m.service.snapshot()).toMatchObject({
      status: "failed",
      error: "no-korean-voice",
      koreanVoices: 0,
    });
    m.setVoices([voice("ko-KR")]);
    m.service.speak(Symbol(), "안녕", NORMAL_RATE, vi.fn());
    m.utterances[0].onerror?.({
      error: "not-allowed",
    } as SpeechSynthesisErrorEvent);
    expect(m.service.snapshot()).toMatchObject({
      status: "failed",
      error: "not-allowed",
    });
  });
  it("ignores late lifecycle callbacks from replaced playback", () => {
    const m = setup();
    m.setVoices([voice("ko-KR")]);
    m.service.speak(Symbol(), "가", NORMAL_RATE, vi.fn());
    m.service.speak(Symbol(), "나", NORMAL_RATE, vi.fn());
    m.utterances[0].onend?.({} as SpeechSynthesisEvent);
    expect(m.service.snapshot().status).toBe("requested");
    m.utterances[1].onstart?.({} as SpeechSynthesisEvent);
    expect(m.service.snapshot().status).toBe("started");
  });
  it("records requested rate and elapsed event duration", () => {
    const m = setup();
    m.setVoices([voice("ko-KR")]);
    const clock = vi.spyOn(performance, "now");
    clock.mockReturnValueOnce(100).mockReturnValueOnce(1600);
    m.service.speak(Symbol(), "안녕", NORMAL_RATE, vi.fn());
    expect(m.service.snapshot().rate).toBe(0.8);
    m.utterances[0].onstart?.({} as SpeechSynthesisEvent);
    m.utterances[0].onend?.({} as SpeechSynthesisEvent);
    expect(m.service.snapshot().durationMs).toBe(1500);
    clock.mockRestore();
  });
  it("starts directly with a fresh utterance and the same selected voice", () => {
    const m = setup(),
      kr = voice("ko-KR");
    m.setVoices([kr]);
    m.service.speak(Symbol(), "안녕", NORMAL_RATE, vi.fn());
    m.service.speak(Symbol(), "안녕", NORMAL_RATE, vi.fn());
    expect(m.utterances[0]).not.toBe(m.utterances[1]);
    expect(m.utterances.map((u) => u.voice)).toEqual([kr, kr]);
    expect(m.utterances.map((u) => u.rate)).toEqual([NORMAL_RATE, NORMAL_RATE]);
  });
  it("prefers ko-KR, accepts a Korean language tag, and never selects English or kok", () => {
    const kr = voice("ko-KR"),
      other = voice("ko"),
      en = voice("en-US");
    expect(koreanVoice([en, other, kr])).toBe(kr);
    expect(koreanVoice([en, voice("KO_kr")])?.lang).toBe("KO_kr");
    expect(koreanVoice([voice("kok-IN"), en])).toBeUndefined();
  });
  it("primes and watches asynchronously loaded voices without speaking outside a tap", () => {
    const m = setup(),
      ready = vi.fn(),
      error = vi.fn(),
      owner = Symbol();
    const unwatch = m.service.watchVoices(ready);
    expect(m.synth.getVoices).toHaveBeenCalled();
    expect(m.service.speak(owner, "안녕", NORMAL_RATE, error)).toBe(false);
    expect(error).toHaveBeenCalledWith(VOICE_UNAVAILABLE);
    expect(m.synth.speak).not.toHaveBeenCalled();
    m.setVoices([voice("en-US"), voice("ko-KR")]);
    m.changed();
    expect(ready).toHaveBeenCalledOnce();
    expect(m.synth.speak).not.toHaveBeenCalled();
    expect(m.service.speak(owner, "안녕", NORMAL_RATE, error)).toBe(true);
    expect(m.synth.speak).toHaveBeenCalledOnce();
    expect(m.utterances[0]).toMatchObject({
      text: "안녕",
      lang: "ko-KR",
      rate: 0.8,
    });
    unwatch();
    expect(m.synth.removeEventListener).toHaveBeenCalledOnce();
  });
  it("continues watching when only non-Korean voices initially load", () => {
    const m = setup(),
      ready = vi.fn(),
      error = vi.fn();
    m.setVoices([voice("en-US")]);
    const unwatch = m.service.watchVoices(ready);
    expect(ready).not.toHaveBeenCalled();
    expect(m.service.speak(Symbol(), "안녕", NORMAL_RATE, error)).toBe(false);
    m.setVoices([voice("en-US"), voice("ko-KR")]);
    m.changed();
    expect(ready).toHaveBeenCalledOnce();
    expect(m.synth.speak).not.toHaveBeenCalled();
    unwatch();
  });
  it("calls speak synchronously on each tap and replaces an earlier request", () => {
    const m = setup(),
      error = vi.fn(),
      owner = Symbol();
    m.setVoices([voice("ko-KR")]);
    expect(m.service.speak(owner, "사랑해", NORMAL_RATE, error)).toBe(true);
    expect(m.synth.speak).toHaveBeenCalledTimes(1);
    expect(m.service.speak(owner, "보고 싶어", NORMAL_RATE, error)).toBe(true);
    expect(m.synth.cancel).toHaveBeenCalledOnce();
    expect(m.synth.speak).toHaveBeenCalledTimes(2);
    expect(m.utterances[1]).toMatchObject({ text: "보고 싶어", rate: 0.8 });
    m.utterances[0].onerror?.({
      error: "audio-busy",
    } as SpeechSynthesisErrorEvent);
    expect(error).not.toHaveBeenCalled();
    m.utterances[1].onerror?.({
      error: "interrupted",
    } as SpeechSynthesisErrorEvent);
    expect(error).not.toHaveBeenCalled();
  });
  it("stops only the owner that is leaving, allowing a new lesson to play", () => {
    const m = setup(),
      error = vi.fn(),
      first = Symbol(),
      next = Symbol();
    m.setVoices([voice("ko-KR")]);
    m.service.speak(first, "안녕", NORMAL_RATE, error);
    m.service.speak(next, "고마워", NORMAL_RATE, error);
    m.service.stop(first);
    expect(m.synth.cancel).toHaveBeenCalledTimes(1);
    m.service.stop(next);
    expect(m.synth.cancel).toHaveBeenCalledTimes(2);
    m.service.speak(first, "잘 자", NORMAL_RATE, error);
    expect(m.utterances[2].text).toBe("잘 자");
  });
  it("does not fall back to an English voice and reports real playback errors", () => {
    const m = setup(),
      error = vi.fn();
    m.setVoices([voice("en-US")]);
    expect(m.service.speak(Symbol(), "안녕", NORMAL_RATE, error)).toBe(false);
    expect(error).toHaveBeenCalledWith(VOICE_UNAVAILABLE);
    expect(m.synth.speak).not.toHaveBeenCalled();
    m.setVoices([voice("ko-KR")]);
    m.service.speak(Symbol(), "안녕", NORMAL_RATE, error);
    m.utterances[0].onerror?.({
      error: "audio-busy",
    } as SpeechSynthesisErrorEvent);
    expect(error).toHaveBeenLastCalledWith(PLAYBACK_FAILED);
  });
  it("stops an earlier phrase if a new tap finds the Korean voice unavailable", () => {
    const m = setup(),
      error = vi.fn(),
      owner = Symbol();
    m.setVoices([voice("ko-KR")]);
    m.service.speak(owner, "안녕", NORMAL_RATE, error);
    m.setVoices([voice("en-US")]);
    expect(m.service.speak(owner, "고마워", NORMAL_RATE, error)).toBe(false);
    expect(m.synth.cancel).toHaveBeenCalledOnce();
    expect(m.synth.speak).toHaveBeenCalledOnce();
    expect(error).toHaveBeenLastCalledWith(VOICE_UNAVAILABLE);
    m.utterances[0].onerror?.({
      error: "audio-busy",
    } as SpeechSynthesisErrorEvent);
    expect(error).toHaveBeenCalledTimes(1);
  });
  it("resumes an already-paused synthesizer before starting", () => {
    const m = setup();
    m.setVoices([voice("ko-KR")]);
    m.synth.paused = true;
    m.service.speak(Symbol(), "안녕", NORMAL_RATE, vi.fn());
    expect(m.synth.resume).toHaveBeenCalledOnce();
    expect(m.synth.speak).toHaveBeenCalledOnce();
  });
  it("reports a synchronous browser failure instead of claiming playback started", () => {
    const m = setup(),
      error = vi.fn();
    m.setVoices([voice("ko-KR")]);
    m.synth.speak.mockImplementation(() => {
      throw Error("unavailable");
    });
    expect(m.service.speak(Symbol(), "안녕", NORMAL_RATE, error)).toBe(false);
    expect(error).toHaveBeenCalledWith(PLAYBACK_FAILED);
  });
});
