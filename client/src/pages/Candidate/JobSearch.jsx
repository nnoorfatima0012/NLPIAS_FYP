
// // client/src/pages/Candidate/JobSearch.jsx
// import React, { useEffect, useState, useCallback,useMemo } from 'react';


// import { useNavigate } from 'react-router-dom';
// import { jobApi } from '../../utils/jobApi';
// import './JobSearch.css';
// import { useSearchParams } from 'react-router-dom';
// import { useRef } from 'react';

// // Helper functions
// const money = (n) => (typeof n === 'number' ? n.toLocaleString() : '—');

// const LIMIT = 10;

// const timeAgo = (d) => {
//   const diff = (Date.now() - new Date(d).getTime()) / 1000;
//   const days = Math.floor(diff / 86400);
//   if (days < 1) return 'today';
//   if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
//   const w = Math.floor(days / 7);
//   return `${w} week${w > 1 ? 's' : ''} ago`;
// };

// const showLocation = (j) => {
//   if (j.jobLocation && j.jobLocation.trim()) return j.jobLocation;
//   if (j.location && j.location.trim()) return j.location;
//   if (j.remote?.mustReside && j.remote?.location)
//     return `Remote (within ${j.remote.location})`;
//   return j.workArrangement === 'Remote' ? 'Remote' : '—';
// };

// const getLocationIcon = (j) => {
//   if (j.workArrangement === 'Remote') {
//     return <i className="fas fa-home" />;
//   }
//   return <i className="fas fa-building" />;
// };


// // --- Apply Modal Steps ---
// const STEPS = {
//   INFO: 1,
//   QUESTIONS: 2,
//   RESUME: 3,
// };

// export default function JobSearch() {
//   const navigate = useNavigate();
//   const [jobs, setJobs] = useState([]);
//   const [initialLoading, setInitialLoading] = useState(true); // only first time
//   const [isSearching, setIsSearching] = useState(false);      // while typing
//   const [err, setErr] = useState('');
//   const [qDebounced, setQDebounced] = useState("");
//   const [searchParams, setSearchParams] = useSearchParams();

//   const [page, setPage] = useState(1);
//   const [totalJobs, setTotalJobs] = useState(0);
//   const hasMountedRef = useRef(false);



//   // Filters state
//   const [q, setQ] = useState('');
//   const [loc, setLoc] = useState('');
//   const [arr, setArr] = useState('');
//   const [minSalary, setMinSalary] = useState(0);
//   const [sort, setSort] = useState('latest');
//   const MAX_STIPEND = 500000;

//   // Apply Modal State
//   const [modalState, setModalState] = useState(STEPS.INFO);
//   const [showApplyModal, setShowApplyModal] = useState(false);
//   const [selectedJob, setSelectedJob] = useState(null);
//   const [screeningAnswers, setScreeningAnswers] = useState({});

// const qClean = useMemo(() => (qDebounced || "").trim(), [qDebounced]);
// const isTextSearching = qClean.length >= 3;
// const aliasShort = new Set(["js", "wp", "ui", "ux", "db", "ts","py"]);
// const isQueryActive = qClean.length >= 3 || aliasShort.has(qClean.toLowerCase());




//   const getJob = useCallback(
//     (id) => jobs.find((j) => j._id === id),
//     [jobs]
//   );

//   const forcePageOneInUrl = useCallback(() => {
//   setSearchParams((prev) => {
//     const params = new URLSearchParams(prev);
//     params.set("page", "1");
//     return params;
//   }, { replace: true });
// }, [setSearchParams]);


//   // ✅ NEW 7:40 1/15/2026: Fetch jobs via search API
//   const buildFiltersPayload = useCallback(() => {
//   const filters = { onlyOpen: true, sort };
//   if (loc.trim()) filters.location = loc.trim();
//   if (arr) filters.workArrangement = arr;
//   if (minSalary > 0) filters.minSalary = minSalary;
//   return filters;
// }, [sort, loc, arr, minSalary]);


// useEffect(() => {
//   const t = setTimeout(() => setQDebounced(q), 400);
//   return () => clearTimeout(t);
// }, [q]);

// useEffect(() => {
//   if (!hasMountedRef.current) return;
//   setPage(1);
// }, [qClean, loc, arr, minSalary]);

// useEffect(() => {
//   const urlPage = Number(searchParams.get("page"));
//   if (urlPage && urlPage > 0) setPage(urlPage);
//   hasMountedRef.current = true;
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, []);




// useEffect(() => {
//   if (!hasMountedRef.current) return;

//   setSearchParams((prev) => {
//     const params = new URLSearchParams(prev);
//     params.set("page", String(page));
//     return params;
//   }, { replace: true });
// }, [page, setSearchParams]);



// useEffect(() => {
//   let cancelled = false;

//   (async () => {
//     setIsSearching(true);
//     setErr("");

//     try {
//       const payload = {
//         queryText: isQueryActive ? qClean : "",

//         filters: buildFiltersPayload(),
//         page,
//         limit: LIMIT,
//       };

//       const { data } = await jobApi.search(payload);

//        if (cancelled) return;

//        // If paginated response
//        if (data && Array.isArray(data.jobs)) {
//          setJobs(data.jobs);
//          setTotalJobs(data.total || data.jobs.length);
//        }
//        // If non-paginated response (fallback)
//        else if (Array.isArray(data)) {
//          setJobs(data);
//          setTotalJobs(data.length);
//        } else {
//          setJobs([]);
//          setTotalJobs(0);
//        }

