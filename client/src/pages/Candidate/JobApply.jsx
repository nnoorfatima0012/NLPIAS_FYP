//client/src/pages/Candidate/JobApply.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../utils/api';

const money = (n) => (typeof n === 'number' ? n.toLocaleString() : '—');

const showLocation = (j) => {
  if (j.jobLocation && j.jobLocation.trim()) return j.jobLocation;
  if (j.location && j.location.trim()) return j.location;
  if (j.remote?.mustReside && j.remote?.location) {
    return `Remote (within ${j.remote.location})`;
  }
  return j.workArrangement === 'Remote' ? 'Remote' : '—';
};

export default function JobApply() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [existingApp, setExistingApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [screeningAnswers, setScreeningAnswers] = useState([]);
  const [resumeSource, setResumeSource] = useState('default');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr('');

        const [jobRes, appRes] = await Promise.all([
          api.get(`/jobs/public/${jobId}`),
          api.get(`/applications/job/${jobId}/mine`),
        ]);

        if (cancelled) return;

        const jobData = jobRes.data;
        const appData = appRes.data;

        setJob(jobData);
        setExistingApp(appData || null);

        if (
          jobData?.customQuestions &&
          Array.isArray(jobData?.screeningQuestions) &&
          jobData.screeningQuestions.length > 0
        ) {
          setScreeningAnswers(new Array(jobData.screeningQuestions.length).fill(''));
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErr(
            e?.response?.data?.message ||
              e?.response?.data?.error ||
              'Failed to load application page.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const isClosed = useMemo(() => {
    if (!job) return false;
    if (job.isClosed === true) return true;
    if (!job.applicationDeadline) return false;
    return new Date(job.applicationDeadline) < new Date();
  }, [job]);

  const handleAnswerChange = (index, value) => {
    setScreeningAnswers((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const validateAnswers = () => {
    if (
      job?.customQuestions &&
      Array.isArray(job?.screeningQuestions) &&
      job.screeningQuestions.length > 0
    ) {
      const valid =
        Array.isArray(screeningAnswers) &&
        screeningAnswers.length === job.screeningQuestions.length &&
        screeningAnswers.every((a) => typeof a === 'string' && a.trim().length > 0);

      if (!valid) {
        setErr('Please answer all screening questions.');
        return false;
      }
    }
    return true;
  };

  const handleUseManageCV = () => {
    navigate(
      `/candidate/manage-cv?jobId=${encodeURIComponent(
        job._id
      )}&title=${encodeURIComponent(job.title)}&answers=${encodeURIComponent(
        JSON.stringify(screeningAnswers)
      )}`
    );
  };

  const handleUseResumeBuilder = () => {
    navigate(
      `/candidate/resume-builder?jobId=${encodeURIComponent(
        job._id
      )}&title=${encodeURIComponent(job.title)}&answers=${encodeURIComponent(
        JSON.stringify(screeningAnswers)
      )}`
    );
  };

  const handleSubmitWithBuiltResume = async () => {
    if (!validateAnswers()) return;

    try {
      setSubmitting(true);
      setErr('');
      setSuccessMsg('');

      await api.post('/applications', {
        jobId: job._id,
        resumeSource: 'default',
        screeningAnswers,
      });

      setSuccessMsg('Application submitted successfully.');
      setTimeout(() => {
        navigate('/candidate/applied-jobs');
      }, 1000);
    } catch (e) {
      console.error(e);
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          'Failed to submit application.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading application page...</div>;
  }

  if (err && !job) {
    return <div style={{ padding: 24, color: '#dc2626' }}>{err}</div>;
  }

  if (!job) {
    return <div style={{ padding: 24 }}>Job not found.</div>;
  }

  if (existingApp) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 8 }}>You already applied to this job</h2>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          Your latest application status is: <strong>{existingApp.status}</strong>
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/candidate/applied-jobs')}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #2563eb',
              background: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            View Application
          </button>

          <button
            onClick={() => navigate('/candidate/job-search')}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#111827',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Apply for Job</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Review job details, answer required questions, and choose your resume source.
      </p>

      {err && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
          }}
        >
          {err}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
          }}
        >
          {successMsg}
        </div>
      )}

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          background: '#fff',
          marginBottom: 20,
        }}
      >
        <h2 style={{ marginBottom: 6 }}>{job.title}</h2>
        <p style={{ color: '#4b5563', marginBottom: 12 }}>
          {job.createdBy?.companyName || job.companyName || job.createdBy?.name || 'Recruiter'}
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <span>Location: {showLocation(job)}</span>
          {job.workArrangement && <span>Work type: {job.workArrangement}</span>}
          {job.salaryVisible === 'Yes' && (
            <span>
              Salary: {money(job.salaryMin)} - {money(job.salaryMax)} /month
            </span>
          )}
          {job.applicationDeadline && (
            <span>
              Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {isClosed && (
          <div style={{ color: '#b91c1c', fontWeight: 700 }}>
            This job is closed. You cannot apply now.
          </div>
        )}

        {!isClosed && (
          <div
            dangerouslySetInnerHTML={{ __html: job.description }}
            style={{
              marginTop: 12,
              padding: 14,
              background: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
          />
        )}
      </div>

      {!isClosed &&
        job.customQuestions &&
        Array.isArray(job.screeningQuestions) &&
        job.screeningQuestions.length > 0 && (
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 20,
              background: '#fff',
              marginBottom: 20,
            }}
          >
            <h3 style={{ marginBottom: 14 }}>Screening Questions</h3>

            <div style={{ display: 'grid', gap: 14 }}>
              {job.screeningQuestions.map((question, index) => (
                <div key={index}>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {index + 1}. {question}
                  </label>
                  <textarea
                    rows="4"
                    value={screeningAnswers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      {!isClosed && (
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 20,
            background: '#fff',
          }}
        >
          <h3 style={{ marginBottom: 14 }}>Choose Resume Source</h3>

          <div style={{ display: 'grid', gap: 12 }}>
            <label
              style={{
                border: '1px solid #d1d5db',
                borderRadius: 10,
                padding: 14,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="resumeSource"
                value="default"
                checked={resumeSource === 'default'}
                onChange={() => setResumeSource('default')}
                style={{ marginRight: 8 }}
              />
              Use built-in resume from Resume Builder
            </label>

            <label
              style={{
                border: '1px solid #d1d5db',
                borderRadius: 10,
                padding: 14,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="resumeSource"
                value="upload"
                checked={resumeSource === 'upload'}
                onChange={() => setResumeSource('upload')}
                style={{ marginRight: 8 }}
              />
              Use uploaded/selectable CV from Manage CV
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            {resumeSource === 'default' ? (
              <>
                <button
                  onClick={handleUseResumeBuilder}
                  type="button"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Open Resume Builder
                </button>

                <button
                  onClick={handleSubmitWithBuiltResume}
                  type="button"
                  disabled={submitting}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #2563eb',
                    background: '#2563eb',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Apply with Built Resume'}
                </button>
              </>
            ) : (
              <button
                onClick={handleUseManageCV}
                type="button"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #2563eb',
                  background: '#2563eb',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Go to Manage CV
              </button>
            )}

            <button
              onClick={() => navigate('/candidate/job-search')}
              type="button"
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}