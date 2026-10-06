// "full_time" -> "Full Time"
export const titleCase = (value) =>
  String(value ?? "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const capitalize = (value) => {
  const s = String(value ?? "");
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
};

// 45000 -> "₹45,000"
export const formatINR = (value) => {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "";
  return "₹" + Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

export const salaryRange = (min, max) => {
  const a = formatINR(min);
  const b = formatINR(max);
  if (a && b) return Number(min) === Number(max) ? `${a} / month` : `${a} – ${b} / month`;
  return a || b ? `${a || b} / month` : "";
};

export const experienceText = (years) => {
  if (years === null || years === undefined || years === "") return "";
  const n = Number(years);
  if (n === 0) return "Fresher";
  return `${n} ${n === 1 ? "year" : "years"}`;
};

export const initials = (name) =>
  String(name ?? "")
    .split(" ")
    .filter((w) => w && /[A-Za-z]/.test(w[0]) && !/^(dr|mr|mrs|ms|prof|sister)\.?$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export const formatLocation = (city, state) => [city, state].filter(Boolean).join(", ");