//     } catch (e) {
//       console.error(e);
//       if (!cancelled) setErr("Failed to load jobs.");
//     } finally {
//       if (!cancelled) {
//         setIsSearching(false);
//         setInitialLoading(false);
//       }
//     }
//   })();

//   return () => {
//     cancelled = true;
//   };
// }, [qClean, isQueryActive, buildFiltersPayload, page]);

// useEffect(() => {
//   if (isTextSearching) {
//     setSort((prev) => (prev === "relevance" ? prev : "relevance"));
//   } else {
//     setSort((prev) => (prev === "relevance" ? "latest" : prev));
//   }
// }, [isTextSearching]);




//   // Filtered list memo
//   // ✅ Backend already returns filtered/sorted jobs
//   const filtered = jobs;


//   // Modal helpers
//   const closeModal = () => {
//     setShowApplyModal(false);
//     setSelectedJob(null);
//     setScreeningAnswers({});
//     setModalState(STEPS.INFO);
//   };

//   const onClickApply = (jobId) => {
//     const job = getJob(jobId);
//     if (!job) return;
//     setSelectedJob(job);
//     setScreeningAnswers({});
//     setModalState(STEPS.INFO);
//     setShowApplyModal(true);
//   };

//   const handleNextStep = () => {
//     if (!selectedJob) return;

//     if (modalState === STEPS.INFO) {
//       if (
//         selectedJob.customQuestions &&
//         Array.isArray(selectedJob.screeningQuestions) &&
//         selectedJob.screeningQuestions.length > 0
//       ) {
//         const initialAnswers = selectedJob.screeningQuestions.reduce(
//           (acc, _q, index) => {
//             acc[index] = '';
//             return acc;
//           },
//           {}
//         );
//         setScreeningAnswers(initialAnswers);
//         setModalState(STEPS.QUESTIONS);
//       } else {
//         setScreeningAnswers({});
//         setModalState(STEPS.RESUME);
//       }
//     }
//   };

//   const handleQuestionsSubmit = () => {
//     const questions = selectedJob.screeningQuestions;
//     const answersArray = questions.map(
//       (_, index) => screeningAnswers[index] || ''
//     );

//     const allAnswered = answersArray.every(
//       (answer) => answer.trim().length > 0
//     );
//     if (!allAnswered) {
//       alert('Please answer all screening questions.');
//       return;
//     }

//     setScreeningAnswers(answersArray);
//     setModalState(STEPS.RESUME);
//   };

//   const goBuildResume = () => {
//     const title = selectedJob.title || '';
//     const answers = Array.isArray(screeningAnswers)
//       ? screeningAnswers
//       : Object.values(screeningAnswers);
//     navigate(
//       `/candidate/resume-builder?jobId=${encodeURIComponent(
//         selectedJob._id
//       )}&title=${encodeURIComponent(title)}&answers=${encodeURIComponent(
//         JSON.stringify(answers)
//       )}`
//     );
//     closeModal();
//   };

//   const goManageCV = () => {
//     const title = selectedJob.title || '';
//     const answers = Array.isArray(screeningAnswers)
//       ? screeningAnswers
//       : Object.values(screeningAnswers);
//     navigate(
//       `/candidate/manage-cv?jobId=${encodeURIComponent(
//         selectedJob._id
//       )}&title=${encodeURIComponent(title)}&answers=${encodeURIComponent(
//         JSON.stringify(answers)
//       )}`
//     );
//     closeModal();
//   };

//   // Only handle Escape key
//   useEffect(() => {
//     const fn = (e) => {
//       if (e.key === 'Escape' && showApplyModal) {
//         closeModal();
//       }
//     };
//     window.addEventListener('keydown', fn);
//     return () => {
//       window.removeEventListener('keydown', fn);
//     };
//   }, [showApplyModal]);

//   // --- Render ---
//   if (initialLoading)
//   return (
//     <div className="page-loading">
//       <div className="loading-spinner" />
//       <p>Loading jobs...</p>
//     </div>
//   );


//   if (err)
//     return (
//       <div className="page-error">
//         <div className="error-icon">
//           <i className="fas fa-exclamation-triangle" />
//         </div>
//         <p>{err}</p>
//       </div>
//     );

//   const FilterChip = ({ label, onRemove }) => (
//   <button
//     type="button"
//     onClick={onRemove}
//     style={{
//       border: "1px solid #d1d5db",
//       background: "#fff",
//       padding: "6px 10px",
//       borderRadius: "999px",
//       fontSize: "0.8rem",
//       display: "inline-flex",
//       alignItems: "center",
//       gap: "8px",
//       cursor: "pointer",
//     }}
//   >
//     <span>{label}</span>
//     <span style={{ fontWeight: 700 }}>×</span>
//   </button>
// );


//   return (
//     <div className="job-search-page">
//       <div className="page-header">
//         <h1>Find Your Dream Job</h1>
//         <p>Discover opportunities that match your skills and aspirations</p>
//       </div>

//       <div className="main-content-grid">
//         {/* LEFT COLUMN: FILTERS SECTION */}
//         <div className="filter-section">
//           <div className="filter-header">
//             <h2>Filters</h2>
//             <button
//               onClick={() => {
//                 setQ('');
//                 setLoc('');
//                 setArr('');
//                 setMinSalary(0);
//                 setSort('latest');
//                 setPage(1);
//                 forcePageOneInUrl();
//               }}
//               className="clear-all-btn"
//             >
//               Clear all
//             </button>
//           </div>

