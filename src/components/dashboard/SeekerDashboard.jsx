import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import moment from 'moment';
import toast from 'react-hot-toast';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import ContentLoader from '../loader/ContentLoader';
import PageTitleAndSnackBar from '../common/PageTitleAndSnackBar';
import CountUp from '../common/CountUp';
import { DContext } from '../../context/DContext';
import { dashboardService } from '../../services/dashboard.service';
import { INTERVIEW_MODE_OPTIONS, JOB_TYPE_OPTIONS, optionLabel } from '../../constants/options';
import { daysUntil, formatDate, formatInterviewWhen } from '../../helper/dateHelper';
import { formatLocation, salaryRange } from '../../helper/stringMethods';
import { STATUS_SERIES, statusDonutOptions } from './chartTheme';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';

const SeekerDashboard = () => {
  const { authState } = useContext(DContext);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const showSwal = (title, text, icon) => {
    withReactContent(Swal).fire({ title, text, icon })
  }

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.seeker();
      if (res?.success) {
        setSummary(res.resData);
      } else {
        toast.error(res?.message);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (<ContentLoader loaderType="circleSpin" />)

  const byStatus = summary?.applications_by_status || {};
  const sent = summary?.applications_sent || 0;
  const jobs = summary?.newest_jobs || [];

  const interviewsCard = (interviews, who) => (
    <div className="card">
      <div className="card-body pb-2">
        <h5 className="card-title">Upcoming Interviews <span>| next {Math.max(interviews.length, 1)}</span></h5>
        {interviews.map(iv => (
          <div key={iv?.application_id} className="d-flex align-items-start gap-3 py-2 list-card" style={{ borderTop: "1px solid #f0f2f5" }}>
            <div className="rounded d-flex flex-column align-items-center justify-content-center"
              style={{ width: 46, height: 46, background: "#f3f0ff", color: "#6741d9", flexShrink: 0, lineHeight: 1.1 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{moment(iv?.date).format("DD")}</span>
              <span style={{ fontSize: 10, textTransform: "uppercase" }}>{moment(iv?.date).format("MMM")}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="fw-semibold text-dark" style={{ fontSize: 13 }}>{who(iv)}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>{iv?.job_title}</div>
              <div style={{ fontSize: 12, color: "#4a5568" }}>
                {formatInterviewWhen(iv?.date, iv?.time)} · {optionLabel(INTERVIEW_MODE_OPTIONS, iv?.mode)}
              </div>
            </div>
          </div>
        ))}
        {interviews.length === 0 && (
          <div className="text-center text-muted py-4" style={{ fontSize: 13, borderTop: "1px solid #f0f2f5" }}>
            No interviews scheduled.
          </div>
        )}
      </div>
    </div>
  );

  const statCard = (cls, title, sub, icon, value, note) => (
    <div className="col-12 col-sm-6 col-xl-4">
      <div className={"card info-card " + cls}>
        <div className="card-body">
          <h5 className="card-title">{title} {sub && <span>| {sub}</span>}</h5>
          <div className="d-flex align-items-center">
            <div className="card-icon rounded-circle d-flex align-items-center justify-content-center">
              <i className={"bi " + icon}></i>
            </div>
            <div className="ps-3">
              <h6><CountUp value={value} /></h6>
              {note && <span className="text-muted small">{note}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tag = (bg, color) => ({ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: bg, color, whiteSpace: "nowrap" });

  return (
    <section className="section dashboard">
      <PageTitleAndSnackBar title={`Welcome, ${authState?.user?.name || ""}`} crumbs={[{ label: "Dashboard" }]}>
        <Link to="/openings/list" className="btn btn-sm d-flex align-items-center gap-1 text-white px-3" style={{ background: "#4f3df5", borderRadius: 8, height: 34, fontSize: 13, fontWeight: 600 }}>
          <i className="bi bi-search"></i> Find Jobs
        </Link>
      </PageTitleAndSnackBar>

      <div className="row">
        {statCard("sales-card", "Applications Sent", "all time", "bi-send", sent, `${byStatus?.applied ?? 0} waiting for review`)}
        {statCard("customers-card", "Shortlisted", "now", "bi-star", summary?.shortlisted ?? 0, `${byStatus?.interview ?? 0} at interview stage`)}
        {statCard("revenue-card", "Hired", "all time", "bi-person-check", summary?.hired ?? 0, null)}
      </div>

      {(summary?.upcoming_interviews || []).length > 0 && (
        <div className="row">
          <div className="col-12">
            {interviewsCard(summary.upcoming_interviews, (iv) => iv?.institution_name)}
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-12 col-lg-5">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Application Status</h5>
              {sent === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center text-center text-muted" style={{ minHeight: 260, fontSize: 13 }}>
                  <i className="bi bi-pie-chart" style={{ fontSize: 32, color: "#c3cad8" }}></i>
                  <div className="mt-2">You have not applied for any job yet.</div>
                  <Link to="/openings/list" className="fw-semibold mt-1">Find jobs to apply</Link>
                </div>
              ) : (
                <Chart type="donut" height={320}
                  series={STATUS_SERIES.map(s => byStatus?.[s.key] || 0)}
                  options={statusDonutOptions(sent)} />
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card">
            <div className="card-body pb-2">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="card-title">Newest Open Jobs <span>| {summary?.job_category_name || "your category"}</span></h5>
                <Link to="/openings/list" style={{ fontSize: 13 }} className="fw-semibold">View all <i className="bi bi-arrow-right"></i></Link>
              </div>
              {jobs.map(j => {
                const left = daysUntil(j?.last_date);
                return (
                  <div key={j?.id} className="d-flex align-items-start gap-3 py-2 list-card" style={{ borderTop: "1px solid #f0f2f5" }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 36, height: 36, background: '#e8f0fe', flexShrink: 0 }}>
                      <i className="bi bi-briefcase text-primary" style={{ fontSize: 14 }}></i>
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="fw-semibold text-dark" style={{ fontSize: 13 }}>{j?.title}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {j?.institution_name} · {formatLocation(j?.city_name, j?.state_name)} · {optionLabel(JOB_TYPE_OPTIONS, j?.job_type)}
                      </div>
                      <div style={{ fontSize: 12, color: "#4a5568" }}>
                        {salaryRange(j?.salary_min, j?.salary_max)} · Apply by {formatDate(j?.last_date)}
                        {left !== null && left <= 7 && <span className="ms-2" style={tag("#fff4e6", "#e8590c")}>{left === 0 ? "Last day" : `${left} day${left === 1 ? "" : "s"} left`}</span>}
                      </div>
                    </div>
                    {j?.has_applied
                      ? <span style={tag("#d4edda", "#155724")}><i className="bi bi-check2-circle"></i> Applied</span>
                      : <Link to="/openings/list" style={tag("#eef0ff", "#4f3df5")}>View <i className="bi bi-arrow-right"></i></Link>}
                  </div>
                );
              })}
              {jobs.length === 0 && (
                <div className="text-center text-muted py-4" style={{ fontSize: 13, borderTop: "1px solid #f0f2f5" }}>
                  No open jobs in your category right now. Check back soon.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SeekerDashboard
