//src/pages/ResumeBuilder.jsx
import { toCanvas } from "html-to-image";
import { jsPDF } from "jspdf";
import React, { useEffect, useState, useRef } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  saveResumeToDB,
  fetchResumeFromDB,
  getResumePdf,
  renderResume,
} from "../../utils/resumeApi";
import { applicationApi } from "../../utils/applicationApi";
// import ResumePreview from "../../components/ResumePreview";
import TagInput from "../../components/TagInput";
// import ClassicTemplate from "../../components/templates/ClassicTemplate";
import ModernTemplate from "../../components/templates/ModernTemplate";
import ModernTemplateV2 from "../../components/templates/ModernTemplateV2";
import ModernTemplateV3 from "../../components/templates/ModernTemplateV3";
import ModernTemplateV4 from "../../components/templates/ModernTemplateV4";
import ModernTemplateV5 from "../../components/templates/ModernTemplateV5";
import ModernTemplateV6 from "../../components/templates/ModernTemplateV6";
import ModernTemplateV7 from "../../components/templates/ModernTemplateV7";
import ModernTemplateV8 from "../../components/templates/ModernTemplateV8";
import ModernTemplateV9 from "../../components/templates/ModernTemplateV9";
import ModernTemplateV10 from "../../components/templates/ModernTemplateV10";

// import CompactTemplate from "../../components/templates/CompactTemplate";
import { toPng } from "html-to-image";
// import ModernTemplateV2 from "../../components/templates/ModernTemplateV2";


import {
  DEGREE_LEVELS,
  FIELDS_OF_STUDY,
  INSTITUTIONS,
  JOB_TITLES,
  COMPANIES,
  SKILL_SUGGESTIONS,
  TECH_SUGGESTIONS,
  CERT_ISSUERS,
  CERTIFICATIONS,
  LANGUAGES,
  LANGUAGE_LEVELS,
} from "../../lookups/formOptions";
import { useLocation, useNavigate } from "react-router-dom";
import "./ResumeBuilder.css";

// 👇 Base URL for opening the generated PDF in a new tab
const API_BASE = import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:5000";

/* ========= URL helper ========= */
function useJobFromQuery() {
  const { search } = useLocation();
  const sp = new URLSearchParams(search);

  const jobId = sp.get("jobId");
  const title = sp.get("title");

  // Get and parse the screening answers
  const screeningAnswersRaw = sp.get("answers");
  let screeningAnswers = null;
  try {
    if (screeningAnswersRaw) {
      screeningAnswers = JSON.parse(decodeURIComponent(screeningAnswersRaw));
    }
  } catch (e) {
    console.error("Error parsing screening answers from URL:", e);
  }

  return { jobId, title, screeningAnswers };
}

/* ========= Step config ========= */

const steps = [
  "Personal Details",
  "Summary",
  "Education",
  "Experience",
  "Skills",
  "Projects",
  "Certifications",
  "Languages",
  "Custom Sections",      // ✅ NEW Step 9
  "Preview & Submit",     // ✅ Step 10
];
// Map step index to form section key
const sectionKeyByStep = {
  0: "personalDetails",
  1: "summary",
  2: "education",
  3: "experience",
  4: "skills",
  5: "projects",
  6: "certifications",
  7: "languages",
  8: "customSections",    // ✅ NEW
};

// Optional steps (Experience, Projects, Certifications, Languages)
const OPTIONAL_STEPS = new Set([3, 5, 6, 7, 8]); // ✅ add 8
const isStepOptional = (s) => OPTIONAL_STEPS.has(s);

// Sections that must keep at least one row
const REQUIRED_KEYS = new Set(["education"]);

/* ========= Blank row templates ========= */

const BLANK_ROWS = {
  education: {
    level: "",
    field: "",
    institution: "",
    fromYear: "",
    toYear: "",
    currentlyEnrolled: false,
  },
  experience: {
    jobTitle: "",
    company: "",
    description: "",
    fromYear: "",
    toYear: "",
    currentlyWorking: false,
  },
  projects: { name: "", description: "", technologies: [], link: "" },
  certifications: { name: "", issuedBy: "", date: "" },
  languages: { language: "", level: "" },
  customSections: {
    title: "",
    type: "bullets",     // "text" | "bullets" | "tags"
    content: "",
    items: [],
  },
};

/* ========= Small helpers ========= */

const isNonEmpty = (v) =>
  typeof v === "string" ? v.trim() !== "" : !!v;

const hasAnyTech = (arr) =>
  Array.isArray(arr) && arr.some((t) => (t || "").trim() !== "");

const isRowEmpty = (row) => {
  if (!row || typeof row !== "object") return true;
  if (Array.isArray(row.technologies) && hasAnyTech(row.technologies))
    return false;
  return Object.values(row).every((v) =>
    Array.isArray(v)
      ? v.every((x) => !isNonEmpty(x))
      : !isNonEmpty(v)
  );
};

const rowHasData = (row) => {
  if (!row || typeof row !== "object") return false;
  return Object.values(row).some((v) =>
    Array.isArray(v)
      ? v.some((t) => (t || "").trim())
      : typeof v === "string"
      ? v.trim()
      : !!v
  );
};

const removeOrClearRowSmart = (values, setFieldValue, arrayKey, index) => {
  const arr = values[arrayKey] || [];
  const currentRow = arr[index];

  if (arr.length > 1) {
    if (rowHasData(currentRow)) {
      const ok = window.confirm(
        "Remove this entry? You will lose its data."
      );
      if (!ok) return;
    }
    setFieldValue(
      arrayKey,
      arr.filter((_, i) => i !== index)
    );
    return;
  }

  // last/only row
  if (REQUIRED_KEYS.has(arrayKey)) {
    // required → clear row
    setFieldValue(`${arrayKey}[0]`, { ...BLANK_ROWS[arrayKey] });
  } else {
    // optional → remove to reach empty state
    setFieldValue(arrayKey, []);
  }
};

const isSectionStarted = (step, values) => {
  const key = sectionKeyByStep[step];
  const section = values[key];
  if (!key) return false;

  if (Array.isArray(section)) {
    return section.some((item) => {
      if (typeof item === "string") return isNonEmpty(item);
      if (Array.isArray(item?.technologies) && hasAnyTech(item.technologies))
        return true;
      return (
        item &&
        typeof item === "object" &&
        Object.values(item).some(isNonEmpty)
      );
    });
  }
  if (typeof section === "string") return isNonEmpty(section);
  if (section && typeof section === "object")
    return Object.values(section).some(isNonEmpty);
  return false;
};

/* ========= Education Yup schema ========= */

const educationRowSchema = Yup.object({
  level: Yup.string().nullable(),
  field: Yup.string().nullable(),
  institution: Yup.string().nullable(),
  fromYear: Yup.string().nullable(),
  toYear: Yup.string().nullable(),
  currentlyEnrolled: Yup.boolean().nullable(),
}).test(
  "row-complete-if-started",
  null,
  function (row) {
    if (!rowHasData(row)) {
      // Entire row empty → ok, ignore this row
      return true;
    }

    const {
      level,
      field,
      institution,
      fromYear,
      toYear,
      currentlyEnrolled,
    } = row || {};

    if (!level) {
      return this.createError({
        path: `${this.path}.level`,
        message: "Level is required",
      });
    }
    if (!field) {
      return this.createError({
        path: `${this.path}.field`,
        message: "Field is required",
      });
    }
    if (!institution) {
      return this.createError({
        path: `${this.path}.institution`,
        message: "Institution is required",
      });
    }
    if (!fromYear) {
      return this.createError({
        path: `${this.path}.fromYear`,
        message: "From year is required",
      });
    }
    if (!currentlyEnrolled && !toYear) {
      return this.createError({
        path: `${this.path}.toYear`,
        message: "To year is required when not currently enrolled",
      });
    }

    return true;
  }
);

