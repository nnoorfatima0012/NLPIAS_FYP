// server/controllers/jobController.js
const Job = require('../models/Job');
const {
  bm25RankJobs,
  bm25RebuildIndex,
  bm25RankFromIndex,
} = require("../utils/nlpMatchClient");
const { preprocessQuery } = require("../utils/queryPreprocess");


const { JSDOM } = require('jsdom'); // lightweight HTML -> text (no external net)


function htmlToText(html = '') {
   try {
     const dom = new JSDOM(`<body>${html}</body>`);
     return dom.window.document.body.textContent || '';
   } catch {
     return String(html).replace(/<[^>]*>/g, ' '); // Strip HTML tags if parsing fails
   }
}

function hasSearchIntent(processedQuery) {
  const q = String(processedQuery || "").trim().toLowerCase();
  if (!q) return false;

  // ✅ after preprocess, "py" becomes "python" so this will be true anyway,
  // but keep it safe:
  const aliasShort = new Set(["js","wp","ui","ux","db","ts","py"]);
  if (aliasShort.has(q)) return true;

  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.join("").length >= 3;
}

async function rebuildBm25OpenJobsIndex() {
  const now = new Date();




  const openJobs = await Job.find({
    $and: [
      { $or: [{ isClosed: { $exists: false } }, { isClosed: { $ne: true } }] },
      { applicationDeadline: { $gte: now } },
    ],
  })
    .populate({
      path: "createdBy",
      select: "role name companyName",
      match: { role: "recruiter" },
    })
    .lean();

  const recruiterJobs = openJobs.filter((j) => j.createdBy);
  if (recruiterJobs.length > 0) {
    await bm25RebuildIndex(recruiterJobs);
  } else {
    // still rebuild empty index if you want:
    await bm25RebuildIndex([]);
  }
}