//           <div className="filter-group">
//              <label htmlFor="filter-q">Search Jobs</label>
//              <input
//                id="filter-q"
//                type="text"
//                placeholder="Search by title, skills, company, keywords..."
//                value={q}
//                onChange={(e) => setQ(e.target.value)}
//                className="filter-input"
//              />
//           </div>


//           <div className="filter-group">
//             <label htmlFor="filter-loc">Location</label>
//             <input
//               id="filter-loc"
//               placeholder="e.g. Lahore, Karachi"
//               value={loc}
//               onChange={(e) => setLoc(e.target.value)}
//               className="filter-input"
//             />
//           </div>

//           <div className="filter-group">
//   <label>Work type</label>

//   <div className="checkbox-options">
//     <label className="checkbox-label">
//       <input
//         type="radio"
//         name="workArrangement"
//         checked={arr === ""}
//         onChange={() => setArr("")}
//       />
//       Any arrangement
//     </label>

//     <label className="checkbox-label">
//       <input
//         type="radio"
//         name="workArrangement"
//         checked={arr === "Remote"}
//         onChange={() => setArr("Remote")}
//       />
//       Work from home
//     </label>

//     <label className="checkbox-label">
//       <input
//         type="radio"
//         name="workArrangement"
//         checked={arr === "On-site"}
//         onChange={() => setArr("On-site")}
//       />
//       On-site
//     </label>

//     <label className="checkbox-label">
//       <input
//         type="radio"
//         name="workArrangement"
//         checked={arr === "Hybrid"}
//         onChange={() => setArr("Hybrid")}
//       />
//       Hybrid
//     </label>
//   </div>
// </div>


//           <div className="filter-group">
//             <label htmlFor="filter-salary">Minimum Monthly Stipend</label>
//             <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//                <div className="stipend-range-display" style={{ margin: 0 }}>
//                  Min: {money(minSalary)} / month
//                </div>

//                <input
//                  type="number"
//                  min="0"
//                  max={MAX_STIPEND}
//                  step="1000"
//                  value={minSalary}
//                  onChange={(e) => {
//                    const v = Number(e.target.value);
//                    if (Number.isNaN(v)) return;
//                    setMinSalary(Math.min(MAX_STIPEND, Math.max(0, v)));
//                  }}
//                  style={{
//                    width: "120px",
//                    padding: "6px 8px",
//                    borderRadius: "6px",
//                    border: "1px solid #d1d5db",
//                    fontSize: "0.85rem",
//                  }}
//                />
//              </div>

//             <input
//               id="filter-salary"
//               type="range"
//               min="0"
//               max={MAX_STIPEND}
//               step="1000"
//               value={minSalary}
//               onChange={(e) => {
//                const v = Number(e.target.value);
//                if (Number.isNaN(v)) return;
//                setMinSalary(Math.min(MAX_STIPEND, Math.max(0, v)));
//                }}

//               className="stipend-slider"
//             />
//             <div
//               style={{
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 fontSize: '0.7rem',
//                 color: '#111827',
//                 marginTop: '5px',
//               }}
//             >
//               <span>0k</span>
//               <span>100k</span>
//               <span>200k</span>
//               <span>300k</span>
//               <span>400k</span>
//               <span>500k</span>
//             </div>
//           </div>

//           <div className="filter-group">
//             <label htmlFor="filter-sort">Sort By</label>
//             <select
//               id="filter-sort"
//               value={sort}
//               onChange={(e) => setSort(e.target.value)}
//               className="filter-select"
//             >
//               <option value="relevance" disabled={!isTextSearching}>Relevance (BM25)</option>
//               <option value="latest" disabled={isTextSearching}>Latest</option>
//               <option value="oldest" disabled={isTextSearching}>Oldest</option>

//             </select>
//           </div>
//         </div>

//         {/* RIGHT COLUMN: JOB LISTINGS SECTION */}
//         <div className="job-listings-container">
//           <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }} >
//                {isTextSearching && (
//                 <FilterChip
//                   label={`Search: "${(q || "").trim()}"`}
//                   onRemove={() => setQ("")}
//                />
//               )}

//                {loc.trim() && <FilterChip label={`Location: ${loc}`} onRemove={() => setLoc("")} />}
//                {arr && <FilterChip label={`Work: ${arr}`} onRemove={() => setArr("")} />}
//                {minSalary > 0 && (
//                  <FilterChip label={`Min stipend: ${money(minSalary)}`} onRemove={() => setMinSalary(0)} />
//                )}
//                {((isTextSearching) || loc.trim() || arr || minSalary > 0) && (

//                  <FilterChip
//                    label="Clear all"
//                    onRemove={() => {
//                      setQ("");
//                      setLoc("");
//                      setArr("");
//                      setMinSalary(0);
//                      setSort("latest");
//                      setPage(1);
//                      forcePageOneInUrl();
//                    }}
//                  />
//                )}
//             </div>
//           <div className="results-info">
//             <p>
//               Showing {jobs.length} of {totalJobs} jobs
//               {jobs.length !== 1 ? 's' : ''} from verified recruiters.
//             </p>
//           </div>
//           {!initialLoading && isSearching && (
//             <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "10px" }}>
//              {isQueryActive ? "Searching..." : "Loading..."}
//             </p>
//           )}



//           <div className="jobs-grid">
//             {filtered.length === 0 && (
//               <p
//                 style={{
//                   textAlign: 'center',
//                   padding: '50px',
//                   color: '#6b7280',
//                   fontSize: '0.9rem',
//                 }}
//               >
//                 No jobs match your current filters. Try broadening your search!
//               </p>
//             )}

