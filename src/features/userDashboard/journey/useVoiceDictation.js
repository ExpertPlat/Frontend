import { useCallback, useEffect, useRef, useState } from 'react';

const LOCALES = { ar: 'ar-SA', en: 'en-US', fr: 'fr-FR', tr: 'tr-TR' };

/**
 * Voice-to-text for the case description.
 * Uses the browser's Web Speech API (no audio ever leaves the page through SolveIt). Hidden when unsupported.
 */
export function useVoiceDictation({ language, onText }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const timers = useRef([]);
  const recognition = useRef(null);
  const base = useRef('');
  const Speech = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const supported = !!Speech;

  const clear = () => { timers.current.forEach((id) => window.clearInterval(id)); timers.current = []; };
  useEffect(() => () => { clear(); recognition.current?.abort?.(); }, []);

  const start = useCallback(async (current = '') => {
    clear(); setSeconds(0); setDone(false); setRecording(true);
    timers.current.push(window.setInterval(() => setSeconds((value) => value + 1), 1000));
    base.current = current ? `${current.trim()} ` : '';
    const engine = new Speech();
    engine.lang = LOCALES[language] || 'ar-SA'; engine.continuous = true; engine.interimResults = true;
    engine.onresult = (event) => { onText(base.current + Array.from(event.results).map((r) => r[0].transcript).join(' ')); };
    engine.onerror = () => { clear(); setRecording(false); };
    engine.onend = () => { clear(); setRecording(false); setDone(true); };
    recognition.current = engine; engine.start();
  }, [Speech, language, onText]);

  const stop = useCallback((hasText) => { clear(); recognition.current?.stop?.(); setRecording(false); setDone(!!hasText); }, []);
  return { supported, recording, seconds, done, start, stop };
}