function escapeRegex(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


function validateJobPayload(body) {
   const errors = [];
    // Description length validation (plain text)
   const plain = htmlToText(body.description || '');
   if (plain.trim().length < 300) {
     errors.push('Description must be at least 300 characters.');
   }
    // Work arrangement conditionals
   if (!['On-site', 'Hybrid', 'Remote'].includes(body.workArrangement)) {
     errors.push('Invalid work arrangement.');
   } else {
     if (['On-site', 'Hybrid'].includes(body.workArrangement)) {
       if (!body.jobLocation || !String(body.jobLocation).trim()) {
         errors.push('Job location is required for On-site or Hybrid roles.');
       }
     }
     if (body.workArrangement === 'Remote') {
       const mustReside = Boolean(body?.remote?.mustReside);
       if (mustReside && !body?.remote?.location) {
         errors.push('Remote roles with residence restriction require a location.');
       }
     }
   }
    // Application deadline validation
   const deadline = new Date(body.applicationDeadline);
   if (isNaN(deadline.getTime())) errors.push('Application deadline is required.');
   if (deadline < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
     errors.push('Application deadline cannot be in the past.');
   }
    // Custom screening questions validation
   if (body.customQuestions) {
     if (!Array.isArray(body.screeningQuestions) || body.screeningQuestions.length === 0) {
       errors.push('Custom screening questions are enabled but no questions were provided.');
     }
     body.screeningQuestions.forEach((q, index) => {
       if (typeof q !== 'string' || q.trim().length < 5) {
         errors.push(`Screening Question #${index + 1} must be at least 5 characters long.`);
       }
     });
   }
    return errors;
}

// Simple in-memory cache for BM25 results
const bm25Cache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds


// Add near the other exports in server/controllers/jobController.js
exports.getPublicJobs = async (req, res) => {
   try {
     const now = new Date();
      // Find open jobs (not closed, not past deadline)
     const jobs = await Job.find({
       $and: [
         { $or: [{ isClosed: { $exists: false } }, { isClosed: { $ne: true } }] },
         { applicationDeadline: { $gte: now } },
           ],
     })
       .sort({ createdAt: -1 })
       .populate({
         path: 'createdBy',
         select: 'role name companyName',
         match: { role: 'recruiter' }, // Only recruiters
       });
      // Filter out jobs where 'createdBy' is null
     const recruiterJobs = jobs.filter(j => j.createdBy);
      res.json(recruiterJobs);
   } catch (err) {
     console.error('getPublicJobs error:', err);
     res.status(500).json({ error: 'Failed to fetch public jobs' });
   }
};

function buildJobSearchQuery(filters = {}) {
  const q = {};

  // onlyOpen = true
  if (filters.onlyOpen) {
    const now = new Date();
    q.$and = [
      { $or: [{ isClosed: { $exists: false } }, { isClosed: { $ne: true } }] },
      { applicationDeadline: { $gte: now } },
        ];
    
  }

  // workArrangement filter
  // if (filters.workArrangement) {
  //   q.workArrangement = filters.workArrangement; // Remote/Hybrid/On-site
  // }
  // workArrangement filter
    const wa = String(filters.workArrangement || "").trim();

    if (['Remote', 'Hybrid', 'On-site'].includes(wa)) {
      q.workArrangement = wa;
    }


  // location filter (matches jobLocation, legacy location, remote.location)
  // location filter (matches jobLocation, legacy location, remote.location)
  if (filters.location) {
    const re = new RegExp(escapeRegex(String(filters.location).trim()), "i");


    const locationOr = [
      { jobLocation: re },
      { location: re },
      { 'remote.location': re },
    ];

    // ✅ If onlyOpen already created q.$and, keep location inside it
    if (q.$and) {
      q.$and.push({ $or: locationOr });
    } else {
      q.$or = locationOr;
    }
  }


  // minSalary filter (matches your frontend logic: salaryMax >= minSalary)
  if (filters.minSalary && Number(filters.minSalary) > 0) {
    q.salaryVisible = 'Yes';
    q.salaryMax = { $gte: Number(filters.minSalary) };
  }

  return q;
}

exports.searchJobs = async (req, res) => {
  try {
    const { queryText = "", filters = {}, page = 1,limit = 10, } = req.body || {};
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);


    // 1) Mongo boolean filtering from selected filters
    const mongoQuery = buildJobSearchQuery(filters);

    let jobs = await Job.find(mongoQuery)
      .sort({ createdAt: -1 })
      .populate({
        path: "createdBy",
        select: "role name companyName",
        match: { role: "recruiter" },
      })
      .lean();

    // remove jobs with missing recruiter
    jobs = jobs.filter((j) => j.createdBy);
    if (jobs.length === 0) {
       return res.json({ total: 0, page: pageNum, limit: limitNum, jobs: [] });
    }


    // const qText = String(queryText || "").trim();
    const qTextRaw = String(queryText || "").trim();
    let qTextProcessed = "";
    if (qTextRaw) {
     try {
         qTextProcessed = await preprocessQuery(qTextRaw, { enableExpansion: true });
        } catch (e) {
          console.warn("preprocessQuery failed, fallback raw:", e.message);
          qTextProcessed = qTextRaw.toLowerCase().trim();
        }
    }
    console.log("RAW QUERY:", qTextRaw);
    console.log("PROCESSED QUERY:", qTextProcessed);



    const cacheFilters = { ...filters };
    delete cacheFilters.sort;

    const newest = jobs.reduce((max, j) => {
    const t = new Date(j.createdAt).getTime();
    return t > max ? t : max;
    }, 0);

    const stableIds = jobs.map(j => String(j._id)).sort();
    const idsSig = stableIds.slice(0, 50).join(",");

  
    // 2) If user provided queryText -> rank by BM25 (do NOT re-sort by date afterward)
    if (hasSearchIntent(qTextProcessed)) {
      // const cacheKey = qText;
      const cacheKey = qTextProcessed + "::" + JSON.stringify({ ...filters, sort: undefined });

      let bm25;

      const cached = bm25Cache.get(cacheKey);

         if (cached) {
           const isExpired = Date.now() - cached.timestamp >= CACHE_TTL;

           if (isExpired) {
             bm25Cache.delete(cacheKey); // 🧹 cleanup expired entry
           } else {
             console.log("Using cached BM25 results");
             bm25 = cached.data;
           }
         }

         if (!bm25) {
           console.log("Calling BM25 API");
          //  bm25 = await bm25RankJobs(qText, jobs);
          bm25 = await bm25RankFromIndex(qTextProcessed);


           bm25Cache.set(cacheKey, {
             data: bm25,
             timestamp: Date.now(),
           });
         }
       console.log("BM25 RESPONSE:", JSON.stringify(bm25, null, 2));
      const rankedList = Array.isArray(bm25?.ranked) ? bm25.ranked : [];
      console.log("RANKED LIST:", rankedList);
      //const rankedMatches = rankedList.filter((r) => Number(r.score) > 0);
      const rankedMatches = rankedList.filter(
      (r) => r && r.id != null && Number.isFinite(Number(r.score))
       );
      console.log("RANKED MATCHES:", rankedMatches);

// ✅ intersect with filtered Mongo jobs
const filteredIds = new Set(jobs.map((j) => String(j._id)));
console.log("FILTERED IDS:", [...filteredIds]);

const rankedFiltered = rankedMatches.filter((r) =>
  filteredIds.has(String(r.id))
);
console.log("RANKED FILTERED:", rankedFiltered);

// ✅ NOW check empty (after intersection)
// if (rankedFiltered.length === 0) {
//   return res.json({ total: 0, page: pageNum, limit: limitNum, jobs: [] });
// }

if (rankedFiltered.length === 0) {
  const start = (pageNum - 1) * limitNum;
  const end = pageNum * limitNum;

  return res.json({
    total: jobs.length,
    page: pageNum,
    limit: limitNum,
    jobs: jobs.slice(start, end),
  });
}

const scoreMap = new Map(
  rankedFiltered.map((r) => [String(r.id), Number(r.score) || 0])
);


      // keep only jobs that got a BM25 score
      jobs = jobs
        .filter((j) => scoreMap.has(String(j._id)))
        .sort(
          (a, b) =>{
            const sa = scoreMap.get(String(a._id)) || 0;
            const sb = scoreMap.get(String(b._id)) || 0;
            if (sb !== sa) return sb - sa;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
        .map((j) => ({
          ...j,
          bm25Score: scoreMap.get(String(j._id)) || 0,
        }));
      const start = (pageNum - 1) * limitNum;
      const end = pageNum * limitNum;

      const pagedJobs = jobs.slice(start, end);

      return res.json({
       total: jobs.length,
       page:pageNum,
       limit:limitNum,
       jobs: pagedJobs,
     });
    }
     




    // 3) If NO queryText -> use normal sort latest/oldest
    const sortMode = filters.sort || "latest";
    jobs.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortMode === "latest" ? db - da : da - db;
    });

    const start = (pageNum - 1) * limitNum;
    const end = pageNum * limitNum;

    return res.json({
      total: jobs.length,
      page:pageNum,
      limit:limitNum,
      jobs: jobs.slice(start, end),
    });

  } catch (err) {
    console.error("searchJobs error:", err);
    res.status(500).json({ error: "Failed to search jobs" });
  }
};



