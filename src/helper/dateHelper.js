import moment from "moment";

export const DATE_FORMAT = "DD MMM YYYY";
export const API_DATE_FORMAT = "YYYY-MM-DD";

// "2026-10-06" or ISO datetime -> "06 Oct 2026"
export const formatDate = (value) => {
  if (!value) return "";
  const m = moment(value);
  return m.isValid() ? m.format(DATE_FORMAT) : "";
};

export const formatDateTime = (value) => {
  if (!value) return "";
  const m = moment(value);
  return m.isValid() ? m.format("DD MMM YYYY, hh:mm A") : "";
};

export const todayYmd = () => moment().format(API_DATE_FORMAT);

// true when a YYYY-MM-DD date is before today
export const isPastDate = (ymd) => Boolean(ymd) && moment(ymd, API_DATE_FORMAT).isBefore(moment().startOf("day"));

// whole days from today until a YYYY-MM-DD date (negative when past)
export const daysUntil = (ymd) => {
  if (!ymd) return null;
  return moment(ymd, API_DATE_FORMAT).startOf("day").diff(moment().startOf("day"), "days");
};

// "Today", "3 days ago", ...
export const fromNow = (value) => {
  if (!value) return "";
  const m = moment(value);
  return m.isValid() ? m.fromNow() : "";
};

export const ageFromDob = (ymd) => {
  if (!ymd) return null;
  const years = moment().diff(moment(ymd, API_DATE_FORMAT), "years");
  return Number.isFinite(years) ? years : null;
};
