export const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value ?? "").trim());

export const isValidMobile = (value) => /^\d{10}$/.test(String(value ?? ""));

export const isValidPincode = (value) => /^\d{6}$/.test(String(value ?? ""));

// at least 8 characters with a letter and a number
export const isStrongPassword = (value) => {
  const s = String(value ?? "");
  return s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);
};

export const isValidUrl = (value) => {
  const s = String(value ?? "").trim();
  if (!s) return true;
  try {
    const url = new URL(s);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const isValidYear = (value, min = 1800) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= new Date().getFullYear();
};

export const isBlank = (value) => String(value ?? "").trim() === "";