exports.postJob = async (req, res) => {
   try {
     // Check if user ID is present in the request after middleware execution
     const recruiterId = req.user?.id || req.user?._id; 
     if (!recruiterId) {
       return res.status(401).json({ error: 'Unauthorized: Recruiter ID missing.' });
     }

     const errors = validateJobPayload(req.body);
     if (errors.length) return res.status(400).json({ errors });
     
     const doc = new Job({
       ...req.body,
       createdBy: recruiterId, // Use the extracted ID
       // Keep compatibility: copy jobLocation to legacy field "location"
       location: req.body.jobLocation || '',
     });
//      await doc.save();
//      res.status(201).json({ message: 'Job posted successfully', job: doc });
        await doc.save();

        try {
          await rebuildBm25OpenJobsIndex();
        } catch (e) {
          console.warn("BM25 index rebuild failed (postJob):", e.message);
        }

res.status(201).json({ message: "Job posted successfully", job: doc });

   } catch (err) {
     // More detailed logging for 500 error debugging
     console.error('postJob error:', err.message, err.stack);
     
     // Mongoose validation/Cast errors: often results in 500/400
     if (err.name === 'ValidationError') {
       const validationErrors = Object.values(err.errors).map(e => e.message);
       return res.status(400).json({ error: 'Validation Failed', errors: validationErrors });
     }
       // CRITICAL FIX: Explicitly catch the Map casting error for better feedback
       if (err.name === 'CastError' && err.path === 'rateSkills') {
           return res.status(400).json({ error: `Cast to Map failed for path 'rateSkills'. Keys cannot contain '.', '$', or be otherwise malformed. Please check your skill entries.` });
       }
     if (err.name === 'CastError' && err.path === 'createdBy') {
       return res.status(400).json({ error: 'Invalid User ID format (CastError).' });
     }

     res.status(500).json({ error: 'Failed to post job due to server issue.' });
   }
};