//             {filtered.map((j) => {
//               const company =
//                 j.createdBy?.companyName ||
//                 j.companyName ||
//                 j.createdBy?.name ||
//                 'Recruiter';
//               const open =
//                 j.isClosed !== true &&
//                 j.applicationDeadline &&
//                 new Date(j.applicationDeadline) >= new Date();

//               return (
//                 <div key={j._id} className="job-card">
//                   <div className="job-card-header">
//                     <div className="job-title-section">
//                       <h3 className="job-title">{j.title}</h3>
//                       <p className="company-name">
//                         {company}
//                         <span
//                           className={`status-badge ${
//                             open ? 'open' : 'closed'
//                           }`}
//                         >
//                           {open ? 'Actively hiring' : 'Closed'}
//                         </span>
//                       </p>
//                     </div>
//                     <button
//                       onClick={() => onClickApply(j._id)}
//                       disabled={!open}
//                       className={`apply-btn ${open ? 'active' : 'closed'}`}
//                     >
//                       {open ? 'Apply Now' : 'Closed'}
//                     </button>
//                   </div>

//                   <div className="job-meta">
//                     <span className="meta-item">
//                       <i className="fas fa-map-marker-alt" /> {showLocation(j)}
//                     </span>

//                     {j.workArrangement && (
//                       <span className="meta-item">
//                         {getLocationIcon(j)} {j.workArrangement}
//                       </span>
//                     )}

//                     {j.salaryVisible === 'Yes' && (
//                       <span className="meta-item salary">
//                         <i className="fas fa-dollar-sign" />{' '}
//                         {money(j.salaryMin)} - {money(j.salaryMax)} /month
//                       </span>
//                     )}

//                     {j.applicationDeadline && (
//                       <span className="meta-item">
//                         <i className="far fa-calendar-alt" /> Deadline:{' '}
//                         {new Date(j.applicationDeadline).toLocaleDateString()}
//                       </span>
//                     )}
//                   </div>

//                   <div className="job-footer">
//                     <span className="post-time">
//                       <i className="far fa-clock" /> Posted {timeAgo(j.createdAt)}
//                     </span>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           {totalJobs > LIMIT && (
//   <div
//     style={{
//       display: 'flex',
//       justifyContent: 'center',
//       gap: '12px',
//       marginTop: '25px',
//     }}
//   >
//     <button
//       disabled={page === 1}
//       onClick={() => setPage((p) => Math.max(1, p - 1))}
//       style={{
//         padding: '8px 14px',
//         borderRadius: '6px',
//         border: '1px solid #d1d5db',
//         background: page === 1 ? '#f3f4f6' : '#fff',
//         cursor: page === 1 ? 'not-allowed' : 'pointer',
//       }}
//     >
//       ← Prev
//     </button>

//     <span style={{ fontSize: '0.9rem', color: '#374151' }}>
//       Page {page} of {Math.ceil(totalJobs / LIMIT)}
//     </span>

//     <button
//       disabled={page >= Math.ceil(totalJobs / LIMIT)}
//       onClick={() => setPage((p) => p + 1)}
//       style={{
//         padding: '8px 14px',
//         borderRadius: '6px',
//         border: '1px solid #d1d5db',
//         background:
//           page >= Math.ceil(totalJobs / LIMIT) ? '#f3f4f6' : '#fff',
//         cursor:
//           page >= Math.ceil(totalJobs / LIMIT)
//             ? 'not-allowed'
//             : 'pointer',
//       }}
//     >
//       Next →
//     </button>
//   </div>
// )}


//         </div>
//       </div>

//       {/* --- MASTER APPLY MODAL --- */}
//       {showApplyModal && selectedJob && (
//         <div
//           className="modal-overlay"
//           onClick={closeModal}
//           style={{
//             position: 'fixed',
//             inset: 0,
//             background: 'rgba(0,0,0,0.5)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             zIndex: 1000,
//             overflowY: 'auto', // overlay scrolls when content is tall
//           }}
//         >
//           <div
//             className="modal-content-centered"
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               width: '80%',
//               maxWidth: '800px',
//               borderRadius: '12px',
//               background: '#fff',
//               boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
//               padding: '30px',
//               overflowY: 'auto',
//               maxHeight: '90vh',
//             }}
//           >
//             <div
//               className="modal-header"
//               style={{
//                 borderBottom: '1px solid #eee',
//                 paddingBottom: '15px',
//                 position: 'relative',
//               }}
//             >
//               <h3
//                 style={{
//                   marginTop: 0,
//                   fontSize: '1.3rem',
//                   color: '#1f2937',
//                 }}
//               >
//                 Application:{' '}
//                 {modalState === STEPS.INFO
//                   ? 'Job Details'
//                   : modalState === STEPS.QUESTIONS
//                   ? 'Screening Questions'
//                   : 'Select Resume'}
//               </h3>
//               <button
//                 onClick={closeModal}
//                 className="modal-close"
//                 style={{
//                   position: 'absolute',
//                   top: 0,
//                   right: 0,
//                   background: 'none',
//                   border: 'none',
//                   fontSize: '1.5rem',
//                   cursor: 'pointer',
//                   color: '#6b7280',
//                 }}
//               >
//                 ×
//               </button>
//             </div>

