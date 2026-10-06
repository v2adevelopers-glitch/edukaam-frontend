import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { Modal } from 'react-bootstrap';
import { useLoadingBar } from 'react-top-loading-bar';
import { CSVLink } from 'react-csv';
import toast from 'react-hot-toast';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import ContentLoader from '../loader/ContentLoader';
import DetailView from '../common/DetailView';
import { applicationsService } from '../../services/applications.service';
import {
  APPLICATION_STATUS_COLORS, APPLICATION_STATUS_OPTIONS, BOARD_OPTIONS, INTERVIEW_MODE_OPTIONS, JOB_TYPE_OPTIONS, optionLabel,
} from '../../constants/options';
import { formatDate, formatDateTime, formatInterviewWhen, isPastDate } from '../../helper/dateHelper';
import { experienceText, formatLocation, salaryRange } from '../../helper/stringMethods';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';

const selectStyles = {
  control: (base, state) => ({
    ...base, borderRadius: 8, border: "1px solid #e8edf5", background: "#f8f9fe", minHeight: 34, height: 34,
    fontSize: 13, boxShadow: "none", "&:hover": { borderColor: state.isFocused ? "#667eea" : "#e8edf5" }
  }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  indicatorsContainer: (base) => ({ ...base, height: 34 }),
  placeholder: (base) => ({ ...base, color: "#a0a8b8", fontSize: 13 }),
  menuPortal: (base) => ({ ...base, zIndex: 2000 }),
};

const IN_PROGRESS = ["applied", "shortlisted", "interview"];
const statusLabel = (s) => optionLabel(APPLICATION_STATUS_OPTIONS, s);

const MyApplicationList = () => {
  const { start, complete } = useLoadingBar({ color: "blue", height: 2 });

  const [loading, setLoading] = useState(false);
  const [listRes, setListRes] = useState({ pagination: {}, data: [] });

  const [pageValue, setPageValue] = useState(1);
  const [pagingLimit, setPagingLimit] = useState("10");
  const [goPage, setGoPage] = useState("");

  const initialFilters = { search: "", status: "" };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [show, setShow] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [pagingLimit, pageValue, appliedFilters]);

  const showSwal = (title, text, icon) => {
    withReactContent(Swal).fire({ title, text, icon })
  }

  const loadApplications = async () => {
    try {
      setLoading(true);
      start();
      const res = await applicationsService.list({
        page: Number(pageValue),
        limit: Number(pagingLimit),
        ...appliedFilters,
      });
      if (res?.success) {
        setListRes({
          pagination: res.resData?.pagination || {},
          data: res.resData?.data || []
        })
      } else {
        toast.error(res?.message);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    } finally {
      setLoading(false)
      complete();
    }
  }

  const handleWithdraw = async (item) => {
    const result = await withReactContent(Swal).fire({
      title: "Withdraw application?",
      text: `Are you sure you want to withdraw your application for "${item?.job_title}" at ${item?.institution_name}? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d93025",
      confirmButtonText: "Yes, withdraw it",
      cancelButtonText: "Cancel"
    });
    if (!result.isConfirmed) return;
    try {
      setLoading(true);
      const res = await applicationsService.delete(item?.id);
      if (res?.success) {
        toast.success(res.message);
      } else {
        toast.error(res?.message);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    } finally {
      setLoading(false);
      loadApplications();
    }
  }

  const handleView = async (id) => {
    setShow(true);
    setViewItem(null);
    try {
      setViewLoading(true);
      const res = await applicationsService.details(id);
      if (res?.success) {
        setViewItem(res.resData?.data ?? res.resData);
      } else {
        toast.error(res?.message);
        setShow(false);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error");
      setShow(false);
    } finally {
      setViewLoading(false);
    }
  }

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  const handleApply = (e) => {
    e?.preventDefault();
    setPageValue(1);
    setAppliedFilters({ ...filters });
  }

  const handleReset = () => {
    setFilters(initialFilters);
    setPageValue(1);
    setAppliedFilters(initialFilters);
  }

  const handleGoPage = () => {
    const n = Number(goPage);
    if (n >= 1 && n <= totalPage) {
      setPageValue(n);
    }
    setGoPage("");
  }

  const handlePagingLimit = (e) => {
    setPageValue(1);
    setPagingLimit(e.target.value);
  }

  const items = listRes?.data || [];
  const totalRecords = listRes?.pagination?.total || 0;
  const totalPage = listRes?.pagination?.totalPages || Math.max(1, Math.ceil(totalRecords / Number(pagingLimit)));
  const inProgressCount = items.filter(v => IN_PROGRESS.includes(v?.status)).length;
  const hiredCount = items.filter(v => v?.status === "hired").length;
  const fromRecord = totalRecords === 0 ? 0 : (pageValue - 1) * Number(pagingLimit) + 1;
  const toRecord = Math.min(pageValue * Number(pagingLimit), totalRecords);

  const getPageNumbers = () => {
    if (totalPage <= 5) return Array.from({ length: totalPage }, (_, i) => i + 1);
    const sorted = [...new Set([1, 2, totalPage - 1, totalPage, pageValue])]
      .filter(n => n >= 1 && n <= totalPage).sort((a, b) => a - b);
    const out = [];
    sorted.forEach((n, i) => {
      if (i > 0 && n - sorted[i - 1] > 1) out.push("...");
      out.push(n);
    });
    return out;
  }

  const csvHeaders = [
    { label: "Application", key: "application_code" },
    { label: "Job Code", key: "job_code" },
    { label: "Job", key: "job_title" },
    { label: "Institution", key: "institution_name" },
    { label: "Institution Type", key: "institution_type_name" },
    { label: "City", key: "job_city_name" },
    { label: "Applied On", key: "applied_on_date" },
    { label: "Status", key: "status" },
  ];
  const csvData = items.map(v => ({ ...v, applied_on_date: formatDate(v?.applied_on) }));

  const pageBtn = (active, disabled) => ({
    minWidth: 32, height: 32, padding: "0 8px", borderRadius: 8,
    border: active ? "1px solid #0d6efd" : "1px solid #e8edf5",
    background: active ? "#0d6efd" : "#fff",
    color: active ? "#fff" : disabled ? "#c3cad8" : "#444",
    fontSize: 13, fontWeight: 600, cursor: disabled ? "default" : "pointer"
  });

  const chip = (color, bg, border) => ({
    display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
    borderRadius: 10, background: bg, border: `1px solid ${border}`, color, fontSize: 13
  });

  const filterInput = { borderRadius: 8, border: "1px solid #e8edf5", background: "#f8f9fe", fontSize: 13, height: 34 };
  const actionBtn = (bg, color) => ({ width: 32, height: 32, borderRadius: 8, background: bg, color, border: 'none', padding: 0 });
  const venueLabel = (mode) => (mode === "video" ? "Meeting Link" : mode === "phone" ? "Call Details" : "Venue");

  // interview line shown under the status while the application is at the interview stage
  const interviewLine = (item) => {
    if (item?.status !== "interview") return null;
    if (!item?.interview) return <div className="mt-1" style={{ fontSize: 11, color: "#8a9ab5" }}>Interview time not set yet</div>;
    const past = isPastDate(item.interview.date);
    return (
      <div className="mt-1" style={{ fontSize: 11, color: past ? "#8a9ab5" : "#6741d9", whiteSpace: "nowrap" }}>
        <i className="bi bi-calendar-event me-1"></i>{formatInterviewWhen(item.interview.date, item.interview.time)}
        <span className="ms-1">· {optionLabel(INTERVIEW_MODE_OPTIONS, item.interview.mode)}</span>
        {past && <span className="ms-1">(past)</span>}
      </div>
    );
  }

  const badge = (status) => {
    const c = APPLICATION_STATUS_COLORS[status] || APPLICATION_STATUS_COLORS.applied;
    return { display: "inline-block", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 12, background: c.bg, color: c.color, whiteSpace: "nowrap" };
  };

  return (
    <>
      <section className="section dashboard">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="m-0 fw-bold" style={{ color: "#1a202c", fontSize: 20 }}>My Applications</h4>
            <nav className="d-flex align-items-center gap-1 mt-1" style={{ fontSize: 12, color: "#8a9ab5" }}>
              <Link to="/" style={{ color: "#8a9ab5" }}><i className="bi bi-house-door"></i></Link>
              <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
              <Link to="/openings/list" style={{ color: "#8a9ab5" }}>Jobs</Link>
              <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
              <span className="fw-semibold" style={{ color: "#4a5568" }}>Application List</span>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link to="/openings/list" className="btn btn-sm d-flex align-items-center gap-1 text-white px-3" style={{ background: "#4f3df5", borderRadius: 8, height: 34, fontSize: 13, fontWeight: 600 }}>
              <i className="bi bi-search"></i> Find Jobs
            </Link>
            <CSVLink data={csvData} headers={csvHeaders} filename="my-applications.csv"
              className="btn btn-sm d-flex align-items-center gap-1 px-3"
              style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 8, height: 34, fontSize: 13, color: "#444" }}>
              <i className="bi bi-download"></i> Export
            </CSVLink>
          </div>
        </div>

        {/* Filters */}
        <form onSubmit={handleApply} className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md">
                <input type="text" className="form-control" name="search" placeholder="Search job title or institution" value={filters.search} onChange={handleFilterChange} style={filterInput} />
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <Select
                  options={APPLICATION_STATUS_OPTIONS}
                  value={APPLICATION_STATUS_OPTIONS.find(o => o.value === filters.status) || null}
                  onChange={(o) => setFilters({ ...filters, status: o ? o.value : "" })}
                  placeholder="Select Status"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              </div>
              <div className="col-12 col-md-auto d-flex gap-2">
                <button type="submit" className="btn btn-sm d-flex align-items-center gap-1 text-white px-3" style={{ background: "#4f3df5", borderRadius: 8, height: 34, fontSize: 13, fontWeight: 600 }}>
                  <i className="bi bi-search"></i> Apply
                </button>
                <button type="button" onClick={handleReset} className="btn btn-sm d-flex align-items-center gap-1 px-3" style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 8, height: 34, fontSize: 13, color: "#444" }}>
                  <i className="bi bi-arrow-counterclockwise"></i> Reset
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Stat chips */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span style={chip("#e8590c", "#fff4e6", "#ffd8a8")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{totalRecords}</b> Total Applications</span>
          <span style={chip("#0f8a5f", "#e6f7f1", "#b7ebd6")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{inProgressCount}</b> In progress on this page</span>
          <span style={chip("#1971c2", "#e7f5ff", "#a5d8ff")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{hiredCount}</b> Hired on this page</span>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14, overflow: "hidden" }}>
          <div style={{ position: 'relative', minHeight: loading && items.length === 0 ? 120 : undefined }}>
            {loading && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(255,255,255,0.6)', display: 'flex',
                justifyContent: 'center', alignItems: 'center', zIndex: 10
              }}>
                <ContentLoader loaderType="circleSpin" />
              </div>
            )}
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr style={{ background: "#f8f9fe" }}>
                    {["Job", "Institution", "Applied On", "Status", "Actions"].map((h, i) => (
                      <th key={i} className={h === "Actions" ? "text-center" : ""} style={{
                        fontSize: "11px", fontWeight: "700", color: "#8a9ab5",
                        textTransform: "uppercase", letterSpacing: "0.6px",
                        borderBottom: "2px solid #e8edf5", padding: "10px 12px",
                        whiteSpace: "nowrap", background: "#f8f9fe"
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const canWithdraw = item?.status === "applied";
                    return (
                      <tr key={item?.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                        <td className="ps-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 36, height: 36, background: '#e8f0fe', flexShrink: 0 }}>
                              <i className="bi bi-briefcase text-primary" style={{ fontSize: 14 }}></i>
                            </div>
                            <div style={{ minWidth: 150 }}>
                              <div className="fw-semibold text-dark" style={{ fontSize: 13 }}>{item?.job_title}</div>
                              <div className="text-muted" style={{ fontSize: 11 }}>
                                {item?.job_code}{item?.job_status === "closed" && <span className="ms-1" style={{ color: "#d64545" }}>· job closed</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ minWidth: 170 }}>
                          <div style={{ fontSize: 13 }}>{item?.institution_name}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            {[item?.institution_type_name, formatLocation(item?.job_city_name, item?.job_state_name)].filter(Boolean).join(" · ")}
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{formatDate(item?.applied_on)}</td>
                        <td>
                          <span style={badge(item?.status)}>{statusLabel(item?.status)}</span>
                          {interviewLine(item)}
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <button className="btn btn-sm d-flex align-items-center justify-content-center" onClick={() => handleView(item?.id)} title="View" style={actionBtn('#e6f7f1', '#0f8a5f')}>
                              <i className="bi bi-eye-fill" style={{ fontSize: 13 }}></i>
                            </button>
                            <button className="btn btn-sm d-flex align-items-center justify-content-center" onClick={() => handleWithdraw(item)} disabled={!canWithdraw}
                              title={canWithdraw ? "Withdraw" : "Only applications still in Applied status can be withdrawn"}
                              style={{ ...actionBtn(canWithdraw ? '#fce8e6' : '#f1f3f5', canWithdraw ? '#d93025' : '#adb5bd'), opacity: 1 }}>
                              <i className="bi bi-trash-fill" style={{ fontSize: 13 }}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && items.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                      No applications found. <Link to="/openings/list">Find jobs</Link> to apply.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Phone layout: one card per application with large tap targets */}
            <div className="d-md-none">
              {items.map((item) => {
                const canWithdraw = item?.status === "applied";
                return (
                  <div key={item?.id} className="p-3" style={{ borderBottom: "1px solid #f0f2f5" }}>
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-bold text-dark" style={{ fontSize: 15 }}>{item?.job_title}</div>
                        <div style={{ fontSize: 13, color: "#4a5568" }}>{item?.institution_name}</div>
                      </div>
                      <span style={badge(item?.status)}>{statusLabel(item?.status)}</span>
                    </div>
                    <div className="mt-2 d-grid gap-1" style={{ fontSize: 13, color: "#4a5568" }}>
                      <div><i className="bi bi-geo-alt me-2 text-muted"></i>{formatLocation(item?.job_city_name, item?.job_state_name)}</div>
                      <div><i className="bi bi-clock-history me-2 text-muted"></i>Applied on {formatDate(item?.applied_on)}</div>
                      {item?.job_status === "closed" && <div style={{ color: "#d64545" }}><i className="bi bi-lock me-2"></i>This job is now closed</div>}
                    </div>
                    {item?.status === "interview" && item?.interview && (
                      <div className="mt-2 p-2" style={{ background: "#f3f0ff", borderRadius: 8, fontSize: 13, color: "#4b3f8f" }}>
                        <div className="fw-semibold"><i className="bi bi-calendar-event me-2"></i>{formatInterviewWhen(item.interview.date, item.interview.time)}</div>
                        <div style={{ fontSize: 12 }}>
                          {optionLabel(INTERVIEW_MODE_OPTIONS, item.interview.mode)}
                          {item.interview.venue && <> · {item.interview.mode === "video"
                            ? <a href={item.interview.venue} target="_blank" rel="noopener noreferrer">Join link</a>
                            : item.interview.venue}</>}
                        </div>
                      </div>
                    )}
                    <div className="d-flex gap-2 mt-3">
                      <button type="button" className="btn d-flex align-items-center gap-2 px-3" onClick={() => handleView(item?.id)}
                        style={{ background: "#e6f7f1", color: "#0f8a5f", borderRadius: 8, height: 40, fontSize: 13, fontWeight: 600, border: "none" }}>
                        <i className="bi bi-eye-fill"></i> View
                      </button>
                      {canWithdraw && (
                        <button type="button" className="btn d-flex align-items-center gap-2 px-3" onClick={() => handleWithdraw(item)}
                          style={{ background: "#fce8e6", color: "#d93025", borderRadius: 8, height: 40, fontSize: 13, fontWeight: 600, border: "none" }}>
                          <i className="bi bi-trash-fill"></i> Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {!loading && items.length === 0 && (
                <div className="text-center text-muted py-4 px-3" style={{ fontSize: 13 }}>
                  No applications found. <Link to="/openings/list">Find jobs</Link> to apply.
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 py-3" style={{ borderTop: "1px solid #eef1f6", fontSize: 13, color: "#6b7a90" }}>
            <div>Showing <b>{fromRecord}–{toRecord}</b> of <b>{totalRecords}</b> applications</div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span>Rows</span>
              <select className="form-select form-select-sm" style={{ width: 95, borderRadius: 8 }} value={pagingLimit} onChange={handlePagingLimit}>
                {["10", "20", "50", "100", "500"].map(v => <option key={v} value={v}>{v}/page</option>)}
              </select>
              <span>Go</span>
              <input type="number" min="1" max={totalPage} className="form-control form-control-sm text-center" style={{ width: 60, borderRadius: 8 }}
                value={goPage} onChange={(e) => setGoPage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGoPage()} placeholder={String(pageValue)} />
              <span>/ {totalPage}</span>
              <button type="button" style={pageBtn(false, false)} onClick={handleGoPage}>Go</button>
              <div className="d-flex align-items-center gap-1">
                <button type="button" disabled={pageValue <= 1} style={pageBtn(false, pageValue <= 1)} onClick={() => setPageValue(1)}><i className="bi bi-chevron-double-left"></i></button>
                <button type="button" disabled={pageValue <= 1} style={pageBtn(false, pageValue <= 1)} onClick={() => setPageValue(pageValue - 1)}><i className="bi bi-chevron-left"></i></button>
                {getPageNumbers().map((n, i) => n === "..."
                  ? <span key={"e" + i} className="px-1">...</span>
                  : <button type="button" key={n} style={pageBtn(n === pageValue, false)} onClick={() => setPageValue(n)}>{n}</button>)}
                <button type="button" disabled={pageValue >= totalPage} style={pageBtn(false, pageValue >= totalPage)} onClick={() => setPageValue(pageValue + 1)}><i className="bi bi-chevron-right"></i></button>
                <button type="button" disabled={pageValue >= totalPage} style={pageBtn(false, pageValue >= totalPage)} onClick={() => setPageValue(totalPage)}><i className="bi bi-chevron-double-right"></i></button>
              </div>
            </div>
          </div>
        </div>

        {/* View popup */}
        <Modal size="lg" centered show={show} onHide={() => setShow(false)}>
          <Modal.Header closeButton closeVariant="white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderBottom: 'none' }}>
            <Modal.Title className="d-flex align-items-center gap-2" style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
              <i className="bi bi-eye-fill"></i> Application Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 24, background: '#f8f9fe' }}>
            {viewLoading || !viewItem ? <ContentLoader loaderType="circleSpin" /> : (
              <DetailView fields={[
                { label: "Application Code", value: viewItem.application_code },
                { label: "Status", value: statusLabel(viewItem.status), badge: true, badgeColors: APPLICATION_STATUS_COLORS[viewItem.status] },
                { label: "Applied On", value: formatDateTime(viewItem.applied_on) },
                { label: "Last Updated", value: formatDateTime(viewItem.updated_at) },
                ...(viewItem.interview ? [
                  { label: "Interview", value: `${formatInterviewWhen(viewItem.interview.date, viewItem.interview.time)}${isPastDate(viewItem.interview.date) ? " (past)" : ""}` },
                  { label: "Interview Mode", value: optionLabel(INTERVIEW_MODE_OPTIONS, viewItem.interview.mode) },
                  {
                    label: venueLabel(viewItem.interview.mode), full: true,
                    value: viewItem.interview.mode === "video" && viewItem.interview.venue
                      ? <a href={viewItem.interview.venue} target="_blank" rel="noopener noreferrer">{viewItem.interview.venue}</a>
                      : viewItem.interview.venue,
                  },
                  { label: "Note from the Institution", value: viewItem.interview.note, full: true },
                ] : []),
                { label: "Job Title", value: viewItem.job_title },
                { label: "Job Code", value: viewItem.job_code },
                { label: "Institution", value: viewItem.institution_name },
                { label: "Institution Type", value: viewItem.institution_type_name },
                { label: "Job Category", value: viewItem.job_category_name },
                { label: "Job Type", value: optionLabel(JOB_TYPE_OPTIONS, viewItem.job_type) },
                ...(viewItem.job_subject || viewItem.job_board ? [
                  { label: "Subject", value: viewItem.job_subject },
                  { label: "Board", value: optionLabel(BOARD_OPTIONS, viewItem.job_board) },
                ] : []),
                { label: "Location", value: formatLocation(viewItem.job_city_name, viewItem.job_state_name) },
                { label: "Salary", value: salaryRange(viewItem.job_salary_min, viewItem.job_salary_max) },
                { label: "Vacancies", value: viewItem.job_vacancies },
                { label: "Minimum Qualification", value: viewItem.job_min_qualification },
                { label: "Minimum Experience", value: experienceText(viewItem.job_min_experience) },
                { label: "Last Date to Apply", value: formatDate(viewItem.job_last_date) },
                { label: "Job Status", value: viewItem.job_status, badge: true, badgeColors: viewItem.job_status === "open" ? { bg: "#e6f7f1", color: "#0f8a5f" } : undefined },
                { label: "Description", value: viewItem.job_description, full: true },
              ]} />
            )}
          </Modal.Body>
        </Modal>
      </section>
    </>
  )
}

export default MyApplicationList;