exports.getMyJobs = async (req, res) => {
   try {
     const jobs = await Job.find({ createdBy: req.user.id })
       .sort({ createdAt: -1 })
       .populate('createdBy', 'companyName');
     // Auto-close any expired jobs (best-effort)
     await Promise.all(jobs.map((j) => j.autoCloseIfExpired()));
     res.json(jobs);
   } catch (err) {
     console.error('getMyJobs error:', err);
     res.status(500).json({ error: 'Failed to fetch jobs' });
   }
};

exports.getJobById = async (req, res) => {
   try {
     const job = await Job.findOne({ _id: req.params.id, createdBy: req.user.id })
       .populate('createdBy', 'companyName');
     if (!job) return res.status(404).json({ error: 'Job not found' });
     await job.autoCloseIfExpired();
     res.json(job);
   } catch (err) {
     console.error('getJobById error:', err);
     res.status(500).json({ error: 'Failed to fetch job' });
   }
};

exports.updateJob = async (req, res) => {
   try {
     const errors = validateJobPayload(req.body);
     if (errors.length) return res.status(400).json({ errors });
     
     const job = await Job.findOne({ _id: req.params.id, createdBy: req.user.id });
     if (!job) return res.status(404).json({ error: 'Job not found' });
     
     Object.assign(job, req.body, {
       location: req.body.jobLocation || '',
     });
     
//      await job.save();
//      await job.autoCloseIfExpired();
//      res.json({ message: 'Job updated', job });
        await job.save();
        await job.autoCloseIfExpired();

        try {
          await rebuildBm25OpenJobsIndex();
        } catch (e) {
          console.warn("BM25 index rebuild failed (updateJob):", e.message);
        }

        res.json({ message: "Job updated", job });

   } catch (err) {
     console.error('updateJob error:', err);
     res.status(500).json({ error: 'Failed to update job' });
   }
};

exports.deleteJob = async (req, res) => {
   try {
//      const job = await Job.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
//      if (!job) return res.status(404).json({ error: 'Job not found' });
//      res.json({ message: 'Job deleted' });
        const job = await Job.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
         if (!job) return res.status(404).json({ error: "Job not found" });

         try {
           await rebuildBm25OpenJobsIndex();
         } catch (e) {
           console.warn("BM25 index rebuild failed (deleteJob):", e.message);
           }

         res.json({ message: "Job deleted" });
         
   } catch (err) {
     console.error('deleteJob error:', err);
     res.status(500).json({ error: 'Failed to delete job' });
   }
};


exports.getPublicJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id).populate({
      path: 'createdBy',
      select: 'role name companyName',
      match: { role: 'recruiter' },
    });

    if (!job || !job.createdBy) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.autoCloseIfExpired();

    // optional: allow viewing even if closed, but safer for apply flow
    // if (job.isClosed === true) {
    //   return res.status(400).json({ error: 'This job is closed' });
    // }

    return res.json(job);
  } catch (err) {
    console.error('getPublicJobById error:', err);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
};