const educationValidation = Yup.array()
  .of(educationRowSchema)
  .test(
    "at-least-one-complete-education",
    "At least one education entry is required",
    (arr) => {
      const list = Array.isArray(arr) ? arr : [];
      const filledRows = list.filter(rowHasData);
      return filledRows.length > 0;
    }
  );

/* ========= Per-step validation ========= */

const getValidationSchemaForStep = (step) => {
  switch (step) {
    case 0: // Personal Details
      return Yup.object({
        personalDetails: Yup.object({
          fullName: Yup.string().required("Full name is required"),
          email: Yup.string()
            .email("Please enter a valid email")
            .required("Email is required"),
          phone: Yup.string().required("Phone is required"),
          address: Yup.string().required("Address is required"),
        }),
      });

    case 1: // Summary
      return Yup.object({
        summary: Yup.string()
          .max(1500, "Summary must be 1500 characters or less")
          .required("Summary is required"),
      });

    case 2: // Education
      return Yup.object({
        education: educationValidation,
      });

    case 4: // Skills
      return Yup.object({
        skills: Yup.array().min(1, "At least one skill is required"),
      });

    default:
      // For optional steps and preview step, no special validation
      return Yup.object({});
  }
};

/* ========= Main component ========= */
const A4_PX_WIDTH = 794;

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState("");
  const [initialValues, setInitialValues] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [applyMessage, setApplyMessage] = useState("");
  const [templateId] = useState("modern"); // ✅ locked
const [themeColor, setThemeColor] = useState("#111827"); // ✅ default black
const [variants, setVariants] = useState([]);
const [thumbs, setThumbs] = useState([]);           // [{ id, label, src }]
const [thumbLoading, setThumbLoading] = useState(false);
const [selectedVariantId, setSelectedVariantId] = useState(null);
const previewRef = React.useRef(null);
const [downloading, setDownloading] = useState(false);
const thumbRefs = React.useRef({}); // map of refs by id
const [thumbsGeneratedOnce, setThumbsGeneratedOnce] = useState(false);

const [rendered, setRendered] = useState(null);       // AI viewModel
const [renderLoading, setRenderLoading] = useState(false);
const selectedVariant =
  variants.find((x) => x.id === selectedVariantId) || variants[0] || null;

const BigComponent = selectedVariant?.Component || ModernTemplate;
const bigTheme = selectedVariant?.themeColor || themeColor;

  const [editingIndex, setEditingIndex] = useState({
    education: 0,
    experience: 0,
    projects: 0,
    certifications: 0,
    customSections: 0,
  });

  const COLOR_OPTIONS = [
  { name: "red", value: "#790808" },
  { name: "blue", value: "#0b358f" },
  { name: "purple", value: "#260d4f" },
  { name: "green", value: "#014118" },
  { name: "black", value: "#000000" },
  { name: "mustard", value: "#805802" },
];
const getSelectedTemplateId = () => selectedVariantId || variants?.[0]?.id || "modern-v1";

const PDF_MARGIN_PT = 24; // nice margin in PDF points

const waitForPaint = async () => {
  // wait next paint + fonts
  await new Promise((r) => requestAnimationFrame(() => r()));
  await new Promise((r) => setTimeout(r, 50));
  if (document.fonts?.ready) await document.fonts.ready;
};

const downloadPdfFromNode = async (node, fileName = "resume.pdf") => {
  if (!node) return;

  // Create an offscreen wrapper so capture isn't affected by page layout/overflow
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.width = `${A4_PX_WIDTH}px`;
  wrapper.style.background = "#ffffff";
  wrapper.style.padding = "0";
  wrapper.style.margin = "0";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.overflow = "visible";

  // Clone the preview node (includes the selected template + themeColor)
  const clone = node.cloneNode(true);

  // Force predictable sizing and avoid clipping
  clone.style.width = `${A4_PX_WIDTH}px`;
  clone.style.maxWidth = `${A4_PX_WIDTH}px`;
  clone.style.margin = "0";
  clone.style.boxSizing = "border-box";
  clone.style.overflow = "visible";

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    await waitForPaint();

    const targetWidth = wrapper.scrollWidth || A4_PX_WIDTH;
    const targetHeight = wrapper.scrollHeight;

    // Capture the CLONE (not wrapper) — much more reliable
    const canvas = await toCanvas(clone, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width: targetWidth,
      height: targetHeight,
    });

    const pdf = new jsPDF("p", "pt", "a4");

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const margin = PDF_MARGIN_PT;
    const printableW = pageW - margin * 2;
    const printableH = pageH - margin * 2;

    const canvasW = canvas.width;
    const canvasH = canvas.height;

    // px per one PDF printable page, keeping width fit
    const pageHeightPx = Math.floor((printableH * canvasW) / printableW);

    let y = 0;
    let pageIndex = 0;

    while (y < canvasH) {
      const sliceH = Math.min(pageHeightPx, canvasH - y);

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvasW;
      sliceCanvas.height = sliceH;

      const ctx = sliceCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, y, canvasW, sliceH, 0, 0, canvasW, sliceH);

      const imgData = sliceCanvas.toDataURL("image/png", 1.0);

      if (pageIndex > 0) pdf.addPage();

      const sliceHpt = (sliceH * printableW) / canvasW;

      pdf.addImage(imgData, "PNG", margin, margin, printableW, sliceHpt);

      y += sliceH;
      pageIndex += 1;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(wrapper);
  }
};

const handleSaveAndDownload = async (values) => {
  if (!rendered || !previewRef.current) {
    alert("Please generate templates first.");
    return;
  }

  setDownloading(true);
  try {
    const selectedTemplateId = getSelectedTemplateId();

    // 1) Save to DB with the template variant + viewModel + themeColor
    await saveResumeToDB({
      ...values,
      templateId: selectedTemplateId, // ✅ IMPORTANT: save selected variant id
      viewModel: rendered,            // ✅ save the rendered viewModel
      themeColor,                     // ✅ save selected color
    });

    // 2) Download PDF that matches what user sees
    const safeName =
           (values?.personalDetails?.fullName || "resume").replace(/[^\w]+/g, "_");

     const time = new Date().toISOString().replace(/[:.]/g, "-");

      const fileName = `${safeName}_${time}.pdf`;
      await downloadPdfFromNode(previewRef.current, fileName);

  } catch (e) {
    console.error(e);
    alert("Failed to save/download PDF. Check console.");
  } finally {
    setDownloading(false);
  }
};


// const handleSaveAndDownload = async (values) => {
//   if (!rendered) {
//     alert("Please generate templates first.");
//     return;
//   }

//   setDownloading(true);
//   try {
//     const selectedTemplateId = getSelectedTemplateId();

//     // ✅ 1. Save to backend
//     await saveResumeToDB({
//       ...values,
//       templateId: selectedTemplateId,
//       viewModel: rendered,
//       themeColor,
//     });

//     // ✅ 2. Fetch PDF with AUTH (important)
//     const pdfBlobRes = await getResumePdf(selectedTemplateId);