//             {/* Progress Indicator */}
//             <div
//               style={{
//                 display: 'flex',
//                 justifyContent: 'space-around',
//                 margin: '20px 0 30px',
//               }}
//             >
//               {[STEPS.INFO, STEPS.QUESTIONS, STEPS.RESUME].map((step, index) => (
//                 <span
//                   key={step}
//                   style={{
//                     fontWeight: modalState === step ? 700 : 400,
//                     color: modalState >= step ? '#2563eb' : '#9ca3af',
//                     borderBottom:
//                       modalState === step ? '2px solid #2563eb' : 'none',
//                     paddingBottom: '5px',
//                     cursor: 'default',
//                     fontSize: '0.85rem',
//                   }}
//                 >
//                   Step {index + 1}:{' '}
//                   {index === 0 ? 'Details' : index === 1 ? 'Questions' : 'Resume'}
//                 </span>
//               ))}
//             </div>

//             {/* STEP 1: JOB INFO & DESCRIPTION */}
//             {modalState === STEPS.INFO && (
//               <div className="modal-step-info">
//                 <h4
//                   style={{
//                     color: '#1f2937',
//                     marginBottom: '4px',
//                     fontSize: '1.1rem',
//                   }}
//                 >
//                   {selectedJob.title}
//                 </h4>
//                 <p
//                   style={{
//                     color: '#4b5563',
//                     margin: '0 0 6px 0',
//                     fontSize: '0.9rem',
//                   }}
//                 >
//                   {selectedJob.createdBy?.companyName || 'Recruiter'}
//                 </p>

//                 <p className="job-detail-line">
//                   <i className="fas fa-map-marker-alt" />{' '}
//                   {showLocation(selectedJob)}
//                   {selectedJob.workArrangement && (
//                     <>
//                       {' '}
//                       | {getLocationIcon(selectedJob)}{' '}
//                       {selectedJob.workArrangement}
//                     </>
//                   )}
//                   {selectedJob.salaryVisible === 'Yes' && (
//                     <>
//                       {' '}
//                       | <i className="fas fa-dollar-sign" />{' '}
//                       {money(selectedJob.salaryMin)} -{' '}
//                       {money(selectedJob.salaryMax)} /month
//                     </>
//                   )}
//                 </p>

//                 {selectedJob.applicationDeadline && (
//                   <p className="job-detail-line">
//                     <i className="far fa-calendar-alt" /> Deadline:{' '}
//                     {new Date(
//                       selectedJob.applicationDeadline
//                     ).toLocaleDateString()}
//                   </p>
//                 )}

//                 <div
//                   style={{
//                     padding: '15px',
//                     borderRadius: '8px',
//                     border: '1px solid #ddd',
//                     background: '#f9fafb',
//                     marginTop: '12px',
//                   }}
//                 >
//                   <h5
//                     style={{
//                       marginTop: 0,
//                       marginBottom: '8px',
//                       color: '#2563eb',
//                       fontSize: '0.95rem',
//                     }}
//                   >
//                     Job Description
//                   </h5>
//                   <div
//                     className="job-description"
//                     dangerouslySetInnerHTML={{
//                       __html: selectedJob.description,
//                     }}
//                   />
//                 </div>

//                 <div
//                   className="modal-actions"
//                   style={{
//                     display: 'flex',
//                     justifyContent: 'flex-end',
//                     gap: '10px',
//                     marginTop: '30px',
//                   }}
//                 >
//                   <button
//                     type="button"
//                     onClick={closeModal}
//                     className="cancel-btn"
//                     style={{
//                       background: '#fca5a5',
//                       color: '#991b1b',
//                       padding: '10px 15px',
//                       borderRadius: '8px',
//                       border: 'none',
//                       fontSize: '0.9rem',
//                     }}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleNextStep}
//                     className="option-btn"
//                     style={{
//                       background: '#2563eb',
//                       color: 'white',
//                       padding: '10px 15px',
//                       borderRadius: '8px',
//                       border: 'none',
//                       fontSize: '0.9rem',
//                     }}
//                   >
//                     {selectedJob.customQuestions &&
//                     Array.isArray(selectedJob.screeningQuestions) &&
//                     selectedJob.screeningQuestions.length > 0
//                       ? 'Continue to Questions'
//                       : 'Continue to Resume'}
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* STEP 2: SCREENING QUESTIONS */}
//             {modalState === STEPS.QUESTIONS && (
//               <div className="modal-step-questions">
//                 <p
//                   className="modal-description"
//                   style={{ color: '#6b7280', fontSize: '0.9rem' }}
//                 >
//                   Please answer the following{' '}
//                   {selectedJob.screeningQuestions.length} questions required
//                   by the recruiter:
//                 </p>
//                 <form
//                   onSubmit={(e) => {
//                     e.preventDefault();
//                     handleQuestionsSubmit();
//                   }}
//                 >
//                   <div
//                     className="question-list"
//                     style={{ display: 'grid', gap: '15px' }}
//                   >
//                     {selectedJob.screeningQuestions.map((q, index) => (
//                       <div
//                         key={index}
//                         className="question-item"
//                         style={{
//                           border: '1px solid #ddd',
//                           padding: '10px',
//                           borderRadius: '6px',
//                         }}
//                       >
//                         <label
//                           style={{
//                             display: 'block',
//                             fontWeight: 'bold',
//                             marginBottom: '5px',
//                             color: '#374151',
//                             fontSize: '0.9rem',
//                           }}
//                         >
//                           {index + 1}. {q}*
//                         </label>
//                         <textarea
//                           required
//                           rows="3"
//                           value={screeningAnswers[index] || ''}
//                           onChange={(e) =>
//                             setScreeningAnswers((p) => ({
//                               ...p,
//                               [index]: e.target.value,
//                             }))
//                           }
//                           style={{
//                             width: '100%',
//                             padding: '8px',
//                             borderRadius: '4px',
//                             border: '1px solid #ccc',
//                             fontSize: '0.9rem',
//                           }}
//                         />
//                       </div>
//                     ))}
//                   </div>
//                   <div
//                     className="modal-actions"
//                     style={{
//                       display: 'flex',
//                       justifyContent: 'flex-end',
//                       gap: '10px',
//                       marginTop: '20px',
//                     }}
//                   >
//                     <button
//                       type="button"
//                       onClick={closeModal}
//                       className="cancel-btn"
//                       style={{
//                         background: '#fca5a5',
//                         color: '#991b1b',
//                         padding: '10px 15px',
//                         borderRadius: '8px',
//                         border: 'none',
//                         fontSize: '0.9rem',
//                       }}
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       className="option-btn"
//                       style={{
//                         background: '#10b981',
//                         color: 'white',
//                         padding: '10px 15px',
//                         borderRadius: '8px',
//                         border: 'none',
//                         fontSize: '0.9rem',
//                       }}
//                       disabled={
//                         !Object.values(screeningAnswers).every(
//                           (a) => a && a.trim().length > 0
//                         )
//                       }
//                     >
//                       Continue to Resume
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             )}

