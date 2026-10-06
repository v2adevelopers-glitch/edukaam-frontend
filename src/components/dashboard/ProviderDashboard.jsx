import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import moment from 'moment';
import toast from 'react-hot-toast';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import ContentLoader from '../loader/ContentLoader';
import PageTitleAndSnackBar from '../common/PageTitleAndSnackBar';
import { DContext } from '../../context/DContext';
import { dashboardService } from '../../services/dashboard.service';
import { APPLICATION_STATUS_COLORS, APPLICATION_STATUS_OPTIONS, INTERVIEW_MODE_OPTIONS, optionLabel } from '../../constants/options';
import { formatDate, formatInterviewWhen } from '../../helper/dateHelper';
import { FONT, GRID, SERIES_BLUE, STATUS_SERIES, TEXT_SECONDARY, statusDonutOptions } from './chartTheme';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';

const ProviderDashboard = () => {
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
      const res = await dashboardService.provider();
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
  const totalApplicants = summary?.total_applicants || 0;
  const topJobs = summary?.top_jobs || [];
  const recent = summary?.recent_applicants || [];

  const interviewsCard = (interviews, who) => (
    <div className="card">
      <div className="card-body pb-2">
        <h5 className="card-title">Upcoming Interviews <span>| next {Math.max(interviews.length, 1)}</span></h5>
        {interviews.map(iv => (
          <div key={iv?.application_id} className="d-flex align-items-start gap-3 py-2" style={{ borderTop: "1px solid #f0f2f5" }}>
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
    <div className="col-12 col-sm-6 col-xxl-3">
      <div className={"card info-card " + cls}>
        <div className="card-body">
          <h5 className="card-title">{title} {sub && <span>| {sub}</span>}</h5>
          <div className="d-flex align-items-center">
            <div className="card-icon rounded-circle d-flex align-items-center justify-content-center">
              <i className={"bi " + icon}></i>
            </div>
            <div className="ps-3">
              <h6>{value}</h6>
              {note && <span className="text-muted small">{note}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const barOptions = {
    chart: { type: "bar", fontFamily: FONT, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: "55%", borderRadius: 4, borderRadiusApplication: "end" } },
    colors: [SERIES_BLUE],
    dataLabels: { enabled: true, style: { fontSize: "12px", fontWeight: 600, colors: ["#fff"] }, offsetX: -4, textAnchor: "end" },
    xaxis: {
      categories: topJobs.map(j => j?.title),
      labels: { style: { colors: TEXT_SECONDARY, fontSize: "11px" }, formatter: (v) => String(Math.round(Number(v))) },
      tickAmount: Math.min(5, Math.max(1, ...topJobs.map(j => j?.applicants || 0))),
      decimalsInFloat: 0,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: TEXT_SECONDARY, fontSize: "12px" }, maxWidth: 180 } },
    grid: { borderColor: GRID, strokeDashArray: 3, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    tooltip: { y: { formatter: (v) => `${v} applicant${v === 1 ? "" : "s"}` }, x: { show: true } },
    states: { hover: { filter: { type: "darken", value: 0.9 } } },
  };

  const emptyChart = (text) => (
    <div className="d-flex flex-column align-items-center justify-content-center text-center text-muted" style={{ minHeight: 260, fontSize: 13 }}>
      <i className="bi bi-bar-chart" style={{ fontSize: 32, color: "#c3cad8" }}></i>
      <div className="mt-2">{text}</div>
    </div>
  );

  return (
    <section className="section dashboard">
      <PageTitleAndSnackBar title={`Welcome, ${authState?.user?.name || ""}`} crumbs={[{ label: "Dashboard" }]}>
        <Link to="/jobs/add" className="btn btn-sm d-flex align-items-center gap-1 text-white px-3" style={{ background: "#4f3df5", borderRadius: 8, height: 34, fontSize: 13, fontWeight: 600 }}>
          <i className="bi bi-plus-lg"></i> Post a Job
        </Link>
      </PageTitleAndSnackBar>

      <div className="row">
        {statCard("sales-card", "Open Jobs", "now", "bi-briefcase", summary?.open_jobs ?? 0, `of ${summary?.total_jobs ?? 0} jobs posted`)}
        {statCard("customers-card", "Total Applicants", "all jobs", "bi-people", totalApplicants, null)}
        {statCard("revenue-card", "Shortlisted", "now", "bi-star", summary?.shortlisted ?? 0, `${byStatus?.interview ?? 0} at interview stage`)}
        {statCard("hired-card", "Hired", "all jobs", "bi-person-check", summary?.hired ?? 0, null)}
      </div>

      <div className="row">
        <div className="col-12 col-lg-5">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Applications by Status</h5>
              {totalApplicants === 0
                ? emptyChart("No applications yet. They will appear here once job seekers apply.")
                : <Chart type="donut" height={320}
                  series={STATUS_SERIES.map(s => byStatus?.[s.key] || 0)}
                  options={statusDonutOptions(totalApplicants)} />}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Applicants per Job <span>| top 5</span></h5>
              {topJobs.length === 0
                ? emptyChart("No job has applicants yet.")
                : <Chart type="bar" height={Math.max(220, 56 * topJobs.length + 60)}
                  series={[{ name: "Applicants", data: topJobs.map(j => j?.applicants || 0) }]}
                  options={barOptions} />}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
      <div className="col-12 col-xl-7">
      <div className="card">
        <div className="card-body pb-0">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h5 className="card-title">Recent Applicants <span>| latest 5</span></h5>
            <Link to="/applications/list" style={{ fontSize: 13 }} className="fw-semibold">View all <i className="bi bi-arrow-right"></i></Link>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-3">
              <thead>
                <tr>
                  {["Applicant", "Job", "Applied On", "Status"].map(h => (
                    <th key={h} style={{ fontSize: 11, fontWeight: 700, color: "#8a9ab5", textTransform: "uppercase", letterSpacing: "0.6px", background: "#f8f9fe", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(r => {
                  const c = APPLICATION_STATUS_COLORS[r?.status] || APPLICATION_STATUS_COLORS.applied;
                  return (
                    <tr key={r?.id}>
                      <td>
                        <div className="fw-semibold text-dark">{r?.seeker_name}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{r?.application_code}</div>
                      </td>
                      <td>{r?.job_title}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDate(r?.applied_on)}</td>
                      <td>
                        <span style={{ display: "inline-block", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 12, background: c.bg, color: c.color }}>
                          {optionLabel(APPLICATION_STATUS_OPTIONS, r?.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recent.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                    No applicants yet. <Link to="/jobs/add">Post a job</Link> to start receiving applications.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
      <div className="col-12 col-xl-5">
        {interviewsCard(summary?.upcoming_interviews || [], (iv) => iv?.seeker_name)}
      </div>
      </div>
    </section>
  )
}

export default ProviderDashboard