//     // ✅ 3. Open in new tab
//     const blobUrl = URL.createObjectURL(pdfBlobRes.data);
//     window.open(blobUrl, "_blank", "noopener,noreferrer");

//     setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

//   } catch (e) {
//     console.error(e);
//     alert("Failed to download PDF.");
//   } finally {
//     setDownloading(false);
//   }
// };
const buildVariants = (viewModel) => {
  const templates = [
    { key: "v1", label: "Modern (V1)", Component: ModernTemplate },
    { key: "v2", label: "Modern (V2)", Component: ModernTemplateV2 },
    { key: "v3", label: "Modern (V3)", Component: ModernTemplateV3 },
    { key: "v4", label: "Modern (V4)", Component: ModernTemplateV4 },
    { key: "v5", label: "Modern (V5)", Component: ModernTemplateV5 },
    { key: "v6", label: "Modern (V6)", Component: ModernTemplateV6 },
    { key: "v7", label: "Modern (V7)", Component: ModernTemplateV7 },
    { key: "v8", label: "Modern (V8)", Component: ModernTemplateV8 },
    { key: "v9", label: "Modern (V9)", Component: ModernTemplateV9 },
    { key: "v10", label: "Modern (V10)", Component: ModernTemplateV10 },
  ];

  return templates.map((t) => ({
    id: `modern-${t.key}`,
    label: t.label,
    Component: t.Component,
    data: viewModel,
  }));
};

const generateThumbnails = async (variants) => {
  setThumbLoading(true);
  try {
    // Wait a tick so hidden DOM mounts
    await new Promise((r) => setTimeout(r, 50));

    const results = [];
    for (const v of variants) {
      const node = thumbRefs.current[v.id];
      if (!node) continue;

      // Generate PNG from the hidden rendered template
      const src = await toPng(node, {
        cacheBust: true,
        pixelRatio: 1.2,   // keep it small but readable
        backgroundColor: "#ffffff",
      });

      results.push({
  id: v.id,
  label: v.label,
  src,
});
    }

    setThumbs(results);
  } catch (e) {
    console.error("Thumbnail generation failed:", e);
    setThumbs([]);
  } finally {
    setThumbLoading(false);
  }
};


  // Retrieve job and answers from URL
  const { jobId, title: jobTitle, screeningAnswers } = useJobFromQuery();

  useEffect(() => {
  loadResume();
}, []);
  useEffect(() => {
  setRendered(null);
}, [templateId]);

useEffect(() => {
  if (!rendered) return;
  const v = buildVariants(rendered);
  setVariants(v);
  setSelectedVariantId((prev) => prev || v[0]?.id || null);
}, [rendered]);