//             {/* STEP 3: RESUME SELECTION */}
//             {modalState === STEPS.RESUME && (
//               <div className="modal-step-resume">
//                 <p
//                   className="modal-description"
//                   style={{ color: '#6b7280', fontSize: '0.9rem' }}
//                 >
//                   Choose how you'd like to proceed with your resume to complete
//                   the application:
//                 </p>
//                 <div
//                   className="modal-options"
//                   style={{ display: 'grid', gap: '15px' }}
//                 >
//                   <button
//                     onClick={goManageCV}
//                     className="option-btn"
//                     style={{
//                       background: '#f8fafc',
//                       border: '1px solid #d1d5db',
//                       padding: '15px',
//                       borderRadius: '8px',
//                       textAlign: 'left',
//                       cursor: 'pointer',
//                       display: 'flex',
//                       alignItems: 'center',
//                       gap: '15px',
//                       fontSize: '0.9rem',
//                     }}
//                   >
//                     <div
//                       className="option-icon"
//                       style={{ fontSize: '1.5rem', marginBottom: 0 }}
//                     >
//                       <i className="fas fa-file-upload" />
//                     </div>
//                     <div className="option-content">
//                       <div
//                         className="option-title"
//                         style={{ fontWeight: 700, color: '#1f2937' }}
//                       >
//                         Upload / Select Resume
//                       </div>
//                       <div
//                         className="option-desc"
//                         style={{ fontSize: '0.85rem', color: '#6b7280' }}
//                       >
//                         Pick a file from your computer or previous uploads
//                       </div>
//                     </div>
//                   </button>
//                   <button
//                     onClick={goBuildResume}
//                     className="option-btn"
//                     style={{
//                       background: '#f8fafc',
//                       border: '1px solid #d1d5db',
//                       padding: '15px',
//                       borderRadius: '8px',
//                       textAlign: 'left',
//                       cursor: 'pointer',
//                       display: 'flex',
//                       alignItems: 'center',
//                       gap: '15px',
//                       fontSize: '0.9rem',
//                     }}
//                   >
//                     <div
//                       className="option-icon"
//                       style={{ fontSize: '1.5rem', marginBottom: 0 }}
//                     >
//                       <i className="fas fa-file-invoice" />
//                     </div>
//                     <div className="option-content">
//                       <div
//                         className="option-title"
//                         style={{ fontWeight: 700, color: '#1f2937' }}
//                       >
//                         Use Built-in Resume
//                       </div>
//                       <div
//                         className="option-desc"
//                         style={{ fontSize: '0.85rem', color: '#6b7280' }}
//                       >
//                         Use the resume you built in the Resume Builder
//                       </div>
//                     </div>
//                   </button>
//                 </div>
//                 <div
//                   className="modal-actions"
//                   style={{
//                     display: 'flex',
//                     justifyContent: 'flex-end',
//                     gap: '10px',
//                     marginTop: '20px',
//                   }}
//                 >
//                   <button
//                     type="button"
//                     onClick={closeModal}
//                     className="cancel-btn"
//                     style={{
//                       background: '#fca5a5',
//                       color: '#991b1b',
//                       padding: '10px 15px',
//                       borderRadius: '8px',
//                       border: 'none',
//                       fontSize: '0.9rem',
//                     }}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// // client/src/pages/Candidate/JobSearch.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRef } from 'react';
import { jobApi } from '../../utils/jobApi';
import { api } from '../../utils/api';
import { getApplicationUI } from '../../utils/applicationStatus';
import './JobSearch.css';

// Helper functions
const money = (n) => (typeof n === 'number' ? n.toLocaleString() : '—');

const LIMIT = 10;

const timeAgo = (d) => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  const days = Math.floor(diff / 86400);
  if (days < 1) return 'today';
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const w = Math.floor(days / 7);
  return `${w} week${w > 1 ? 's' : ''} ago`;
};

const showLocation = (j) => {
  if (j.jobLocation && j.jobLocation.trim()) return j.jobLocation;
  if (j.location && j.location.trim()) return j.location;
  if (j.remote?.mustReside && j.remote?.location) {
    return `Remote (within ${j.remote.location})`;
  }
  return j.workArrangement === 'Remote' ? 'Remote' : '—';
};

const getLocationIcon = (j) => {
  if (j.workArrangement === 'Remote') {
    return <i className="fas fa-home" />;
  }
  return <i className="fas fa-building" />;
};

async function fetchMyApplications() {
  const res = await api.get('/applications/mine');
  const data = res.data;
  return Array.isArray(data) ? data : data?.applications || data || [];
}

