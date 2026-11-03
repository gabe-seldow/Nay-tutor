import { useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { getKoreanSpeech, NORMAL_RATE, SPEECH_UNSUPPORTED } from "../speech";
import type { AudioContent } from "../types";
export function Listen({
  content,
  label = "Listen",
}: {
  content: AudioContent;
  label?: string;
}) {
  const owner = useRef(Symbol("nay-audio"));
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const speech = getKoreanSpeech();
    if (!speech) return;
    let mine = false;
    const unwatch = speech.watchVoices(() => setError(""));
    const unsub = speech.subscribe(() => {
      const s = speech.snapshot();
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
        aria-label={`${playing ? "Stop" : label}: ${content.text}`}
        aria-pressed={playing}
        onClick={() => {
          const speech = getKoreanSpeech();
          if (!speech) {
            setError(SPEECH_UNSUPPORTED);
            return;
          }
          if (playing) {
            speech.stop(owner.current);
            setPlaying(false);
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
        {playing ? <Square size={16} /> : <Volume2 size={18} />}
        <span>{playing ? "Stop audio" : label}</span>
      </button>
      {error && (
        <p className="audio-error" role="status">
          {error} The written example remains available. Listening here does not
          record practice.
        </p>
      )}
    </div>
  );
}
const listeners = new Map<symbol, (active: symbol) => void>();