useEffect(() => {
  const run = async () => {
    if (!rendered) return;
    if (!variants || variants.length === 0) return;
    if (thumbsGeneratedOnce) return; // ✅ do it only once

    await generateThumbnails(variants);
    setThumbsGeneratedOnce(true);
  };

  run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [rendered, variants, thumbsGeneratedOnce]);

  const getEmptyForm = () => ({
  personalDetails: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
  },
  summary: "",
  education: [{ ...BLANK_ROWS.education }],
  experience: [{ ...BLANK_ROWS.experience }],
  certifications: [{ ...BLANK_ROWS.certifications }],
  projects: [{ ...BLANK_ROWS.projects }],
  languages: [{ ...BLANK_ROWS.languages }],
  skills: [],
  customSections: [],
});

  const loadResume = async () => {
  try {
    const res = await fetchResumeFromDB();
    const fetchedData = res?.data || {};

    const patchedValues = {
      ...getEmptyForm(),
      ...fetchedData,
      education:
        Array.isArray(fetchedData.education) && fetchedData.education.length > 0
          ? fetchedData.education
          : [{ ...BLANK_ROWS.education }],
      experience:
        Array.isArray(fetchedData.experience) && fetchedData.experience.length > 0
          ? fetchedData.experience
          : [{ ...BLANK_ROWS.experience }],
      certifications:
        Array.isArray(fetchedData.certifications) && fetchedData.certifications.length > 0
          ? fetchedData.certifications
          : [{ ...BLANK_ROWS.certifications }],
      projects:
        Array.isArray(fetchedData.projects) && fetchedData.projects.length > 0
          ? fetchedData.projects
          : [{ ...BLANK_ROWS.projects }],
      languages:
        Array.isArray(fetchedData.languages) && fetchedData.languages.length > 0
          ? fetchedData.languages
          : [{ ...BLANK_ROWS.languages }],
      skills:
        Array.isArray(fetchedData.skills) && fetchedData.skills.length > 0
          ? fetchedData.skills
          : [],
      customSections: Array.isArray(fetchedData.customSections)
        ? fetchedData.customSections
        : [],
    };

    setInitialValues(patchedValues);
    setThemeColor(fetchedData.themeColor || "#111827");
  } catch (err) {
    console.error("Error loading resume:", err);
    setInitialValues(getEmptyForm());
  } finally {
    setIsLoading(false);
  }
};

  /* ========= Full-form validation (final submit) ========= */

  const validationSchema = Yup.object({
    personalDetails: Yup.object({
      fullName: Yup.string().required("Full name is required"),
      email: Yup.string()
        .email("Please enter a valid email")
        .required("Email is required"),
      phone: Yup.string().required("Phone is required"),
      address: Yup.string().required("Address is required"),
    }),
    summary: Yup.string()
      .max(1500, "Summary must be 1500 characters or less")
      .required("Summary is required"),
    education: educationValidation,
    skills: Yup.array().min(1, "At least one skill is required"),
  });

  /* ========= Submit & Apply handlers ========= */

   const handleSubmit = async (values) => {
  try {
    const selectedTemplateId = getSelectedTemplateId();

    const renderRes = await renderResume({
      templateId: "modern",
      resumeJson: values,
      jobTitle: jobTitle || "",
      themeColor,
    });

    const viewModel = renderRes?.data?.viewModel;
    if (!viewModel) {
      throw new Error("No viewModel returned from render API");
    }

    const res = await saveResumeToDB({
      ...values,
      templateId: selectedTemplateId,
      viewModel,
      themeColor,
    });

    setStatusMessage("✅ Resume is made successfully!");
    setStep(steps.length - 1);

    const pdfBlobRes = await getResumePdf(selectedTemplateId);
    const blobUrl = URL.createObjectURL(pdfBlobRes.data);
    window.open(blobUrl, "_blank", "noopener,noreferrer");

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (error) {
    console.error(error);
    setStatusMessage("❌ Failed to save resume.");
  }
};


  const handleFinalApply = async (values) => {
  if (!rendered) {
    setApplyMessage("❌ Please generate the resume template first before applying.");
    return;
  }

  try {
    const selectedTemplateId = getSelectedTemplateId();

    await saveResumeToDB({
      ...values,
      templateId: selectedTemplateId,
      viewModel: rendered,
      themeColor,
    });

    setStatusMessage("✅ Resume is made successfully!");
  } catch (error) {
    setApplyMessage("❌ Error saving resume data. Cannot apply.");
    console.error("Error saving resume before applying:", error);
    return;
  }

  if (!jobId) {
    setApplyMessage("Job ID is missing. Cannot apply.");
    return;
  }

  try {
    await applicationApi.create({
      jobId,
      resumeSource: "default",
      screeningAnswers: Array.isArray(screeningAnswers)
        ? screeningAnswers
        : [],
    });

    setApplyMessage("✅ Application submitted successfully!");
    setTimeout(() => {
      navigate("/candidate/applied-jobs");
    }, 800);
  } catch (err) {
    console.error(err);
    const msg =
      err?.response?.data?.errors?.join(", ") ||
      err?.response?.data?.message ||
      "Failed to submit application.";
    setApplyMessage(`❌ ${msg}`);
  }
};

  /* ========= Step navigation ========= */

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () =>
    setStep((prev) => Math.max(prev - 1, 0));

  const handleNextStep = async (currentValues, validateForm) => {
    // Optional steps → always allow navigation
    if (isStepOptional(step)) {
      nextStep();
      return;
    }

    const stepSchema = getValidationSchemaForStep(step);

    // Only pass relevant slice of values into schema
    let toValidate = currentValues;
    if (step === 0) {
      toValidate = {
        personalDetails: currentValues.personalDetails,
      };
    } else if (step === 1) {
      toValidate = { summary: currentValues.summary };
    } else if (step === 2) {
      toValidate = { education: currentValues.education };
    } else if (step === 4) {
      toValidate = { skills: currentValues.skills };
    }

    try {
      await stepSchema.validate(toValidate, {
        abortEarly: false,
      });
      nextStep();
    } catch (validationErrors) {
      // Show errors using full-form validation
      await validateForm();
      console.log("Validation errors:", validationErrors);
    }
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 50 }, (_, i) => currentYear - i);
  };

  const setEditingIndexForSection = (section, index) => {
    setEditingIndex((prev) => ({
      ...prev,
      [section]: index,
    }));
  };

  if (isLoading)
    return (
      <div className="resume-loading">Loading...</div>
    );

  return (
    <div className="resume-builder">
      <div className="resume-container">
        {/* Progress Header + Exit button */}
        <div className="progress-header">
          <div className="progress-header-inner">
            <div className="progress-left">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((step + 1) / steps.length) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="step-indicator">
                Step {step + 1} of {steps.length}
              </div>
            </div>

            {/* ❌ Exit to Job Search (top-right cross) */}
            <button
  type="button"
  className="exit-btn"
  onClick={() => navigate("/candidate/job-search")}
  aria-label="Exit to Job Search"
  title="Exit to Job Search"
>
  ✕
</button>

          </div>
        </div>

        {jobTitle && (
          <div className="job-banner">
            Building resume for: <strong>{jobTitle}</strong>
          </div>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize

        >
{({
  values,
  errors,
  touched,
  setFieldValue,
  isValid,
  validateForm,
}) => {

  return (
    <Form className="resume-form">
              {/* Step 1: Personal Details */}
              {step === 0 && (
                <div className="form-step">
                  <h2 className="section-title">
                    Personal Details
                  </h2>
                  <p className="section-description">
                    This information will appear at the top of your resume
                  </p>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Full Name </label>
                      <Field
                        name="personalDetails.fullName"
                        placeholder="Enter your full name"
                        className={
                          errors.personalDetails?.fullName &&
                          touched.personalDetails?.fullName
                            ? "error"
                            : ""
                        }
                      />
                      <ErrorMessage
                        name="personalDetails.fullName"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    <div className="form-field">
                      <label>Email </label>
                      <Field
                        type="email"
                        name="personalDetails.email"
                        placeholder="Enter your email"
                        className={
                          errors.personalDetails?.email &&
                          touched.personalDetails?.email
                            ? "error"
                            : ""
                        }
                      />
                      <ErrorMessage
                        name="personalDetails.email"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    <div className="form-field">
                      <label>Phone </label>
                      <Field
                        type="tel"
                        name="personalDetails.phone"
                        placeholder="Enter your phone number"
                        className={
                          errors.personalDetails?.phone &&
                          touched.personalDetails?.phone
                            ? "error"
                            : ""
                        }
                      />
                      <ErrorMessage
                        name="personalDetails.phone"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    <div className="form-field full-width">
                      <label>Address </label>
                      <Field
                        name="personalDetails.address"
                        placeholder="Enter your address"
                        className={
                          errors.personalDetails?.address &&
                          touched.personalDetails?.address
                            ? "error"
                            : ""
                        }
                      />
                      <ErrorMessage
                        name="personalDetails.address"
                        component="div"
                        className="error-message"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Summary */}
              {step === 1 && (
                <div className="form-step">
                  <h2 className="section-title">
                    Professional Summary
                  </h2>
                  <p className="section-description">
                    Provide a brief overview of your career, highlighting
                    your key skills, experiences and goals
                  </p>
                  <div className="form-field full-width">
                    <Field
                      as="textarea"
                      name="summary"
                      placeholder="Write your professional summary..."
                      maxLength={1500}
                      className={`summary-textarea ${
                        errors.summary && touched.summary ? "error" : ""
                      }`}
                    />
                    <div className="char-counter">
                      {values.summary?.length || 0}/1500
                    </div>
                    <ErrorMessage
                      name="summary"
                      component="div"
                      className="error-message"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Education */}
              {step === 2 && (
                <div className="form-step">
                  <h2 className="section-title">
                    Educational Background
                  </h2>
                  <p className="section-description">
                    Detail your academic achievements and qualifications
                  </p>

                  <FieldArray name="education">
                    {({ push }) => (
                      <div className="education-section">
                        {/* Existing Education Cards */}
                        {values.education.some(
                          (edu) => !isRowEmpty(edu)
                        ) && (
                          <div className="cards-container">
                            {values.education.map(
                              (edu, index) =>
                                !isRowEmpty(edu) && (
                                  <div
                                    key={index}
                                    className="education-card"
                                  >
                                    <div className="card-content">
                                      <h4>
                                        {edu.level} in {edu.field}
                                      </h4>
                                      <p>{edu.institution}</p>
                                      <span>
                                        {edu.fromYear} –{" "}
                                        {edu.currentlyEnrolled
                                          ? "Present"
                                          : edu.toYear}
                                      </span>
                                    </div>
                                    <div className="card-actions">
                                      <button
                                        type="button"
                                        className="edit-btn"
                                        onClick={() =>
                                          setEditingIndexForSection(
                                            "education",
                                            index
                                          )
                                        }
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        className="delete-btn"
                                        onClick={() =>
                                          removeOrClearRowSmart(
                                            values,
                                            setFieldValue,
                                            "education",
                                            index
                                          )
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )
                            )}
                          </div>
                        )}

                        {/* Add / Edit Education Form */}
                        <div className="education-form">
                          <div className="form-grid">
                            <div className="form-field">
                              <label>Degree Level *</label>
                              <Field
                                as="select"
                                name={`education[${editingIndex.education}].level`}
                                className={
                                  errors.education?.[
                                    editingIndex.education
                                  ]?.level
                                    ? "error"
                                    : ""
                                }
                              >
                                <option value="">
                                  Select degree level
                                </option>
                                {DEGREE_LEVELS.map((level) => {
                                  const value =
                                    typeof level === "string"
                                      ? level
                                      : level.value || level.label || "";
                                  const label =
                                    typeof level === "string"
                                      ? level
                                      : level.label || level.value || "";

                                  return (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>

                                  );
                                })}
                              </Field>
                              <ErrorMessage
                                name={`education[${editingIndex.education}].level`}
                                component="div"
                                className="error-message"
                              />
                            </div>

                            <div className="form-field">
                              <label>Field of Study *</label>
                              <Field
                                name={`education[${editingIndex.education}].field`}
                                placeholder="e.g. Computer Science"
                                list="fieldOptions"
                                className={
                                  errors.education?.[
                                    editingIndex.education
                                  ]?.field
                                    ? "error"
                                    : ""
                                }
                              />
                              <datalist id="fieldOptions">
                                {FIELDS_OF_STUDY.map((field) => {
                                  const value =
                                    typeof field === "string"
                                      ? field
                                      : field.value || field.label || "";
                                  const label =
                                    typeof field === "string"
                                      ? field
                                      : field.label || field.value || "";
                                  return (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  );
                                })}
                              </datalist>
                              <ErrorMessage
                                name={`education[${editingIndex.education}].field`}
                                component="div"
                                className="error-message"
                              />
                            </div>

                            <div className="form-field full-width">
                              <label>Institution *</label>
                              <Field
                                name={`education[${editingIndex.education}].institution`}
                                placeholder="e.g. COMSATS University"
                                list="institutionOptions"
                                className={
                                  errors.education?.[
                                    editingIndex.education
                                  ]?.institution
                                    ? "error"
                                    : ""
                                }
                              />
                              <datalist id="institutionOptions">
                                {INSTITUTIONS.map((inst) => {
                                  const value =
                                    typeof inst === "string"
                                      ? inst
                                      : inst.value || inst.label || "";
                                  const label =
                                    typeof inst === "string"
                                      ? inst
                                      : inst.label || inst.value || "";
                                  return (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  );
                                })}
                              </datalist>
                              <ErrorMessage
                                name={`education[${editingIndex.education}].institution`}
                                component="div"
                                className="error-message"
                              />
                            </div>

                            <div className="form-field">
                              <label>Start Year *</label>
                              <Field
                                as="select"
                                name={`education[${editingIndex.education}].fromYear`}
                                className={
                                  errors.education?.[
                                    editingIndex.education
                                  ]?.fromYear
                                    ? "error"
                                    : ""
                                }
                              >
                                <option value="">
                                  Select year
                                </option>
                                {generateYearOptions().map((year) => (
                                  <option
                                    key={year}
                                    value={year}
                                  >
                                    {year}
                                  </option>
                                ))}
                              </Field>
                              <ErrorMessage
                                name={`education[${editingIndex.education}].fromYear`}
                                component="div"
                                className="error-message"
                              />
                            </div>

                            <div className="form-field">
                              <label>End Year *</label>
                              <Field
                                as="select"
                                name={`education[${editingIndex.education}].toYear`}
                                disabled={
                                  values.education[
                                    editingIndex.education
                                  ]?.currentlyEnrolled
                                }
                                className={
                                  errors.education?.[
                                    editingIndex.education
                                  ]?.toYear
                                    ? "error"
                                    : ""
                                }
                              >
                                <option value="">
                                  Select year
                                </option>
                                {generateYearOptions().map((year) => (
                                  <option
                                    key={year}
                                    value={year}
                                  >
                                    {year}
                                  </option>
                                ))}
                              </Field>
                              <ErrorMessage
                                name={`education[${editingIndex.education}].toYear`}
                                component="div"
                                className="error-message"
                              />
                            </div>

                            <div className="form-field checkbox-field">
                              <label>
                                <Field
                                  type="checkbox"
                                  name={`education[${editingIndex.education}].currentlyEnrolled`}
                                />
                                Currently Enrolled
                              </label>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="add-education-btn"
                            onClick={() => {
                              const currentEdu =
                                values.education[
                                  editingIndex.education
                                ];
                              if (
                                currentEdu.level &&
                                currentEdu.field &&
                                currentEdu.institution &&
                                currentEdu.fromYear &&
                                (currentEdu.currentlyEnrolled ||
                                  currentEdu.toYear)
                              ) {
                                push({
                                  ...BLANK_ROWS.education,
                                });
                                setEditingIndexForSection(
                                  "education",
                                  values.education.length
                                );
                              } else {
                                // Force validation so user sees what is missing
                                validateForm();
                              }
                            }}
                          >
                            + Add Education
                          </button>
                        </div>
                      </div>
                    )}
                  </FieldArray>
                </div>
              )}

              {/* Step 4: Experience */}
              {step === 3 && (
                <div className="form-step">
                  <h2 className="section-title">Add Experience</h2>
                  <p className="section-description">
                    Detail your professional work experience (Optional)
                  </p>

                  <FieldArray name="experience">
                    {({ push, move }) => (
                      <div className="experience-section">
                        {values.experience.some(
                          (exp) => !isRowEmpty(exp)
                        ) && (
                          <div className="cards-container">
                            {values.experience.map(
                              (exp, index) =>
                                !isRowEmpty(exp) && (
                                  <div
                                    key={index}
                                    className="experience-card"
                                  >
                                    <div className="card-content">
                                      <h4>{exp.jobTitle}</h4>
                                      <p>{exp.company}</p>
                                      <span>
                                        {exp.fromYear} –{" "}
                                        {exp.currentlyWorking
                                          ? "Present"
                                          : exp.toYear}
                                      </span>
                                    </div>
                                    <div className="card-actions">
                                      {index > 0 && (
                                        <button
                                          type="button"
                                          className="move-btn"
                                          onClick={() =>
                                            move(index, index - 1)
                                          }
                                        >
                                          ↑
                                        </button>
                                      )}
                                      {index <
                                        values.experience.length - 1 && (
                                        <button
                                          type="button"
                                          className="move-btn"
                                          onClick={() =>
                                            move(index, index + 1)
                                          }
                                        >
                                          ↓
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className="edit-btn"
                                        onClick={() =>
                                          setEditingIndexForSection(
                                            "experience",
                                            index
                                          )
                                        }
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        className="delete-btn"
                                        onClick={() =>
                                          removeOrClearRowSmart(
                                            values,
                                            setFieldValue,
                                            "experience",
                                            index
                                          )
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )
                            )}
                          </div>
                        )}

                        <div className="experience-form">
                          <div className="form-grid">
                            <div className="form-field">
                              <label>Job Title</label>
                              <Field
                                name={`experience[${editingIndex.experience}].jobTitle`}
                                placeholder="e.g. Software Engineer"
                                list="jobTitleOptions"
                              />
                              <datalist id="jobTitleOptions">
                                {JOB_TITLES.map((title) => {
                                  const value =
                                    typeof title === "string"
                                      ? title
                                      : title.value || title.label || "";
                                  const label =
                                    typeof title === "string"
                                      ? title
                                      : title.label || title.value || "";
                                  return (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  );
                                })}
                              </datalist>
                            </div>

                            <div className="form-field">
                              <label>Company</label>
                              <Field
                                name={`experience[${editingIndex.experience}].company`}
                                placeholder="e.g. Google"
                                list="companyOptions"
                              />
                              <datalist id="companyOptions">
                                {COMPANIES.map((company) => {
                                  const value =
                                    typeof company === "string"
                                      ? company
                                      : company.value ||
                                        company.label ||
                                        "";
                                  const label =
                                    typeof company === "string"
                                      ? company
                                      : company.label ||
                                        company.value ||
                                        "";
                                  return (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  );
                                })}
                              </datalist>
                            </div>

                            <div className="form-field">
                              <label>Start Year</label>
                              <Field
                                as="select"
                                name={`experience[${editingIndex.experience}].fromYear`}
                              >
                                <option value="">
                                  Select year
                                </option>
                                {generateYearOptions().map((year) => (
                                  <option
                                    key={year}
                                    value={year}
                                  >
                                    {year}
                                  </option>
                                ))}
                              </Field>
                            </div>

                            <div className="form-field">
                              <label>End Year</label>
                              <Field
                                as="select"
                                name={`experience[${editingIndex.experience}].toYear`}
                                disabled={
                                  values.experience[
                                    editingIndex.experience
                                  ]?.currentlyWorking
                                }
                              >
                                <option value="">
                                  Select year
                                </option>
                                {generateYearOptions().map((year) => (
                                  <option
                                    key={year}
                                    value={year}
                                  >
                                    {year}
                                  </option>
                                ))}
                              </Field>
                            </div>

                            <div className="form-field checkbox-field">
                              <label>
                                <Field
                                  type="checkbox"
                                  name={`experience[${editingIndex.experience}].currentlyWorking`}
                                />
                                I currently work here
                              </label>
                            </div>

                            <div className="form-field full-width">
                              <label>Description</label>
                              <Field
                                as="textarea"
                                name={`experience[${editingIndex.experience}].description`}
                                placeholder="Brief description of your responsibilities"
                                maxLength={1500}
                              />
                              <div className="char-counter">
                                {values.experience[
                                  editingIndex.experience
                                ]?.description?.length || 0}
                                /1500
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="add-experience-btn"
                            onClick={() => {
                              const newIndex =
                                values.experience.length;
                              push({ ...BLANK_ROWS.experience });
                              setEditingIndexForSection(
                                "experience",
                                newIndex
                              );
                            }}
                          >
                            + Add Experience
                          </button>
                        </div>
                      </div>
                    )}
                  </FieldArray>
                </div>
              )}

              {/* Step 5: Skills */}
              {step === 4 && (
                <div className="form-step">
                  <h2 className="section-title">
                    Showcase your skills
                  </h2>
                  <p className="section-description">
                    Add skills relevant to the job you are applying. Start
                    typing to see suggestions.
                  </p>

                  <div className="skills-section">
                    <TagInput
                      name="skills"
                      suggestions={SKILL_SUGGESTIONS}
                      placeholder="Enter a skill e.g. Project Management"
                    />
                    <ErrorMessage
                      name="skills"
                      component="div"
                      className="error-message"
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Projects */}
              {step === 5 && (
                <div className="form-step">
                  <h2 className="section-title">
                    Showcase your projects
                  </h2>
                  <p className="section-description">
                    Detail the projects you are proud of. You can add more
                    later. (Optional)
                  </p>

                  <FieldArray name="projects">
                    {({ push, move }) => (
                      <div className="projects-section">
                        {values.projects.some(
                          (proj) => !isRowEmpty(proj)
                        ) && (
                          <div className="cards-container">
                            {values.projects.map(
                              (proj, index) =>
                                !isRowEmpty(proj) && (
                                  <div
                                    key={index}
                                    className="project-card"
                                  >
                                    <div className="card-content">
                                      <h4>{proj.name}</h4>
                                      <p>
                                        Technologies:{" "}
                                        {proj.technologies?.join(", ")}
                                      </p>
                                    </div>
                                    <div className="card-actions">
                                      {index > 0 && (
                                        <button
                                          type="button"
                                          className="move-btn"
                                          onClick={() =>
                                            move(index, index - 1)
                                          }
                                        >
                                          ↑
                                        </button>
                                      )}
                                      {index <
                                        values.projects.length - 1 && (
                                        <button
                                          type="button"
                                          className="move-btn"
                                          onClick={() =>
                                            move(index, index + 1)
                                          }
                                        >
                                          ↓
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className="edit-btn"
                                        onClick={() =>
                                          setEditingIndexForSection(
                                            "projects",
                                            index
                                          )
                                        }
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        className="delete-btn"
                                        onClick={() =>
                                          removeOrClearRowSmart(
                                            values,
                                            setFieldValue,
                                            "projects",
                                            index
                                          )
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )
                            )}
                          </div>
                        )}

                        <div className="project-form">
                          <div className="form-grid">
                            <div className="form-field full-width">
                              <label>Project Name</label>
                              <Field
                                name={`projects[${editingIndex.projects}].name`}
                                placeholder="e.g. Portfolio Website"
                              />
                            </div>

                            <div className="form-field full-width">
                              <label>Project Description</label>
                              <Field
                                as="textarea"
                                name={`projects[${editingIndex.projects}].description`}
                                placeholder="Brief description of the project"
                                maxLength={1500}
                              />
                              <div className="char-counter">
                                {values.projects[
                                  editingIndex.projects
                                ]?.description?.length || 0}
                                /1500
                              </div>
                            </div>

                            <div className="form-field full-width">
                              <label>Technologies Used</label>
                              <TagInput
                                name={`projects[${editingIndex.projects}].technologies`}
                                suggestions={TECH_SUGGESTIONS}
                                placeholder="Type a technology and press Enter"
                              />
                            </div>

                            <div className="form-field full-width">
                              <label>Project Link (optional)</label>
                              <Field
                                name={`projects[${editingIndex.projects}].link`}
                                placeholder="https://github.com/your-project"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            className="add-project-btn"
                            onClick={() => {
                              const newIndex =
                                values.projects.length;
                              push({ ...BLANK_ROWS.projects });
                              setEditingIndexForSection(
                                "projects",
                                newIndex
                              );
                            }}
                          >
                            + Add Project
                          </button>
                        </div>
                      </div>
                    )}
                  </FieldArray>
                </div>
              )}

              {/* Step 7: Certifications */}
              {step === 6 && (
                <div className="form-step">
                  <h2 className="section-title">
                    Add Certifications
                  </h2>
                  <p className="section-description">
                    Add your professional certifications and achievements
                    (Optional)
                  </p>

                  <FieldArray name="certifications">
                    {({ push, move }) => (
                      <div className="certifications-section">
                        {values.certifications.some(
                          (cert) => !isRowEmpty(cert)
                        ) && (
                          <div className="cards-container">
                            {values.certifications.map(
                              (cert, index) =>
                                !isRowEmpty(cert) && (
                                  <div
                                    key={index}
                                    className="certification-card"
                                  >
                                    <div className="card-content">
                                      <h4>{cert.name}</h4>
                                      <p>{cert.issuedBy}</p>
                                      <span>{cert.date}</span>
                                    </div>
                                    <div className="card-actions">
                                      {index > 0 && (
                                        <button
                                          type="button"
                                          className="move-btn"
                                          onClick={() =>
                                            move(index, index - 1)
                                          }
                                        >
                                          ↑
                                        </button>
                                      )}
                                      {index <
                                        values.certifications.length -
                                          1 && (
                                        <button
                                          type="button"
                                          className="move-btn"
                                          onClick={() =>
                                            move(index, index + 1)
                                          }
                                        >
                                          ↓
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className="edit-btn"
                                        onClick={() =>
                                          setEditingIndexForSection(
                                            "certifications",
                                            index
                                          )
                                        }
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        className="delete-btn"
                                        onClick={() =>
                                          removeOrClearRowSmart(
                                            values,
                                            setFieldValue,
                                            "certifications",
                                            index
                                          )
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )
                            )}
                          </div>
                        )}

                        <div className="certification-form">
                          <div className="form-grid">
                            <div className="form-field full-width">
                              <label>Certification Name</label>
                              <Field
                                name={`certifications[${editingIndex.certifications}].name`}
                                placeholder="e.g. AWS Certified Developer – Associate"
                                list="certificationOptions"
                              />
                              <datalist id="certificationOptions">
                                {CERTIFICATIONS.map((cert) => {
                                  const value =
                                    typeof cert === "string"
                                      ? cert
                                      : cert.value ||
                                        cert.label ||
                                        "";
                                  const label =
                                    typeof cert === "string"
                                      ? cert
                                      : cert.label ||
                                        cert.value ||
                                        "";
                                  return (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  );
                                })}
                              </datalist>
                            </div>

                            <div className="form-field full-width">
                              <label>Issued By</label>
                              <Field
                                name={`certifications[${editingIndex.certifications}].issuedBy`}
                                placeholder="e.g. Amazon Web Services (AWS)"
                                list="issuerOptions"
                              />
                              <datalist id="issuerOptions">
                                {CERT_ISSUERS.map((issuer) => {
                                  const value =
                                    typeof issuer === "string"
                                      ? issuer
                                      : issuer.value ||
                                        issuer.label ||
                                        "";
                                  const label =
                                    typeof issuer === "string"
                                      ? issuer
                                      : issuer.label ||
                                        issuer.value ||
                                        "";
                                  return (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  );
                                })}
                              </datalist>
                            </div>

                            <div className="form-field">
                              <label>Issue Date</label>
                              <Field
                                type="date"
                                name={`certifications[${editingIndex.certifications}].date`}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            className="add-certification-btn"
                            onClick={() => {
                              const newIndex =
                                values.certifications.length;
                              push({
                                ...BLANK_ROWS.certifications,
                              });
                              setEditingIndexForSection(
                                "certifications",
                                newIndex
                              );
                            }}
                          >
                            + Add Certification
                          </button>
                        </div>
                      </div>
                    )}
                  </FieldArray>
                </div>
              )}

              {/* Step 8: Languages */}
              {step === 7 && (
                <div className="form-step">
                  <h2 className="section-title">
                    What languages do you speak?
                  </h2>
                  <p className="section-description">
                    Add any languages you know and specify your
                    proficiency level (Optional)
                  </p>

                  <FieldArray name="languages">
                    {({ push }) => (
                      <div className="languages-section">
                        <div className="languages-container">
                          {values.languages.map((lang, index) => (
                            <div
                              key={index}
                              className="language-entry"
                            >
                              <div className="language-field">
                                <Field
                                  as="select"
                                  name={`languages[${index}].language`}
                                >
                                  <option value="">
                                    Select Language
                                  </option>
                                  {LANGUAGES.map((languageOption) => {
                                    const value =
                                      typeof languageOption ===
                                      "string"
                                        ? languageOption
                                        : languageOption.value ||
                                          languageOption.label ||
                                          "";
                                    const label =
                                      typeof languageOption ===
                                      "string"
                                        ? languageOption
                                        : languageOption.label ||
                                          languageOption.value ||
                                          "";
                                    return (
                                      <option
                                        key={value}
                                        value={value}
                                      >
                                        {label}
                                      </option>
                                    );
                                  })}
                                </Field>
                              </div>
                              <div className="language-field">
                                <Field
                                  as="select"
                                  name={`languages[${index}].level`}
                                >
                                  <option value="">
                                    Select Level
                                  </option>
                                  {LANGUAGE_LEVELS.map((level) => {
                                    const value =
                                      typeof level === "string"
                                        ? level
                                        : level.value ||
                                          level.label ||
                                          "";
                                    const label =
                                      typeof level === "string"
                                        ? level
                                        : level.label ||
                                          level.value ||
                                          "";
                                    return (
                                      <option
                                        key={value}
                                        value={value}
                                      >
                                        {label}
                                      </option>
                                    );
                                  })}
                                </Field>
                              </div>
                              <button
                                type="button"
                                className="remove-language-btn"
                                onClick={() =>
                                  removeOrClearRowSmart(
                                    values,
                                    setFieldValue,
                                    "languages",
                                    index
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="add-language-btn"
                          onClick={() =>
                            push({ ...BLANK_ROWS.languages })
                          }
                        >
                          + Add Language
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>
              )}

              {/* Step 9: Custom Sections */}
{step === 8 && (
  <div className="form-step">
    <h2 className="section-title">Custom Sections</h2>
    <p className="section-description">
      Add extra sections like <strong>Hobbies</strong>, <strong>Awards</strong>,{" "}
      <strong>Publications</strong>, <strong>Interests</strong>, etc. (Optional)
    </p>

    <div className="custom-sections-wrap">
      <h3 className="custom-sections-title">Add custom sections</h3>
      <p className="custom-sections-desc">
        Add extra sections like <strong>Hobbies</strong>, <strong>Awards</strong>,{" "}
        <strong>Publications</strong>, <strong>Interests</strong>, etc.
      </p>

      <FieldArray name="customSections">
        {({ push, move }) => (
          <div>
            {/* Existing custom sections cards */}
            {Array.isArray(values.customSections) && values.customSections.length > 0 && (
              <div className="cards-container">
                {values.customSections.map((sec, index) => {
                  const hasTitle = (sec?.title || "").trim().length > 0;
                  const hasText = (sec?.content || "").trim().length > 0;
                  const hasItems =
                    Array.isArray(sec?.items) && sec.items.some((x) => (x || "").trim());
                  const show = hasTitle || hasText || hasItems;

                  if (!show) return null;

                  return (
                    <div key={index} className="custom-card">
                      <div className="card-content">
                        <h4>{sec.title || "Custom Section"}</h4>
                        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                          Type: <strong>{sec.type || "bullets"}</strong>
                          {sec.type === "tags" && hasItems
                            ? ` • ${sec.items.filter(Boolean).join(", ")}`
                            : ""}
                          {(sec.type === "text" || sec.type === "bullets") && hasText
                            ? ` • ${(sec.content || "").slice(0, 80)}${
                                (sec.content || "").length > 80 ? "…" : ""
                              }`
                            : ""}
                        </p>
                      </div>

                      <div className="card-actions">
                        {index > 0 && (
                          <button
                            type="button"
                            className="move-btn"
                            onClick={() => move(index, index - 1)}
                          >
                            ↑
                          </button>
                        )}
                        {index < values.customSections.length - 1 && (
                          <button
                            type="button"
                            className="move-btn"
                            onClick={() => move(index, index + 1)}
                          >
                            ↓
                          </button>
                        )}

                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => setEditingIndexForSection("customSections", index)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() =>
                            removeOrClearRowSmart(values, setFieldValue, "customSections", index)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add / Edit form */}
            <div className="custom-form">
              <div className="form-grid">
                <div className="form-field full-width">
                  <label>Section Title</label>
                  <Field
                    name={`customSections[${editingIndex.customSections}].title`}
                    placeholder="e.g. Hobbies"
                  />
                </div>

                <div className="form-field">
                  <label>Section Type</label>
                  <Field
                    as="select"
                    name={`customSections[${editingIndex.customSections}].type`}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFieldValue(`customSections[${editingIndex.customSections}].type`, val);

                      // Reset fields when switching types to avoid mixed data
                      if (val === "tags") {
                        setFieldValue(`customSections[${editingIndex.customSections}].content`, "");
                        setFieldValue(`customSections[${editingIndex.customSections}].items`, []);
                      } else {
                        setFieldValue(`customSections[${editingIndex.customSections}].items`, []);
                      }
                    }}
                  >
                    <option value="bullets">Bullet List</option>
                    <option value="text">Paragraph</option>
                    <option value="tags">Tags</option>
                  </Field>
                </div>

                {(values.customSections?.[editingIndex.customSections]?.type || "bullets") !== "tags" ? (
                  <div className="form-field full-width">
                    <label>
                      Content{" "}
                      {values.customSections?.[editingIndex.customSections]?.type === "bullets"
                        ? "(one item per line)"
                        : ""}
                    </label>
                    <Field
                      as="textarea"
                      name={`customSections[${editingIndex.customSections}].content`}
                      placeholder={
                        values.customSections?.[editingIndex.customSections]?.type === "bullets"
                          ? "e.g.\nCricket\nChess\nVolunteering"
                          : "Write a short paragraph..."
                      }
                      maxLength={2000}
                    />
                    <div className="char-counter">
                      {(values.customSections?.[editingIndex.customSections]?.content || "").length}/2000
                    </div>
                  </div>
                ) : (
                  <div className="form-field full-width">
                    <label>Items</label>
                    <TagInput
                      name={`customSections[${editingIndex.customSections}].items`}
                      suggestions={[]}
                      placeholder="Type and press Enter"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                className="add-custom-btn"
                onClick={() => {
                  // Ensure the array has at least one row to edit
                  if (!Array.isArray(values.customSections) || values.customSections.length === 0) {
                    push({ ...BLANK_ROWS.customSections });
                    setEditingIndexForSection("customSections", 0);
                    return;
                  }

                  // Validate current editing row has at least a title
                  const current = values.customSections[editingIndex.customSections];
                  const titleOk = (current?.title || "").trim().length > 0;
                  const hasText = (current?.content || "").trim().length > 0;
                  const hasItems =
                    Array.isArray(current?.items) && current.items.some((x) => (x || "").trim());

                  if (!titleOk) {
                    alert("Please enter a section title (e.g., Hobbies).");
                    return;
                  }

                  if (current?.type === "tags") {
                    if (!hasItems) {
                      alert("Please add at least one item.");
                      return;
                    }
                  } else {
                    if (!hasText) {
                      alert("Please add some content.");
                      return;
                    }
                  }

                  // Add a new blank row to start creating another section
                  const newIndex = values.customSections.length;
                  push({ ...BLANK_ROWS.customSections });
                  setEditingIndexForSection("customSections", newIndex);
                }}
              >
                + Add New Section
              </button>
            </div>
          </div>
        )}
      </FieldArray>
    </div>
  </div>
)}

{/* Step 10: Preview & Submit */}
{step === 9 && (
  <div className="form-step">
    <h2 className="section-title">Preview & Submit</h2>
    <p className="section-description">
      Please review your resume below. Generate templates, pick a theme and format, then download your PDF.
    </p>

    {/* Template generator + theme colors */}
    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
      <button
        type="button"
        className="nav-btn next-btn"
        onClick={async () => {
          setRenderLoading(true);
          try {
          
             const res = await renderResume({
  templateId: "modern",
  resumeJson: values,
  jobTitle: jobTitle || "",
  themeColor,
});

const data = res.data;
if (!data?.viewModel) {
  console.error("Render failed: no viewModel returned");
  alert("AI Preview failed. Check server logs.");
  return;
}
            setRendered(data.viewModel);

            const v = buildVariants(data.viewModel);
            setVariants(v);
            setSelectedVariantId(v[0]?.id || null);

          } catch (e) {
            console.error("AI render error:", e);
          } finally {
            setRenderLoading(false);
          }
        }}
        disabled={renderLoading}
      >
        {renderLoading ? "Generating..." : "Generate resume templates"}
      </button>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Choose a color theme:</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {COLOR_OPTIONS.map((c) => {
            const active = themeColor === c.value;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  setThemeColor(c.value);
                  // if user changes theme after first generate and wants new thumbs:
                  // setThumbsGeneratedOnce(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: active ? `2px solid ${c.value}` : "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                title={c.name}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: c.value,
                    display: "inline-block",
                  }}
                />
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>

    {/* Preview grid */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
      {/* LEFT: Big Preview */}
      <div className="preview-section">
        {rendered ? (
          <div
            ref={previewRef}
            style={{
              width: A4_PX_WIDTH,
              background: "#fff",
              margin: "0 auto",
              boxSizing: "border-box",
            }}
          >
            <BigComponent data={rendered} themeColor={themeColor} />
          </div>
        ) : (
          <div style={{ padding: 12, border: "1px dashed #e5e7eb", borderRadius: 12 }}>
            Click <strong>Generate resume templates</strong> to see the AI formatted resume.
          </div>
        )}
      </div>

      {/* RIGHT: Thumbnails */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, background: "#fff" }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Modern template formats</div>

        {!rendered ? (
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Generate the resume first to see templates.
          </div>
        ) : thumbLoading ? (
          <div style={{ color: "#6b7280", fontSize: 13 }}>Generating templates…</div>
        ) : thumbs.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: 13 }}>No templates available.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 560, overflow: "auto", paddingRight: 4 }}>
            {thumbs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedVariantId(t.id)}
                style={{
                  border: selectedVariantId === t.id ? `2px solid ${themeColor}` : "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 6,
                  background: "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <img
                  src={t.src}
                  alt={t.label}
                  style={{ width: "100%", borderRadius: 8, display: "block" }}
                />
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  {t.label}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Hidden renders for thumbnails */}
    {rendered && variants.length > 0 && (
      <div style={{ position: "fixed", left: -100000, top: 0, width: 1, height: 1, overflow: "hidden" }}>
        {variants.map((v) => {
          const Cmp = v.Component;
          return (
            <div
              key={v.id}
              ref={(el) => (thumbRefs.current[v.id] = el)}
              style={{ width: 700, padding: 10, background: "#fff" }}
            >
              <Cmp data={v.data} themeColor={themeColor} />
            </div>
          );
        })}
      </div>
    )}

    {/* Status */}
    {(statusMessage || applyMessage) && (
      <div
        className={`status-message ${
          statusMessage.includes("✅") || applyMessage.includes("✅") ? "success" : "error"
        }`}
      >
        {applyMessage || statusMessage}
      </div>
    )}

    {/* Submit buttons */}
    <div className="submit-section">
      {rendered && variants.length > 0 && (
        <button
          type="button"
          className="nav-btn submit-btn"
          onClick={() => handleSaveAndDownload(values)}
          disabled={!isValid || downloading}
          title={!isValid ? "Please complete required fields" : ""}
        >
          {downloading ? "Downloading..." : "Save & Download PDF"}
        </button>
      )}

      {jobId && (
        <button
          type="button"
          className="nav-btn apply-btn"
          onClick={() => handleFinalApply(values)}
          disabled={!isValid}
        >
          Apply to {jobTitle || jobId}
        </button>
      )}
    </div>
  </div>
)}



              {/* Navigation Buttons */}
              <div className="form-navigation">
                {step > 0 && (
                  <button
                    type="button"
                    className="nav-btn back-btn"
                    onClick={prevStep}
                  >
                    ← {steps[step - 1]}
                  </button>
                )}

                {step < steps.length - 1 && (
                  <button
                    type="button"
                    className="nav-btn next-btn"
                    onClick={() =>
                      handleNextStep(values, validateForm)
                    }
                  >
                    {steps[step + 1]} →
                  </button>
                )}
              </div>

            </Form>
          );
        }}
        </Formik>
      </div>
    </div>
  );

};

export default ResumeBuilder;
