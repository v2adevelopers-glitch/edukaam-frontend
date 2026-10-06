// Keeps non-negative number inputs (type="number" with min >= 0) from accepting a minus sign.
// Inputs that may legitimately be negative (e.g. latitude/longitude) simply have no min.
const isNonNegativeNumberInput = (el) =>
  el?.tagName === "INPUT" && el.type === "number" && el.min !== "" && Number(el.min) >= 0;

export const installNumberInputGuard = () => {
  document.addEventListener("keydown", (e) => {
    if (isNonNegativeNumberInput(e.target) && ["-", "+", "e", "E"].includes(e.key)) {
      e.preventDefault();
    }
  });

  document.addEventListener("paste", (e) => {
    if (!isNonNegativeNumberInput(e.target)) return;
    const text = e.clipboardData?.getData("text") || "";
    if (/[-+eE]/.test(text)) e.preventDefault();
  });
};
