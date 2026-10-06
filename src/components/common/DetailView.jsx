import React from 'react'

const labelStyle = { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "#6c757d" };
const valueStyle = { fontSize: 14, fontWeight: 600, wordBreak: "break-word", whiteSpace: "pre-line" };

// Read-only label/value grid used by the "View" popups
// fields: [{ label, value, badge?, badgeColors?: { bg, color }, full? }]
//   badge        render the value as a pill (green for "active", red otherwise, unless badgeColors is given)
//   full         take the full row width (long text such as "About")
const DetailView = ({ fields }) => (
  <div className="row g-3">
    {fields.map((f) => {
      const empty = f.value === undefined || f.value === null || f.value === "";
      const active = String(f.value).toLowerCase() === "active";
      const colors = f.badgeColors || (active ? { bg: "#e6f7f1", color: "#0f8a5f" } : { bg: "#fdecec", color: "#d64545" });
      return (
        <div className={f.full ? "col-12" : "col-md-6"} key={f.label}>
          <div style={labelStyle}>{f.label}</div>
          {f.badge && !empty ? (
            <span style={{
              display: "inline-block", fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 12,
              background: colors.bg, color: colors.color,
              textTransform: "capitalize",
            }}>{f.value}</span>
          ) : (
            <div style={valueStyle}>{empty ? "-" : f.value}</div>
          )}
        </div>
      );
    })}
  </div>
);

export default DetailView;