function buildApplicationsMap(applications) {
  const map = {};

  for (const app of applications) {
    const jobId = app?.job?._id || app?.jobId || app?.job;
    if (jobId) {
      map[String(jobId)] = app;
    }
  }

  return map;
}

export default function JobSearch() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [err, setErr] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const hasMountedRef = useRef(false);

  const [myApplicationsMap, setMyApplicationsMap] = useState({});

  // Filters state
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const [arr, setArr] = useState('');
  const [minSalary, setMinSalary] = useState(0);
  const [sort, setSort] = useState('latest');
  const MAX_STIPEND = 500000;

  const qClean = useMemo(() => (qDebounced || '').trim(), [qDebounced]);
  const isTextSearching = qClean.length >= 3;
  const aliasShort = new Set(['js', 'wp', 'ui', 'ux', 'db', 'ts', 'py']);
  const isQueryActive =
    qClean.length >= 3 || aliasShort.has(qClean.toLowerCase());

  const forcePageOneInUrl = useCallback(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('page', '1');
      return params;
    }, { replace: true });
  }, [setSearchParams]);

  const buildFiltersPayload = useCallback(() => {
    const filters = { onlyOpen: true, sort };
    if (loc.trim()) filters.location = loc.trim();
    if (arr) filters.workArrangement = arr;
    if (minSalary > 0) filters.minSalary = minSalary;
    return filters;
  }, [sort, loc, arr, minSalary]);

  const handleJobAction = (job, app, ui) => {
    if (ui.action === 'apply') {
      navigate(`/candidate/jobs/${job._id}/apply`);
      return;
    }

    if (ui.action === 'view') {
      // later you can change this to:
      // navigate(`/candidate/applications/${app._id}`);
      navigate('/candidate/applied-jobs');
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    setPage(1);
  }, [qClean, loc, arr, minSalary]);

  useEffect(() => {
    const urlPage = Number(searchParams.get('page'));
    if (urlPage && urlPage > 0) setPage(urlPage);
    hasMountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) return;

    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('page', String(page));
      return params;
    }, { replace: true });
  }, [page, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await fetchMyApplications();
        if (!cancelled) {
          setMyApplicationsMap(buildApplicationsMap(list));
        }
      } catch (e) {
        console.error('Failed to load my applications', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsSearching(true);
      setErr('');

      try {
        const payload = {
          queryText: isQueryActive ? qClean : '',
          filters: buildFiltersPayload(),
          page,
          limit: LIMIT,
        };
        console.log('SEARCH PAYLOAD:', payload);
        const { data } = await jobApi.search(payload);

        if (cancelled) return;

        if (data && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
          setTotalJobs(data.total || data.jobs.length);
        } else if (Array.isArray(data)) {
          setJobs(data);
          setTotalJobs(data.length);
        } else {
          setJobs([]);
          setTotalJobs(0);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr('Failed to load jobs.');
      } finally {
        if (!cancelled) {
          setIsSearching(false);
          setInitialLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qClean, isQueryActive, buildFiltersPayload, page]);

  useEffect(() => {
    if (isTextSearching) {
      setSort((prev) => (prev === 'relevance' ? prev : 'relevance'));
    } else {
      setSort((prev) => (prev === 'relevance' ? 'latest' : prev));
    }
  }, [isTextSearching]);

  const filtered = jobs;

  if (initialLoading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Loading jobs...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="page-error">
        <div className="error-icon">
          <i className="fas fa-exclamation-triangle" />
        </div>
        <p>{err}</p>
      </div>
    );
  }

  const FilterChip = ({ label, onRemove }) => (
    <button
      type="button"
      onClick={onRemove}
      style={{
        border: '1px solid #d1d5db',
        background: '#fff',
        padding: '6px 10px',
        borderRadius: '999px',
        fontSize: '0.8rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
      }}
    >
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>×</span>
    </button>
  );

  return (
    <div className="job-search-page">
      <div className="page-header">
        <h1>Find Your Dream Job</h1>
        <p>Discover opportunities that match your skills and aspirations</p>
      </div>

      <div className="main-content-grid">
        <div className="filter-section">
          <div className="filter-header">
            <h2>Filters</h2>
            <button
              onClick={() => {
                setQ('');
                setLoc('');
                setArr('');
                setMinSalary(0);
                setSort('latest');
                setPage(1);
                forcePageOneInUrl();
              }}
              className="clear-all-btn"
            >
              Clear all
            </button>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-q">Search Jobs</label>
            <input
              id="filter-q"
              type="text"
              placeholder="Search by title, skills, company, keywords..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="filter-loc">Location</label>
            <input
              id="filter-loc"
              placeholder="e.g. Lahore, Karachi"
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Work type</label>

            <div className="checkbox-options">
              <label className="checkbox-label">
                <input
                  type="radio"
                  name="workArrangement"
                  checked={arr === ''}
                  onChange={() => setArr('')}
                />
                Any arrangement
              </label>

              <label className="checkbox-label">
                <input
                  type="radio"
                  name="workArrangement"
                  checked={arr === 'Remote'}
                  onChange={() => setArr('Remote')}
                />
                Work from home
              </label>

              <label className="checkbox-label">
                <input
                  type="radio"
                  name="workArrangement"
                  checked={arr === 'On-site'}
                  onChange={() => setArr('On-site')}
                />
                On-site
              </label>

              <label className="checkbox-label">
                <input
                  type="radio"
                  name="workArrangement"
                  checked={arr === 'Hybrid'}
                  onChange={() => setArr('Hybrid')}
                />
                Hybrid
              </label>
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-salary">Minimum Monthly Stipend</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="stipend-range-display" style={{ margin: 0 }}>
                Min: {money(minSalary)} / month
              </div>

              <input
                type="number"
                min="0"
                max={MAX_STIPEND}
                step="1000"
                value={minSalary}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isNaN(v)) return;
                  setMinSalary(Math.min(MAX_STIPEND, Math.max(0, v)));
                }}
                style={{
                  width: '120px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <input
              id="filter-salary"
              type="range"
              min="0"
              max={MAX_STIPEND}
              step="1000"
              value={minSalary}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isNaN(v)) return;
                setMinSalary(Math.min(MAX_STIPEND, Math.max(0, v)));
              }}
              className="stipend-slider"
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: '#111827',
                marginTop: '5px',
              }}
            >
              <span>0k</span>
              <span>100k</span>
              <span>200k</span>
              <span>300k</span>
              <span>400k</span>
              <span>500k</span>
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-sort">Sort By</label>
            <select
              id="filter-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="filter-select"
            >
              <option value="relevance" disabled={!isTextSearching}>
                Relevance (BM25)
              </option>
              <option value="latest" disabled={isTextSearching}>
                Latest
              </option>
              <option value="oldest" disabled={isTextSearching}>
                Oldest
              </option>
            </select>
          </div>
        </div>

        <div className="job-listings-container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            {isTextSearching && (
              <FilterChip
                label={`Search: "${(q || '').trim()}"`}
                onRemove={() => setQ('')}
              />
            )}

            {loc.trim() && (
              <FilterChip label={`Location: ${loc}`} onRemove={() => setLoc('')} />
            )}
            {arr && (
              <FilterChip label={`Work: ${arr}`} onRemove={() => setArr('')} />
            )}
            {minSalary > 0 && (
              <FilterChip
                label={`Min stipend: ${money(minSalary)}`}
                onRemove={() => setMinSalary(0)}
              />
            )}
            {(isTextSearching || loc.trim() || arr || minSalary > 0) && (
              <FilterChip
                label="Clear all"
                onRemove={() => {
                  setQ('');
                  setLoc('');
                  setArr('');
                  setMinSalary(0);
                  setSort('latest');
                  setPage(1);
                  forcePageOneInUrl();
                }}
              />
            )}
          </div>

          <div className="results-info">
            <p>
              Showing {jobs.length} of {totalJobs} job
              {totalJobs !== 1 ? 's' : ''} from verified recruiters.
            </p>
          </div>

          {!initialLoading && isSearching && (
            <p
              style={{
                fontSize: '0.85rem',
                color: '#6b7280',
                marginBottom: '10px',
              }}
            >
              {isQueryActive ? 'Searching...' : 'Loading...'}
            </p>
          )}

          <div className="jobs-grid">
            {filtered.length === 0 && (
              <p
                style={{
                  textAlign: 'center',
                  padding: '50px',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                }}
              >
                No jobs match your current filters. Try broadening your search!
              </p>
            )}

            {filtered.map((j) => {
              const company =
                j.createdBy?.companyName ||
                j.companyName ||
                j.createdBy?.name ||
                'Recruiter';

              const open =
                j.isClosed !== true &&
                j.applicationDeadline &&
                new Date(j.applicationDeadline) >= new Date();

              const app = myApplicationsMap[String(j._id)];
              const ui = getApplicationUI(app, open);

              return (
                <div key={j._id} className="job-card">
                  <div className="job-card-header">
                    <div className="job-title-section">
                      <h3 className="job-title">{j.title}</h3>
                      <p className="company-name">
                        {company}
                        <span
                          className={`status-badge ${open ? 'open' : 'closed'}`}
                        >
                          {open ? 'Actively hiring' : 'Closed'}
                        </span>

                        {ui.badge && ui.badge !== 'Closed' && (
                          <span className="status-badge application-badge">
                            {ui.badge}
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => handleJobAction(j, app, ui)}
                      disabled={ui.disabled}
                      className={`apply-btn ${ui.disabled ? 'closed' : 'active'}`}
                    >
                      {ui.buttonText}
                    </button>
                  </div>

                  <div className="job-meta">
                    <span className="meta-item">
                      <i className="fas fa-map-marker-alt" /> {showLocation(j)}
                    </span>

                    {j.workArrangement && (
                      <span className="meta-item">
                        {getLocationIcon(j)} {j.workArrangement}
                      </span>
                    )}

                    {j.salaryVisible === 'Yes' && (
                      <span className="meta-item salary">
                        <i className="fas fa-dollar-sign" /> {money(j.salaryMin)} -{' '}
                        {money(j.salaryMax)} /month
                      </span>
                    )}

                    {j.applicationDeadline && (
                      <span className="meta-item">
                        <i className="far fa-calendar-alt" /> Deadline:{' '}
                        {new Date(j.applicationDeadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="job-footer">
                    <span className="post-time">
                      <i className="far fa-clock" /> Posted {timeAgo(j.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {totalJobs > LIMIT && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '25px',
              }}
            >
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: page === 1 ? '#f3f4f6' : '#fff',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Prev
              </button>

              <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                Page {page} of {Math.ceil(totalJobs / LIMIT)}
              </span>

              <button
                disabled={page >= Math.ceil(totalJobs / LIMIT)}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background:
                    page >= Math.ceil(totalJobs / LIMIT) ? '#f3f4f6' : '#fff',
                  cursor:
                    page >= Math.ceil(totalJobs / LIMIT)
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}