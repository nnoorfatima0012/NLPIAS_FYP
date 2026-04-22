// client/src/pages/Candidate/Interview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../utils/api";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:5000";

// Inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("iv-keyframes")) {
  const style = document.createElement("style");
  style.id = "iv-keyframes";
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse-dot { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.5; transform:scale(1.3); } }
    @keyframes fade-in { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
  `;
  document.head.appendChild(style);
}

// ── Browser TTS: speak text once, cancel any ongoing speech first ──
function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95;
  utt.pitch = 1;
  utt.lang = "en-US";
  window.speechSynthesis.speak(utt);
}

function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}


// ── Check browser support ──
const hasSpeechSynthesis = typeof window !== "undefined" && !!window.speechSynthesis;
const hasSpeechRecognition =
  typeof window !== "undefined" &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export default function Interview() {
  const { appId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answeredIds, setAnsweredIds] = useState(new Set());

  const [answerText, setAnswerText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [exitConfirm, setExitConfirm] = useState(false);

  // proctor signals
  const startAtRef = useRef(Date.now());
  const tabSwitchRef = useRef(0);
  const pasteRef = useRef(0);
  const hiddenMsRef = useRef(0);
  const hiddenAtRef = useRef(null);

  

  const resetSignals = () => {
    startAtRef.current = Date.now();
    tabSwitchRef.current = 0;
    pasteRef.current = 0;
    hiddenMsRef.current = 0;
    hiddenAtRef.current = null;
    transcriptWordCountRef.current = 0;
    audioDurationRef.current = 0;
  };

  const currentQuestion = useMemo(() => questions[idx], [questions, idx]);

  // ── Security state ──
  const [focusLost, setFocusLost] = useState(false);
  const [fsRefused, setFsRefused] = useState(false);

  // ── VOICE state ──
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [liveTranscript, setLiveTranscript] = useState(""); // NEW: live text while recording
  const [questionSpeaking, setQuestionSpeaking] = useState(false); // NEW: TTS state

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const transcriptWordCountRef = useRef(0);
  const audioDurationRef = useRef(0);
  const recordingStartRef = useRef(null);
  const speechRecogRef = useRef(null);     // NEW: SpeechRecognition instance
  const liveTranscriptRef = useRef("");    // NEW: accumulates live text across recognition restarts
  const generationPollRef = useRef(null);
  const answerPollRef = useRef(null);
  const hasStartedRef = useRef(false);



    const pollInterviewGeneration = (appId) => {
  if (generationPollRef.current) return;

  const maxAttempts = 60;
  let attempts = 0;

  generationPollRef.current = setInterval(async () => {
    attempts += 1;

    try {
      const res = await api.get(`/interview/${appId}/status?t=${Date.now()}`);
      const data = res.data;
      const generationStatus = data?.generationStatus;

      if (
        generationStatus === "completed" &&
        Array.isArray(data.questions) &&
        data.questions.length > 0
      ) {
        clearInterval(generationPollRef.current);
        generationPollRef.current = null;

        
        const allQuestions = Array.isArray(data.questions) ? data.questions : [];
        const existingAnswers = data.answers || [];
        const doneIds = new Set(
          existingAnswers.map((a) => Number(a.questionId))
        );

        setInterviewId(data.interviewId);
        setAnsweredIds(doneIds);
        setQuestions(allQuestions);

        const firstUnanswered = allQuestions.findIndex(
          (q) => !doneIds.has(Number(q.questionId))
        );

        setIdx(firstUnanswered === -1 ? 0 : firstUnanswered);
        setAnswerText("");
        setFeedback(null);
        setFinalResult(null);
        resetSignals();
        setLoading(false);
        return;
      }

      if (generationStatus === "failed") {
        clearInterval(generationPollRef.current);
        generationPollRef.current = null;
        setLoading(false);
        alert("Interview question generation failed.");
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(generationPollRef.current);
        generationPollRef.current = null;
        setLoading(false);
        alert("Interview generation is taking too long. Please refresh.");
      }
    } catch (err) {
      console.error("Interview generation poll failed:", err);
      clearInterval(generationPollRef.current);
      generationPollRef.current = null;
      setLoading(false);
      alert("Failed to check interview generation status.");
    }
  }, 3000);
};

    const pollAnswerEvaluation = (interviewId, questionId) => {
    const maxAttempts = 60;
    let attempts = 0;

    answerPollRef.current = setInterval(async () => {
      attempts += 1;

      try {
        const res = await api.get(
  `/interview/${interviewId}/answer-status/${questionId}?t=${Date.now()}`
);
        const status = res.data?.status;

        if (status === "completed") {
          clearInterval(answerPollRef.current);
          answerPollRef.current = null;
          setFeedback({
            score: res.data.score,
            feedback: res.data.feedback,
            grading: res.data.grading || {},
            aiAnalysis: res.data.aiAnalysis || {},
            cheatingRisk: res.data.cheatingRisk || 0,
          });

          setAnsweredIds(
            (prev) => new Set([...prev, Number(questionId)])
          );
          return;
        }

        if (status === "failed") {
          clearInterval(answerPollRef.current);
          answerPollRef.current = null;
          alert(res.data?.error || "Answer evaluation failed.");
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(answerPollRef.current);
          answerPollRef.current = null;
          alert("Answer evaluation is taking too long.");
        }
      } catch (err) {
        console.error("Answer evaluation poll failed:", err);
        clearInterval(answerPollRef.current);
        answerPollRef.current = null;
        alert("Failed to check answer evaluation status.");
      }
    }, 2500);
  };


  // ── NEW: Speak question aloud when voice mode is on and question changes ──
  useEffect(() => {
    if (!voiceMode || !currentQuestion?.question || !hasSpeechSynthesis) return;
    // Small delay so UI renders first
    const t = setTimeout(() => {
      setQuestionSpeaking(true);
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(currentQuestion.question);
      utt.rate = 0.95;
      utt.pitch = 1;
      utt.lang = "en-US";
      utt.onend = () => setQuestionSpeaking(false);
      utt.onerror = () => setQuestionSpeaking(false);
      window.speechSynthesis.speak(utt);
    }, 400);
    return () => {
      clearTimeout(t);
      stopSpeaking();
      setQuestionSpeaking(false);
    };
  }, [voiceMode, idx]); // re-runs when mode or question index changes

  // ── Stop TTS when voice mode is turned off ──
  useEffect(() => {
    if (!voiceMode) {
      stopSpeaking();
      setQuestionSpeaking(false);
    }
  }, [voiceMode]);

  // ── VOICE: stop recording and cleanup without triggering transcription ──
  const stopRecordingCleanup = () => {
    // Stop SpeechRecognition
    if (speechRecogRef.current) {
      try { speechRecogRef.current.stop(); } catch (_) {}
      speechRecogRef.current = null;
    }
    liveTranscriptRef.current = "";
    setLiveTranscript("");

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    }
    if (mediaRecorderRef.current) {
      try {
        const stream = mediaRecorderRef.current.stream;
        if (stream) stream.getTracks().forEach((t) => t.stop());
      } catch (_) {}
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setRecording(false);
    setTranscribing(false);
  };



  // ── Security + proctor tracking ──
  useEffect(() => {
    const requestFs = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (_) {
        setFsRefused(true);
      }
    };
    requestFs();

    const onFsChange = () => {
      if (!document.fullscreenElement) requestFs();
    };

    const noContext = (e) => e.preventDefault();

    const noKeys = (e) => {
      const k = e.key?.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (["c", "v", "x", "a", "u", "s", "p", "tab"].includes(k)) {
          e.preventDefault(); e.stopPropagation(); return;
        }
      }
      if (e.altKey && k === "tab") { e.preventDefault(); e.stopPropagation(); return; }
      if (e.metaKey && ["arrowleft","arrowright","arrowup","arrowdown","d","m"].includes(k)) {
        e.preventDefault(); e.stopPropagation(); return;
      }
      if (k === "f11") { e.preventDefault(); e.stopPropagation(); return; }
      if (k === "escape") { e.preventDefault(); e.stopPropagation(); return; }
    };

    const noSelect = (e) => e.preventDefault();

    const onVis = () => {
      if (document.hidden) {
        tabSwitchRef.current += 1;
        hiddenAtRef.current = Date.now();
        setFocusLost(true);
      } else if (hiddenAtRef.current) {
        hiddenMsRef.current += Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
      }
    };
    const onBlur = () => {
      tabSwitchRef.current += 1;
      hiddenAtRef.current = Date.now();
      setFocusLost(true);
    };
    const onFocus = () => {
      if (hiddenAtRef.current) {
        hiddenMsRef.current += Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
      }
      setFocusLost(false);
    };
    const noResize = () => {
      if (
        window.outerWidth  < window.screen.availWidth  * 0.85 ||
        window.outerHeight < window.screen.availHeight * 0.85
      ) {
        try { window.resizeTo(window.screen.availWidth, window.screen.availHeight); } catch (_) {}
      }
    };

    document.addEventListener("fullscreenchange",  onFsChange);
    document.addEventListener("contextmenu",       noContext);
    document.addEventListener("keydown",           noKeys,   true);
    document.addEventListener("selectstart",       noSelect);
    document.addEventListener("visibilitychange",  onVis);
    window.addEventListener("blur",                onBlur);
    window.addEventListener("focus",               onFocus);
    window.addEventListener("resize",              noResize);

    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      document.removeEventListener("fullscreenchange",  onFsChange);
      document.removeEventListener("contextmenu",       noContext);
      document.removeEventListener("keydown",           noKeys,   true);
      document.removeEventListener("selectstart",       noSelect);
      document.removeEventListener("visibilitychange",  onVis);
      window.removeEventListener("blur",                onBlur);
      window.removeEventListener("focus",               onFocus);
      window.removeEventListener("resize",              noResize);
    };
  }, []);


  useEffect(() => {
  return () => {
    if (generationPollRef.current) {
      clearInterval(generationPollRef.current);
      generationPollRef.current = null;
    }

    if (answerPollRef.current) {
      clearInterval(answerPollRef.current);
      answerPollRef.current = null;
    }
  };
}, []);
 //start/interview
  useEffect(() => {
  if (hasStartedRef.current) return;
  hasStartedRef.current = true;

  let cancelled = false;

  (async () => {
    try {
      setLoading(true);

      const res = await api.post(`/interview/${appId}/start`, {});
      if (cancelled) return;

      const data = res.data;

      setInterviewId(data.interviewId || null);

      if (data.generationStatus === "pending" ||
  (data.generationStatus === "completed" && (!Array.isArray(data.questions) || data.questions.length === 0))
) {
        setQuestions([]);
        pollInterviewGeneration(appId);
        return;
      }

      const allQuestions = data.questions || [];
      const existingAnswers = data.answers || [];
      const doneIds = new Set(
        existingAnswers.map((a) => Number(a.questionId))
      );

      setAnsweredIds(doneIds);
      setQuestions(allQuestions);

      const firstUnanswered = allQuestions.findIndex(
        (q) => !doneIds.has(Number(q.questionId))
      );

      setIdx(firstUnanswered === -1 ? 0 : firstUnanswered);
      setAnswerText("");
      setFeedback(null);
      setFinalResult(null);
      resetSignals();
      setLoading(false);
    } catch (e) {
      console.error("start interview error:", e);
      if (!cancelled) {
        alert(e?.response?.data?.message || "Failed to start interview.");
        navigate("/candidate/interview-invitation");
        setLoading(false);
      }
    }
  })();

  return () => {
    cancelled = true;
  };
}, [appId, navigate]);
 
  // reset on question change
  useEffect(() => {
    setAnswerText("");
    setFeedback(null);
    setVoiceError("");
    setLiveTranscript("");         // NEW: clear live transcript
    liveTranscriptRef.current = ""; // NEW
    stopRecordingCleanup();
    resetSignals();
  }, [idx]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopRecordingCleanup();
    };
  }, []);

  const isAnswered = currentQuestion
    ? answeredIds.has(Number(currentQuestion.questionId))
    : false;

  // ── NEW: Start SpeechRecognition for live transcript display ──
  const startLiveTranscript = () => {
    if (!hasSpeechRecognition) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    recog.onresult = (e) => {
      let interim = "";
      let finalPart = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalPart += t + " ";
        } else {
          interim += t;
        }
      }
      if (finalPart) {
        liveTranscriptRef.current += finalPart;
      }
      // Show accumulated final + current interim
      setLiveTranscript(liveTranscriptRef.current + interim);
    };

    recog.onerror = () => {}; // silent — Whisper handles the real transcription
    recog.onend = () => {
      // Auto-restart while still recording (browser cuts off after ~60s)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        try { recog.start(); } catch (_) {}
      }
    };

    try {
      recog.start();
      speechRecogRef.current = recog;
    } catch (_) {}
  };

  // ── VOICE: start recording ──
  const startRecording = async () => {
    setVoiceError("");
    setLiveTranscript("");          // NEW: clear live transcript
    liveTranscriptRef.current = ""; // NEW
    audioChunksRef.current = [];

    // Stop TTS if question is still being read
    stopSpeaking();
    setQuestionSpeaking(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mr;
      recordingStartRef.current = Date.now();

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        audioDurationRef.current = (Date.now() - recordingStartRef.current) / 1000;
        // Stop SpeechRecognition
        if (speechRecogRef.current) {
          try { speechRecogRef.current.stop(); } catch (_) {}
          speechRecogRef.current = null;
        }
        await handleTranscribe();
      };

      mr.start(200);
      setRecording(true);

      // NEW: start live transcript display alongside recording
      startLiveTranscript();
    } catch (err) {
      setVoiceError(
        err?.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone access and try again."
          : "Could not access microphone. Please check your device settings."
      );
    }
  };

  // ── VOICE: stop recording ──
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  // ── VOICE: send audio to /api/transcribe, fill textarea ──
  const handleTranscribe = async () => {
    if (!audioChunksRef.current || audioChunksRef.current.length === 0) {
      setVoiceError("No audio was captured. Please try recording again.");
      return;
    }

    setTranscribing(true);
    setVoiceError("");

    try {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      audioChunksRef.current = [];

      const formData = new FormData();
      formData.append("audio", blob, "answer.webm");

      const res = await api.post("/transcribe", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
          },
            timeout: 30000,
        });

      const transcript = res.data.transcript || "";
      const wordCount = res.data.word_count || 0;
      const serverDuration = res.data.duration_sec;

      transcriptWordCountRef.current = wordCount;
      if (serverDuration) audioDurationRef.current = serverDuration;

      // Replace live transcript with final Whisper transcript
      setLiveTranscript("");
      setAnswerText(transcript);

      if (!transcript.trim()) {
        setVoiceError("No speech detected. Please speak clearly and try again.");
      }
    } catch (err) {
      setVoiceError(
        err?.response?.data?.message ||
        "Transcription failed. Please try again or type your answer below."
      );
    } finally {
      setTranscribing(false);
    }
  };


  const submit = async () => {
  if (!interviewId || !currentQuestion) return;
  if (!answerText.trim()) return alert("Please write an answer.");
  if (isAnswered) return;

  setSubmitting(true);
  const timeTakenSec = Math.max(0, Math.round((Date.now() - startAtRef.current) / 1000));

  const finalWordCount = answerText.trim().split(/\s+/).filter(Boolean).length;
  const editRatio = transcriptWordCountRef.current > 0
    ? Math.round((finalWordCount / transcriptWordCountRef.current) * 100) / 100
    : null;
  const wordsPerSec = audioDurationRef.current > 0
    ? Math.round((transcriptWordCountRef.current / audioDurationRef.current) * 100) / 100
    : null;

  const payload = {
    questionId: currentQuestion.questionId,
    answerText: answerText.trim(),
    timeTakenSec,
    tabSwitchCount: tabSwitchRef.current,
    pasteCount: pasteRef.current,
    hiddenTimeMs: hiddenMsRef.current,
    answerMode: voiceMode ? "voice" : "text",
    voiceEditRatio: voiceMode ? editRatio : null,
    voiceWordsPerSec: voiceMode ? wordsPerSec : null,
  };

  try {
    const res = await api.post(`/interview/${interviewId}/answer`, payload);

    if (res.data?.evaluationStatus === "pending") {
      pollAnswerEvaluation(interviewId, currentQuestion.questionId);
    }
  } catch (e) {
    alert(e?.response?.data?.message || "Failed to submit answer.");
  } finally {
    setSubmitting(false);
  }
};

  const next = () => {
    if (idx < questions.length - 1) setIdx((v) => v + 1);
  };

  const finish = async () => {
    try {
      const res = await api.post(`/interview/${interviewId}/complete`, {});
      setFinalResult(res.data);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to complete interview.");
    }
  };

  const allAnswered = questions.length > 0 && answeredIds.size >= questions.length;
  const progress = questions.length > 0 ? (answeredIds.size / questions.length) * 100 : 0;

  const diffColor = { easy: "#16a34a", medium: "#d97706", hard: "#dc2626" };
  const typeColor = { technical: "#2563eb", behavioral: "#7c3aed", situational: "#0891b2" };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingText}>Preparing your interview…</p>
      </div>
    );
  }

  /* ── Completed ── */
  if (finalResult) {
    const score = finalResult.overallScore ?? 0;
    const risk = finalResult.finalCheatingRisk ?? 0;
    const scoreColor = score >= 7 ? "#16a34a" : score >= 4 ? "#d97706" : "#dc2626";
    return (
      <div style={s.page}>
        <div style={s.completedCard}>
          <div style={{ ...s.completedIcon, background: scoreColor + "18", color: scoreColor }}>✓</div>
          <h2 style={s.completedTitle}>Interview Completed</h2>
          <p style={s.completedSub}>Your responses have been recorded and sent for review.</p>
          <div style={s.scoreRow}>
            <div style={s.scoreBox}>
              <span style={{ ...s.scoreBig, color: scoreColor }}>{score.toFixed(1)}</span>
              <span style={s.scoreLabel}>Overall Score</span>
            </div>
            <div style={s.scoreDivider} />
            <div style={s.scoreBox}>
              <span style={{ ...s.scoreBig, color: risk > 60 ? "#dc2626" : risk > 30 ? "#d97706" : "#16a34a" }}>
                {Math.round(risk)}%
              </span>
              <span style={s.scoreLabel}>Integrity Risk</span>
            </div>
          </div>
          <div style={s.waitingNote}>
            <span style={s.waitingIcon}>⏳</span>
            <div>
              <p style={s.waitingTitle}>Awaiting recruiter review</p>
              <p style={s.waitingSub}>You'll be contacted if selected for the next stage.</p>
            </div>
          </div>
          <button style={s.dashBtn} onClick={() => navigate("/candidate/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── No questions ── */
  if (!questions.length) {
  return (
    <div style={s.loadingWrap}>
      <div style={s.spinner} />
      <p style={s.loadingText}>Still preparing questions…</p>
    </div>
  );
}

  const diff = (currentQuestion.difficulty || "").toLowerCase();
  const type = (currentQuestion.type || "").toLowerCase();

  return (
    <div style={s.page}>

      {/* ── Fullscreen refused ── */}
      {fsRefused && (
        <div style={s.modalBackdrop}>
          <div style={s.modal}>
            <p style={s.modalTitle}>Fullscreen Required</p>
            <p style={s.modalSub}>
              This interview must run in fullscreen mode to prevent tab switching
              and screen splitting. Please click the button below to continue.
            </p>
            <div style={s.modalBtns}>
              <button
                style={{ ...s.modalExit, background: "#2563eb" }}
                onClick={async () => {
                  try { await document.documentElement.requestFullscreen(); setFsRefused(false); } catch (_) {}
                }}
              >
                Enter Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Focus-lost overlay ── */}
      {focusLost && (
        <div style={s.focusLostOverlay}>
          <div style={s.focusLostBox}>
            <div style={s.focusLostIcon}>⚠</div>
            <p style={s.focusLostTitle}>Interview Paused</p>
            <p style={s.focusLostSub}>
              You left the interview window. This has been recorded.<br />
              Click below to return to your interview.
            </p>
            <button
              style={s.focusReturnBtn}
              onClick={() => {
                setFocusLost(false);
                if (!document.fullscreenElement)
                  document.documentElement.requestFullscreen().catch(() => {});
              }}
            >
              Return to Interview
            </button>
          </div>
        </div>
      )}

      {/* ── Exit confirm modal ── */}
      {exitConfirm && (
        <div style={s.modalBackdrop}>
          <div style={s.modal}>
            <p style={s.modalTitle}>Exit interview?</p>
            <p style={s.modalSub}>Your progress is saved. You can resume later if the time window is still open.</p>
            <div style={s.modalBtns}>
              <button style={s.modalCancel} onClick={() => setExitConfirm(false)}>Stay</button>
              <button style={s.modalExit} onClick={() => navigate("/candidate/interview-invitation")}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.headerTitle}>Interview</span>
          <span style={s.headerSep}>·</span>
          <span style={s.headerSub}>Question {idx + 1} of {questions.length}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={s.modeToggle}>
            <button
              style={{ ...s.modeBtn, background: !voiceMode ? "#2563eb" : "#f1f5f9", color: !voiceMode ? "#fff" : "#64748b" }}
              onClick={() => { setVoiceMode(false); stopRecordingCleanup(); setVoiceError(""); }}
            >
              {/* text icon: pencil SVG */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5, verticalAlign: "middle" }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Text
            </button>
            <button
              style={{ ...s.modeBtn, background: voiceMode ? "#2563eb" : "#f1f5f9", color: voiceMode ? "#fff" : "#64748b" }}
              onClick={() => { setVoiceMode(true); setVoiceError(""); }}
            >
              {/* mic icon SVG */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5, verticalAlign: "middle" }}>
                <rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
              </svg>
              Voice
            </button>
          </div>
          <button style={s.exitBtn} onClick={() => setExitConfirm(true)}>Exit</button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${progress}%` }} />
      </div>
      <div style={s.progressDots}>
        {questions.map((q, i) => {
          const done = answeredIds.has(Number(q.questionId));
          const active = i === idx;
          return (
            <div key={i} title={`Q${i + 1}`} style={{
              ...s.dot,
              background: done ? "#2563eb" : active ? "#93c5fd" : "#e2e8f0",
              transform: active ? "scale(1.3)" : "scale(1)",
            }} />
          );
        })}
      </div>

      {/* ── Question card ── */}
      <div style={s.questionCard}>
        <div style={s.questionMeta}>
          <span style={{ ...s.metaPill, background: (typeColor[type] || "#64748b") + "18", color: typeColor[type] || "#64748b" }}>
            {currentQuestion.type || "General"}
          </span>
          <span style={{ ...s.metaPill, background: (diffColor[diff] || "#64748b") + "18", color: diffColor[diff] || "#64748b" }}>
            {currentQuestion.difficulty || "—"}
          </span>
          {currentQuestion.skill && <span style={s.skillPill}>{currentQuestion.skill}</span>}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <p style={s.questionText}>{currentQuestion.question}</p>

          {/* NEW: TTS replay button — only in voice mode */}
          {voiceMode && hasSpeechSynthesis && !isAnswered && (
            <button
              style={s.speakBtn}
              title={questionSpeaking ? "Reading question…" : "Read question aloud"}
              onClick={() => {
                if (questionSpeaking) {
                  stopSpeaking();
                  setQuestionSpeaking(false);
                } else {
                  setQuestionSpeaking(true);
                  const utt = new SpeechSynthesisUtterance(currentQuestion.question);
                  utt.rate = 0.95; utt.pitch = 1; utt.lang = "en-US";
                  utt.onend = () => setQuestionSpeaking(false);
                  utt.onerror = () => setQuestionSpeaking(false);
                  window.speechSynthesis.speak(utt);
                }
              }}
            >
              {questionSpeaking ? (
                // stop/speaker-off icon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : (
                // speaker/volume icon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
          )}
        </div>

        {/* NEW: TTS status bar — shown while question is being read */}
        {voiceMode && questionSpeaking && (
          <div style={s.speakingBar}>
            <div style={s.speakingDot} />
            <span style={s.speakingText}>Reading question aloud… click the speaker icon to stop</span>
          </div>
        )}
      </div>

      {/* ── Answer area ── */}
      <div style={s.answerWrap}>
        <textarea
          rows={7}
          value={recording ? liveTranscript : answerText}
          onPaste={(e) => { pasteRef.current += 1; e.preventDefault(); }}
          onChange={(e) => {
            if (!recording) setAnswerText(e.target.value);
          }}
          disabled={isAnswered || transcribing}
          style={{
            ...s.textarea,
            opacity: (isAnswered || transcribing) ? 0.6 : 1,
            // NEW: blue border tint while live transcript is streaming
            borderColor: recording ? "#93c5fd" : "#e2e8f0",
          }}
          placeholder={
            isAnswered
              ? "Answer already submitted for this question."
              : transcribing
              ? "Transcribing your voice answer…"
              : recording
              ? "Listening… your words will appear here as you speak."
              : voiceMode
              ? "Your transcribed answer will appear here. You can edit it before submitting."
              : "Write your answer here…"
          }
        />
        <div style={s.charCount}>
          {recording ? `${liveTranscript.length} characters (live)` : `${answerText.length} characters`}
        </div>
      </div>

      {/* ── VOICE: mic controls ── */}
      {voiceMode && !isAnswered && (
        <div style={s.voiceBar}>
          <div style={s.voiceControls}>
            {!recording && !transcribing && (
              <button style={s.micStartBtn} onClick={startRecording}>
                {/* mic icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
                </svg>
                Start Recording
              </button>
            )}

            {recording && (
              <button style={s.micStopBtn} onClick={stopRecording}>
                {/* stop/square icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                <span style={s.micRecordingDot} />
                Stop Recording
              </button>
            )}

            {transcribing && (
              <div style={s.transcribingRow}>
                <div style={s.spinnerSmall} />
                <span style={s.transcribingText}>Transcribing your answer…</span>
              </div>
            )}
          </div>

          {voiceError && <p style={s.voiceError}>{voiceError}</p>}

          <p style={s.voiceHint}>
            {recording
              ? "Speak clearly — your words are appearing above in real time. Click Stop when finished."
              : transcribing
              ? "Please wait while we finalize your transcript."
              : "Record your answer, review the transcript, edit if needed, then click Submit Answer."}
          </p>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={s.actions}>
        <div style={s.actionsLeft}>
          {!isAnswered && (
            <button
              style={{ ...s.submitBtn, opacity: (submitting || transcribing || recording) ? 0.7 : 1 }}
              onClick={submit}
              disabled={submitting || transcribing || recording || !answerText.trim()}
            >
              {submitting ? "Submitting…" : "Submit Answer"}
            </button>
          )}
          {(feedback || isAnswered) && idx < questions.length - 1 && (
            <button style={s.nextBtn} onClick={next}>Next Question →</button>
          )}
          {(feedback || isAnswered || allAnswered) && idx === questions.length - 1 && (
            <button style={s.finishBtn} onClick={finish}>Finish Interview ✓</button>
          )}
        </div>
      </div>

      {/* ── Feedback panel ── */}
      {feedback && (
  <div style={s.feedbackCard}>
    <div style={s.feedbackRow}>
      <div style={s.feedbackItem}>
        <span style={s.feedbackLabel}>Score</span>
        <span
          style={{
            ...s.feedbackVal,
            color:
              feedback.score >= 7
                ? "#16a34a"
                : feedback.score >= 4
                ? "#d97706"
                : "#dc2626",
          }}
        >
          {feedback.score} / 10
        </span>
      </div>

      <div style={s.feedbackItem}>
        <span style={s.feedbackLabel}>Integrity</span>
        <span
          style={{
            ...s.feedbackVal,
            color:
              feedback.cheatingRisk > 60
                ? "#dc2626"
                : feedback.cheatingRisk > 30
                ? "#d97706"
                : "#16a34a",
          }}
        >
          {feedback.cheatingRisk > 60
            ? "High Risk"
            : feedback.cheatingRisk > 30
            ? "Moderate"
            : "Good"}
        </span>
      </div>
    </div>

    {feedback.feedback && <p style={s.feedbackText}>{feedback.feedback}</p>}

    {feedback.grading && (
      <div style={s.gradingBox}>
        <div style={s.gradingGrid}>
          <div style={s.gradingSection}>
            <p style={s.gradingTitle}>Correctness</p>
            <p style={s.gradingValue}>
              {feedback.grading.correctness || "—"}
            </p>
          </div>

          <div style={s.gradingSection}>
            <p style={s.gradingTitle}>Completeness</p>
            <p style={s.gradingValue}>
              {feedback.grading.completeness || "—"}
            </p>
          </div>
        </div>

        {Array.isArray(feedback.grading.misconceptions) &&
          feedback.grading.misconceptions.length > 0 && (
            <div style={s.gradingSection}>
              <p style={s.gradingTitle}>Misconceptions</p>
              <ul style={s.gradingList}>
                {feedback.grading.misconceptions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

        {Array.isArray(feedback.grading.missing_points) &&
          feedback.grading.missing_points.length > 0 && (
            <div style={s.gradingSection}>
              <p style={s.gradingTitle}>Missing Points</p>
              <ul style={s.gradingList}>
                {feedback.grading.missing_points.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

        {Array.isArray(feedback.grading.matched_points) &&
          feedback.grading.matched_points.length > 0 && (
            <div style={s.gradingSection}>
              <p style={s.gradingTitle}>Matched Points</p>
              <ul style={s.gradingList}>
                {feedback.grading.matched_points.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
      </div>
    )}
  </div>
)}
    </div>
  );
}

/* ─── Styles ─── */
const s = {
  gradingBox: {
  marginTop: 14,
  borderTop: "1px solid #e2e8f0",
  paddingTop: 14,
  display: "flex",
  flexDirection: "column",
  gap: 12,
},

gradingGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
},

gradingSection: {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "10px 12px",
},

gradingTitle: {
  margin: "0 0 6px",
  fontSize: 11,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
},

gradingValue: {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
  textTransform: "capitalize",
},

gradingList: {
  margin: 0,
  paddingLeft: 18,
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.6,
},
  page: {
    maxWidth: 780, margin: "0 auto", padding: "28px 20px 60px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none",
  },
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 },
  spinner: { width: 40, height: 40, border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingText: { color: "#64748b", fontWeight: 600, margin: 0 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: 800, color: "#0f172a" },
  headerSep: { color: "#cbd5e1", fontSize: 18 },
  headerSub: { color: "#64748b", fontSize: 14, fontWeight: 600 },
  exitBtn: { padding: "7px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer" },

  progressTrack: { height: 4, background: "#e2e8f0", borderRadius: 4, marginBottom: 10, overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #2563eb, #3b82f6)", borderRadius: 4, transition: "width 0.4s ease" },
  progressDots: { display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" },
  dot: { width: 10, height: 10, borderRadius: "50%", transition: "all 0.2s ease" },

  questionCard: { background: "#fff", border: "1px solid #e2e8f0", borderLeft: "4px solid #2563eb", borderRadius: 12, padding: "20px 22px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  questionMeta: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  metaPill: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "capitalize", letterSpacing: "0.3px" },
  skillPill: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#475569", letterSpacing: "0.3px" },
  questionText: { fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.55 },

  // NEW: TTS button inside question card
  speakBtn: {
    flexShrink: 0, width: 34, height: 34, borderRadius: 8,
    border: "1px solid #e2e8f0", background: "#f1f5f9",
    color: "#2563eb", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s",
  },
  // NEW: speaking status bar
  speakingBar: {
    marginTop: 10, display: "flex", alignItems: "center", gap: 8,
    padding: "6px 10px", background: "#eff6ff", borderRadius: 6,
    animation: "fade-in 0.2s ease",
  },
  speakingDot: {
    width: 8, height: 8, borderRadius: "50%", background: "#2563eb",
    animation: "pulse-dot 1s ease-in-out infinite", flexShrink: 0,
  },
  speakingText: { fontSize: 11, color: "#2563eb", fontWeight: 600 },

  answerWrap: { position: "relative", marginBottom: 4 },
  textarea: {
    width: "100%", padding: "14px 16px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, lineHeight: 1.6, color: "#1e293b",
    background: "#fafafa", resize: "vertical", outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s",
    userSelect: "text", WebkitUserSelect: "text",
  },
  charCount: { textAlign: "right", fontSize: 11, color: "#94a3b8", marginTop: 4 },

  actions: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 10, flexWrap: "wrap" },
  actionsLeft: { display: "flex", gap: 10, flexWrap: "wrap" },
  submitBtn: { padding: "11px 22px", borderRadius: 9, border: "none", background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.25)", transition: "opacity 0.2s" },
  nextBtn: { padding: "11px 22px", borderRadius: 9, border: "1.5px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontWeight: 800, fontSize: 14, cursor: "pointer" },
  finishBtn: { padding: "11px 22px", borderRadius: 9, border: "none", background: "#16a34a", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(22,163,74,0.2)" },

  feedbackCard: { marginTop: 18, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" },
  feedbackRow: { display: "flex", gap: 32, marginBottom: 10 },
  feedbackItem: { display: "flex", flexDirection: "column", gap: 2 },
  feedbackLabel: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  feedbackVal: { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  feedbackText: { margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6, borderTop: "1px solid #e2e8f0", paddingTop: 10 },

  completedCard: { maxWidth: 500, margin: "60px auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "40px 32px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" },
  completedIcon: { width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, margin: "0 auto 20px" },
  completedTitle: { fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" },
  completedSub: { color: "#64748b", fontSize: 14, margin: "0 0 24px" },
  scoreRow: { display: "flex", justifyContent: "center", alignItems: "center", gap: 0, background: "#f8fafc", borderRadius: 12, padding: "18px 24px", marginBottom: 24 },
  scoreBox: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
  scoreBig: { fontSize: 32, fontWeight: 900 },
  scoreLabel: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 4 },
  scoreDivider: { width: 1, height: 48, background: "#e2e8f0", margin: "0 16px" },
  waitingNote: { display: "flex", alignItems: "flex-start", gap: 12, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "14px 16px", textAlign: "left", marginBottom: 24 },
  waitingIcon: { fontSize: 20, flexShrink: 0 },
  waitingTitle: { margin: 0, fontWeight: 700, fontSize: 14, color: "#1e40af" },
  waitingSub: { margin: "4px 0 0", fontSize: 12, color: "#3b82f6" },
  dashBtn: { padding: "12px 28px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" },

  focusLostOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.97)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 },
  focusLostBox: { background: "#1e293b", border: "2px solid #ef4444", borderRadius: 16, padding: "40px 36px", textAlign: "center", maxWidth: 400, boxShadow: "0 0 60px rgba(239,68,68,0.3)" },
  focusLostIcon: { fontSize: 48, marginBottom: 16, color: "#ef4444" },
  focusLostTitle: { margin: "0 0 10px", fontWeight: 800, fontSize: 22, color: "#f8fafc" },
  focusLostSub: { margin: "0 0 24px", fontSize: 14, color: "#94a3b8", lineHeight: 1.6 },
  focusReturnBtn: { padding: "12px 28px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.4)" },

  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  modal: { background: "#fff", borderRadius: 14, padding: "28px 28px 24px", width: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" },
  modalTitle: { margin: "0 0 8px", fontWeight: 800, fontSize: 18, color: "#0f172a" },
  modalSub: { margin: "0 0 22px", fontSize: 13, color: "#64748b", lineHeight: 1.5 },
  modalBtns: { display: "flex", gap: 10, justifyContent: "flex-end" },
  modalCancel: { padding: "9px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  modalExit: { padding: "9px 20px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },

  modeToggle: { display: "flex", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" },
  modeBtn: { padding: "7px 14px", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap", display: "flex", alignItems: "center" },

  voiceBar: { marginBottom: 12, padding: "14px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 },
  voiceControls: { display: "flex", alignItems: "center", gap: 12 },
  micStartBtn: { display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 9, border: "none", background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.2)" },
  micStopBtn: { display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 9, border: "none", background: "#dc2626", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px rgba(220,38,38,0.2)" },
  micDot: { width: 10, height: 10, borderRadius: "50%", background: "#fff", display: "inline-block" },
  micRecordingDot: { width: 10, height: 10, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "pulse-dot 1s ease-in-out infinite" },
  transcribingRow: { display: "flex", alignItems: "center", gap: 10 },
  spinnerSmall: { width: 18, height: 18, border: "2px solid #e2e8f0", borderTop: "2px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 },
  transcribingText: { fontSize: 13, color: "#64748b", fontWeight: 600 },
  voiceError: { margin: 0, fontSize: 12, color: "#dc2626", fontWeight: 600 },
  voiceHint: { margin: 0, fontSize: 11, color: "#94a3b8", fontStyle: "italic", lineHeight: 1.5 },
};