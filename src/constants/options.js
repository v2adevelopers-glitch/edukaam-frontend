// Fixed option lists shared by several pages (values match the API enums in src/types)

export const JOB_TYPE_OPTIONS = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "visiting", label: "Visiting" },
];

export const JOB_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

export const APPLICATION_STATUS_OPTIONS = [
  { value: "applied", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

// select / badge tints per application status
export const APPLICATION_STATUS_COLORS = {
  applied: { bg: "#e7f5ff", color: "#1971c2" },
  shortlisted: { bg: "#fff4e6", color: "#e8590c" },
  interview: { bg: "#f3f0ff", color: "#6741d9" },
  hired: { bg: "#d4edda", color: "#155724" },
  rejected: { bg: "#f8d7da", color: "#721c24" },
};

export const optionLabel = (options, value) => options.find((o) => o.value === value)?.label || value || "";

// Subjects and boards used to match teaching jobs with teachers. Stored values are the labels
// (subjects) and codes (boards) below.
export const SUBJECT_OPTIONS = [
  "All Subjects (Primary)", "Mathematics", "Physics", "Chemistry", "Biology", "General Science",
  "English", "Hindi", "Sanskrit", "Social Science", "History", "Geography", "Economics", "Commerce",
  "Accountancy", "Computer Science", "Physical Education", "Music", "Art & Craft",
].map((s) => ({ value: s, label: s }));

export const BOARD_OPTIONS = [
  { value: "cbse", label: "CBSE" },
  { value: "icse", label: "ICSE / ISC" },
  { value: "state_board", label: "State Board" },
  { value: "ib", label: "IB" },
  { value: "igcse", label: "Cambridge (IGCSE)" },
  { value: "university", label: "University / UGC" },
  { value: "competitive", label: "Competitive Exams (JEE / NEET)" },
];

export const INTERVIEW_MODE_OPTIONS = [
  { value: "in_person", label: "In person" },
  { value: "video", label: "Video call" },
  { value: "phone", label: "Phone call" },
];
