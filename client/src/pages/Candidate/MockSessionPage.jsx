// client/src/pages/Candidate/MockSessionPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./mockPages.css";
import { mockGetSession, mockSubmitAnswer, mockFinish } from "../../utils/mockApi";

export default function MockSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const current = useMemo(() => {
    if (!session) return null;
    return (
      session.questions?.find((q) => q.index === session.currentIndex) ||
      session.questions?.[0] ||
      null
    );
  }, [session]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await mockGetSession(sessionId);
      setSession(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sessionId]);

  const onSubmit = async () => {
    if (!session || !current) return;
    const trimmed = answer.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await mockSubmitAnswer({
        sessionId,
        index: current.index,
        answer: trimmed,
      });
      setSession(res.data?.session);
      setAnswer("");
    } catch (e) {
      console.error(e);
      alert("Failed to evaluate answer");
    } finally {
      setSubmitting(false);
    }
  };

  const onFinish = async () => {
    try {
      const res = await mockFinish(sessionId);
      setSession(res.data?.session);
      localStorage.setItem("mockLastCompletedSession", JSON.stringify(res.data?.session));
      alert("Session completed. Analytics updated.");
    } catch (e) {
      console.error(e);
      alert("Failed to finish session");
    }
  };

  if (loading) {
    return (
      <div className="mock-sessionPage">
        <div className="mock-sessionBody">
          <div className="mock-sessionCard">Loading…</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mock-sessionPage">
        <div className="mock-sessionBody">
          <div className="mock-sessionCard">Session not found.</div>
        </div>
      </div>
    );
  }

  const total = session.questions?.length || 0;
  const answeredCount = (session.questions || []).filter((q) => q.answer && q.answer.trim()).length;
  const isCompleted = session.status === "completed";

  return (
    <div className="mock-sessionPage">

      {/* ===== Main Body ===== */}
      <div className="mock-sessionBody">
        <div className="mock-sessionCard">
          {/* ===== Pills Row ===== */}
          <div className="mock-pillRow">
            <span className="mock-pill mock-pill--blue">
              Progress: <b>{answeredCount}</b> / <b>{total}</b>
            </span>

            <span className="mock-pill mock-pill--green">
              Skill: <b>{current?.skillTag || "General"}</b>
            </span>

            <span className="mock-pill mock-pill--orange">
              Difficulty: <b>{current?.difficulty || session.difficulty}</b>
            </span>

            {isCompleted && (
              <span className="mock-pill mock-pill--light">
                <span className="mock-pillCheck" aria-hidden="true">✓</span>
                <b>Session completed</b>
                <span className="mock-pillSep">|</span>
                Overall Score: <b>{session.overallScore ?? "N/A"}%</b>
              </span>
            )}
          </div>

          {/* ===== Question Box ===== */}
          {!isCompleted ? (
            <>
              <div className="mock-questionBox">
                <div className="mock-qLine">
                  <span className="mock-qNum">Q{(current?.index ?? 0) + 1}:</span>
                  <span className="mock-qText">{current?.question}</span>
                </div>
              </div>

              <div className="mock-answerBlock">
                <div className="mock-answerLabel">Your Answer</div>
                <textarea
                  className="mock-answerArea"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={submitting}
                />
              </div>

              <div className="mock-actionRow">
                <button
                  type="button"
                  className="mock-bigBtn mock-bigBtn--blue"
                  onClick={onSubmit}
                  disabled={submitting || !answer.trim()}
                >
                  {submitting ? "Evaluating..." : "Submit Answer"}
                </button>

                <button
                  type="button"
                  className="mock-bigBtn mock-bigBtn--orange"
                  onClick={onFinish}
                  disabled={answeredCount === 0}
                  title={answeredCount === 0 ? "Answer at least 1 question first" : ""}
                >
                  Finish Session
                </button>
              </div>
            </>
          ) : (
            <div className="mock-completedNote">
              Session completed ✅
            </div>
          )}

          {/* ===== Feedback ===== */}
          <div className="mock-divider" />

          <div className="mock-feedbackBlock">
            <div className="mock-feedbackTitle">Feedback So Far</div>

            {(session.questions || [])
              .filter((q) => q.evaluation && typeof q.evaluation.score === "number")
              .map((q) => (
                <div key={q.index} className="mock-feedbackItem">
                  <div className="mock-pillRow mock-pillRow--tight">
                    <span className="mock-pill mock-pill--light">Q{q.index + 1}</span>
                    <span className="mock-pill mock-pill--light">Skill: {q.skillTag || "General"}</span>
                    <span className="mock-pill mock-pill--light">Score: {q.evaluation.score}/10</span>
                  </div>

                  <div className="mock-feedbackQ">{q.question}</div>

                  {q.evaluation.suggestion && (
                    <div className="mock-feedbackText">
                      <b>Suggestion:</b> {q.evaluation.suggestion}
                    </div>
                  )}

                  {Array.isArray(q.evaluation.missingKeywords) && q.evaluation.missingKeywords.length > 0 && (
                    <>
                      <div className="mock-feedbackText" style={{ marginTop: 6 }}>
                        <b>Missing keywords:</b>
                      </div>
                      <ul className="mock-feedbackList">
                        {q.evaluation.missingKeywords.map((k, i) => (
                          <li key={i}>{k}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {q.evaluation.idealAnswer && (
                    <div className="mock-feedbackText" style={{ marginTop: 6 }}>
                      <b>Ideal answer:</b> {q.evaluation.idealAnswer}
                    </div>
                  )}
                </div>
              ))}

            {(session.questions || []).every((q) => !q.evaluation?.score) && (
              <div className="mock-emptyFeedback">
                No evaluations yet. Submit your first answer to see feedback.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
