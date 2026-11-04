import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import {
  getKoreanSpeech,
  NORMAL_RATE,
  SPEECH_UNSUPPORTED,
  VOICE_UNAVAILABLE,
} from "../speech";
import type { AudioContent } from "../types";
export function Listen({
  content,
  label = "Listen",
  hideText = false,
  onPlayback,
}: {
  content: AudioContent;
  label?: string;
  hideText?: boolean;
  onPlayback?: () => void;
}) {
  const owner = useRef(Symbol("nay-audio"));
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const playbackCallback = useRef(onPlayback);
  playbackCallback.current = onPlayback;
  useEffect(() => {
    const speech = getKoreanSpeech();
    if (!speech) return;
    let mine = false;
    const unwatch = speech.watchVoices(() =>
      setError((previous) => (previous === VOICE_UNAVAILABLE ? "" : previous)),
    );
    const unsub = speech.subscribe(() => {
      const s = speech.snapshot();
      if (mine && s.status === "started") playbackCallback.current?.();
      if (mine && ["ended", "failed", "cancelled"].includes(s.status)) {
        setPlaying(false);
        mine = false;
      }
    });
    const onPlay = (active: symbol) => {
      mine = active === owner.current;
      if (!mine) setPlaying(false);
    };
    const buttonOwner = owner.current;
    listeners.set(buttonOwner, onPlay);
    return () => {
      unwatch();
      unsub();
      listeners.delete(buttonOwner);
      speech.stop(buttonOwner);
    };
  }, []);
  return (
    <div className="listen-wrap">
      <button
        type="button"
        className="listen"
        aria-label={hideText ? label : `${label}: ${content.text}`}
        aria-pressed={playing}
        aria-busy={playing}
        onClick={() => {
          const speech = getKoreanSpeech();
          if (!speech) {
            setError(SPEECH_UNSUPPORTED);
            return;
          }
          setError("");
          listeners.forEach((fn) => fn(owner.current));
          const ok = speech.speak(
            owner.current,
            content.text,
            NORMAL_RATE,
            (message) => {
              setError(message);
              setPlaying(false);
            },
          );
          setPlaying(ok);
        }}
      >
        <Volume2 size={18} />
        <span>{label}</span>
      </button>
      {error && (
        <p className="audio-error" role="status">
          {error}{" "}
          {hideText
            ? "You can request written support below to continue."
            : "The written example remains available."}
        </p>
      )}
    </div>
  );
}
const listeners = new Map<symbol, (active: symbol) => void>();
