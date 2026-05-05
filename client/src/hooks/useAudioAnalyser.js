import { useState, useRef, useCallback } from "react";

const useAudioAnalyser = () => {
  const [transcript, setTranscript]     = useState("");
  const [isListening, setIsListening]   = useState(false);
  const [fillerCount, setFillerCount]   = useState(0);
  const [wpm, setWpm]                   = useState(0);
  const recognitionRef                  = useRef(null);
  const wordCountRef                    = useRef(0);
  const startTimeRef                    = useRef(null);
  const fillerEventsRef                 = useRef([]);
  const isListeningRef                  = useRef(false);

  const updateIsListening = useCallback((val) => {
    setIsListening(val);
    isListeningRef.current = val;
  }, []);

  const FILLER_WORDS = [
    "um","uh","umm","uhh","like","basically",
    "actually","you know","i mean","right","so","okay"
  ];

  const startListening = useCallback(() => {
    // ALWAYS ask for mic permission first
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
          alert("Speech Recognition not supported. Use Chrome browser.");
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous      = true;
        recognition.interimResults  = true;
        recognition.lang            = "en-US";
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          updateIsListening(true);
          startTimeRef.current = Date.now();
          console.log("Mic started successfully");
        };

        recognition.onresult = (event) => {
          let interimText = "";
          let finalText   = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalText += result[0].transcript + " ";
              // Count words for WPM
              const words = result[0].transcript.trim().split(/\s+/);
              wordCountRef.current += words.length;
              // Calculate WPM
              const elapsedMin = 
                (Date.now() - startTimeRef.current) / 60000;
              const currentWpm = elapsedMin > 0
                ? Math.round(wordCountRef.current / elapsedMin)
                : 0;
              setWpm(currentWpm);
              // Detect filler words
              words.forEach(word => {
                const w = word.toLowerCase().replace(/[^a-z]/g, "");
                if (FILLER_WORDS.includes(w)) {
                  const event = {
                    word: w,
                    timestamp: (Date.now() - startTimeRef.current) / 1000
                  };
                  fillerEventsRef.current.push(event);
                  setFillerCount(prev => prev + 1);
                }
              });
            } else {
              interimText += result[0].transcript;
            }
          }

          if (finalText) {
            setTranscript(prev => {
              const base = prev.replace(/\[.*?\]$/, "").trim();
              return base ? `${base} ${finalText}` : finalText;
            });
          } else {
            setTranscript(prev => {
              const base = prev.replace(/\[.*?\]$/, "").trim();
              return base + (interimText ? ` [${interimText}]` : "");
            });
          }
        };

        recognition.onerror = (e) => {
          console.error("Speech recognition error:", e.error);
          if (e.error === "not-allowed") {
            alert("Microphone permission denied. Please allow mic access.");
            updateIsListening(false);
          }
          // Let onend handle the auto-restart for no-speech and other network errors
        };

        recognition.onend = () => {
          console.log("Mic ended. isListeningRef:", isListeningRef.current);
          // Auto-restart if still supposed to be listening
          if (recognitionRef.current && isListeningRef.current) {
            try {
              recognition.start();
            } catch (err) {
              console.error("Error auto-restarting mic:", err);
            }
          } else {
            updateIsListening(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      })
      .catch(err => {
        console.error("Mic access error:", err);
        alert("Cannot access microphone: " + err.message);
      });
  }, [updateIsListening]);

  const stopListening = useCallback(() => {
    updateIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, [updateIsListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setFillerCount(0);
    setWpm(0);
    wordCountRef.current  = 0;
    startTimeRef.current  = null;
    fillerEventsRef.current = [];
  }, []);

  return {
    transcript,
    isListening,
    fillerCount,
    wpm,
    fillerEvents: fillerEventsRef.current,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useAudioAnalyser;
