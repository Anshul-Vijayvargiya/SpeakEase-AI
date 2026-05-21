import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useTTS — Web Speech Synthesis wrapper
 *
 * Returns:
 *   speak(text, opts?)  – start speaking
 *   stop()              – cancel speech
 *   isSpeaking          – boolean reactive state
 */
const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);
  const voicesRef = useRef([]);

  // Pre-load voices (Chrome fires voiceschanged asynchronously)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  /**
   * Pick the best English voice available.
   * Priority: named natural/premium voice → any en-US → any en → default
   */
  const pickVoice = useCallback(() => {
    const voices = voicesRef.current;
    if (!voices.length) return null;

    // Preferred voice names (Chromium / macOS / Windows natural voices)
    const preferred = [
      'Google US English',
      'Microsoft Aria Online (Natural)',
      'Microsoft Jenny Online (Natural)',
      'Samantha',
      'Karen',
      'Daniel',
    ];

    for (const name of preferred) {
      const v = voices.find(v => v.name === name);
      if (v) return v;
    }

    // Fallback: any en-US female-sounding voice
    const enUS = voices.find(v => v.lang === 'en-US');
    if (enUS) return enUS;

    const en = voices.find(v => v.lang.startsWith('en'));
    return en || null;
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  /**
   * speak(text, { rate, pitch, volume })
   */
  const speak = useCallback((text, { rate = 0.92, pitch = 1.05, volume = 1 } = {}) => {
    if (!('speechSynthesis' in window) || !text) return;

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    utterance.rate   = rate;
    utterance.pitch  = pitch;
    utterance.volume = volume;

    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend   = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Chrome bug: speechSynthesis pauses after ~15s in background tab.
    // Workaround: resume every 10 seconds if still speaking.
    const resumeTimer = setInterval(() => {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 10000);

    utterance.onend = () => {
      setIsSpeaking(false);
      clearInterval(resumeTimer);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      clearInterval(resumeTimer);
    };

    window.speechSynthesis.speak(utterance);
  }, [pickVoice]);

  return { speak, stop, isSpeaking };
};

export default useTTS;
