// Shared chart parameters for the dashboards (validated with the dataviz palette checker).
// Application status hues follow the status badges used in the lists: applied blue, shortlisted
// orange, interview violet, hired green, rejected red. Hired/rejected sit in the CVD warn band,
// so the donut always ships with 2px surface gaps, a legend with counts and direct labels.
export const STATUS_SERIES = [
  { key: "applied", label: "Applied", color: "#2a78d6" },
  { key: "shortlisted", label: "Shortlisted", color: "#eb6834" },
  { key: "interview", label: "Interview", color: "#4a3aa7" },
  { key: "hired", label: "Hired", color: "#008300" },
  { key: "rejected", label: "Rejected", color: "#e34948" },
];

export const SERIES_BLUE = "#2a78d6";
export const TEXT_PRIMARY = "#1a202c";
export const TEXT_SECONDARY = "#6c757d";
export const GRID = "#eef1f6";
export const SURFACE = "#ffffff";
export const FONT = "inherit";

export const statusDonutOptions = (total) => ({
  chart: { type: "donut", fontFamily: FONT, toolbar: { show: false } },
  labels: STATUS_SERIES.map((s) => s.label),
  colors: STATUS_SERIES.map((s) => s.color),
  stroke: { width: 2, colors: [SURFACE] },
  legend: {
    position: "bottom",
    fontSize: "12px",
    labels: { colors: TEXT_SECONDARY },
    markers: { size: 6 },
    itemMargin: { horizontal: 8, vertical: 4 },
    formatter: (name, opts) => `${name}: ${opts.w.globals.series[opts.seriesIndex]}`,
  },
  dataLabels: {
    enabled: true,
    formatter: (val, opts) => opts.w.globals.series[opts.seriesIndex] || "",
    style: { fontSize: "12px", fontWeight: 600 },
    dropShadow: { enabled: false },
  },
  plotOptions: {
    pie: {
      donut: {
        size: "62%",
        labels: {
          show: true,
          value: { fontSize: "22px", fontWeight: 700, color: TEXT_PRIMARY },
          total: { show: true, label: "Applications", fontSize: "12px", color: TEXT_SECONDARY, formatter: () => String(total) },
        },
      },
    },
  },
  tooltip: { y: { formatter: (v) => `${v} application${v === 1 ? "" : "s"}` } },
  states: { hover: { filter: { type: "darken", value: 0.9 } } },
});
