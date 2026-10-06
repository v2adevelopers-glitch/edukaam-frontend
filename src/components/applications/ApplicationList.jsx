import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom';
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
import { jobsService } from '../../services/jobs.service';
import { jobCategoriesService } from '../../services/job-categories.service';
import { APPLICATION_STATUS_COLORS, APPLICATION_STATUS_OPTIONS, GENDER_OPTIONS, optionLabel } from '../../constants/options';
import { ageFromDob, formatDate, formatDateTime } from '../../helper/dateHelper';
import { experienceText, formatINR, formatLocation } from '../../helper/stringMethods';
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

const statusLabel = (s) => optionLabel(APPLICATION_STATUS_OPTIONS, s);

const ApplicationList = () => {
  const { start, complete } = useLoadingBar({ color: "blue", height: 2 });
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [listRes, setListRes] = useState({ pagination: {}, data: [] });

  const [pageValue, setPageValue] = useState(1);
  const [pagingLimit, setPagingLimit] = useState("10");
  const [goPage, setGoPage] = useState("");

  // "Applicants" on the job list opens this page pre-filtered with { jobId } in router state
  const initialFilters = { search: "", job_id: "", status: "", job_category_id: "" };
  const startFilters = { ...initialFilters, job_id: location.state?.jobId ? String(location.state.jobId) : "" };
  const [filters, setFilters] = useState(startFilters);
  const [appliedFilters, setAppliedFilters] = useState(startFilters);

  const [jobOptions, setJobOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [show, setShow] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadApplications();
  }, [pagingLimit, pageValue, appliedFilters]);

  const showSwal = (title, text, icon) => {
    withReactContent(Swal).fire({ title, text, icon })
  }

  const loadFilterOptions = async () => {
    try {
      const [jobRes, catRes] = await Promise.all([
        jobsService.list({ page: 1, limit: 500 }),
        jobCategoriesService.list({ page: 1, status: "active" }),
      ]);
      if (jobRes?.success) {
        setJobOptions((jobRes.resData?.data || []).map(j => ({ value: String(j?.id), label: `${j?.title} (${j?.job_code})` })));
      } else {
        toast.error(jobRes?.message);
      }
      if (catRes?.success) {
        setCategoryOptions((catRes.resData?.data || []).map(c => ({ value: String(c?.id), label: c?.name })));
      } else {
        toast.error(catRes?.message);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    }
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

  // shared by the status select and the Hire button, after the user has confirmed
  const saveStatus = async (item, newStatus) => {
    try {
      setLoading(true);
      const res = await applicationsService.updateStatus(item?.id, { status: newStatus });
      if (res?.success) {
        toast.success(res.message);
        if (res.resData?.job_closed) {
          toast(`All ${res.resData?.job_vacancies ?? ""} vacancies for "${res.resData?.job_title}" are now filled, so the job has been closed.`,
            { icon: "🔒", duration: 6000 });
        }
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

  const handleStatusChange = async (item, newStatus) => {
    if (newStatus === item?.status) return;
    const result = await withReactContent(Swal).fire({
      title: "Change status?",
      text: `Are you sure you want to mark ${item?.seeker_name} as ${statusLabel(newStatus)} for "${item?.job_title}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, change it",
      cancelButtonText: "Cancel"
    });
    if (!result.isConfirmed) return;
    saveStatus(item, newStatus);
  }

  const handleHire = async (item) => {
    const result = await withReactContent(Swal).fire({
      title: "Hire applicant?",
      text: `Hire ${item?.seeker_name} for "${item?.job_title}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0f8a5f",
      confirmButtonText: "Yes, hire",
      cancelButtonText: "Cancel"
    });
    if (!result.isConfirmed) return;
    saveStatus(item, "hired");
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
  const shortlistedCount = items.filter(v => v?.status === "shortlisted").length;
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
    { label: "Applicant Code", key: "seeker_code" },
    { label: "Applicant", key: "seeker_name" },
    { label: "Mobile", key: "seeker_mobile" },
    { label: "Email", key: "seeker_email" },
    { label: "Job Code", key: "job_code" },
    { label: "Job", key: "job_title" },
    { label: "Experience (years)", key: "seeker_experience_years" },
    { label: "Qualification", key: "seeker_qualification" },
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
  const selectedJob = jobOptions.find(o => o.value === appliedFilters.job_id);

  return (
    <>
      <section className="section dashboard">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="m-0 fw-bold" style={{ color: "#1a202c", fontSize: 20 }}>Applicants</h4>
            <nav className="d-flex align-items-center gap-1 mt-1" style={{ fontSize: 12, color: "#8a9ab5" }}>
              <Link to="/" style={{ color: "#8a9ab5" }}><i className="bi bi-house-door"></i></Link>
              <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
              <Link to="/jobs/list" style={{ color: "#8a9ab5" }}>Jobs</Link>
              <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
              <span className="fw-semibold" style={{ color: "#4a5568" }}>Applicant List</span>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2">
            <CSVLink data={csvData} headers={csvHeaders} filename="applicants.csv"
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
                <input type="text" className="form-control" name="search" placeholder="Search applicant name or mobile" value={filters.search} onChange={handleFilterChange} style={filterInput} />
              </div>
              <div className="col-12 col-md-3">
                <Select
                  options={jobOptions}
                  value={jobOptions.find(o => o.value === filters.job_id) || null}
                  onChange={(o) => setFilters({ ...filters, job_id: o ? o.value : "" })}
                  placeholder="Select Job"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              </div>
              <div className="col-6 col-md-2">
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
              <div className="col-6 col-md-2">
                <Select
                  options={categoryOptions}
                  value={categoryOptions.find(o => o.value === filters.job_category_id) || null}
                  onChange={(o) => setFilters({ ...filters, job_category_id: o ? o.value : "" })}
                  placeholder="Select Category"
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
          <span style={chip("#e8590c", "#fff4e6", "#ffd8a8")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{totalRecords}</b> Total Applicants{selectedJob ? ` for ${selectedJob.label}` : ""}</span>
          <span style={chip("#0f8a5f", "#e6f7f1", "#b7ebd6")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{shortlistedCount}</b> Shortlisted on this page</span>
          <span style={chip("#1971c2", "#e7f5ff", "#a5d8ff")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{hiredCount}</b> Hired on this page</span>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14, overflow: "hidden" }}>
          <div style={{ position: 'relative' }}>
            {loading && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(255,255,255,0.6)', display: 'flex',
                justifyContent: 'center', alignItems: 'center', zIndex: 10
              }}>
                <ContentLoader loaderType="circleSpin" />
              </div>
            )}
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr style={{ background: "#f8f9fe" }}>
                    {["Applicant", "Job Applied For", "Contact", "Experience", "Qualification", "Applied On", "Status", "Actions"].map((h, i) => (
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
                    const colors = APPLICATION_STATUS_COLORS[item?.status] || APPLICATION_STATUS_COLORS.applied;
                    const isHired = item?.status === "hired";
                    return (
                      <tr key={item?.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                        <td className="ps-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 36, height: 36, background: '#e8f0fe', flexShrink: 0 }}>
                              <i className="bi bi-person text-primary" style={{ fontSize: 14 }}></i>
                            </div>
                            <div style={{ minWidth: 120 }}>
                              <div className="fw-semibold text-dark" style={{ fontSize: 13 }}>{item?.seeker_name}</div>
                              <div className="text-muted" style={{ fontSize: 11 }}>{item?.seeker_code}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ minWidth: 160 }}>
                          <div style={{ fontSize: 13 }}>{item?.job_title}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            {item?.job_code}{item?.job_status === "closed" && <span className="ms-1" style={{ color: "#d64545" }}>· closed</span>}
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 13 }}>
                            <i className="bi bi-telephone-fill me-1 text-primary" style={{ fontSize: 10 }}></i>
                            <a href={`tel:${item?.seeker_mobile}`} className="text-dark">{item?.seeker_mobile}</a>
                          </div>
                          <div style={{ fontSize: 11 }}>
                            <a href={`mailto:${item?.seeker_email}`} className="text-muted">{item?.seeker_email}</a>
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{experienceText(item?.seeker_experience_years)}</td>
                        <td style={{ minWidth: 140 }}>{item?.seeker_qualification}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{formatDate(item?.applied_on)}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={item?.status}
                            onChange={(e) => handleStatusChange(item, e.target.value)}
                            style={{
                              width: 'auto', minWidth: 0, height: 28, padding: '0 26px 0 10px', backgroundPosition: 'right 8px center', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              backgroundColor: colors.bg,
                              color: colors.color,
                              border: 'none'
                            }}
                          >
                            {APPLICATION_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <button className="btn btn-sm d-flex align-items-center justify-content-center" onClick={() => handleHire(item)} disabled={isHired}
                              title={isHired ? "Already hired" : "Hire"} style={{ ...actionBtn(isHired ? '#e9ecef' : '#d4edda', isHired ? '#adb5bd' : '#155724'), opacity: 1 }}>
                              <i className="bi bi-person-check-fill" style={{ fontSize: 14 }}></i>
                            </button>
                            <button className="btn btn-sm d-flex align-items-center justify-content-center" onClick={() => handleView(item?.id)} title="View" style={actionBtn('#e6f7f1', '#0f8a5f')}>
                              <i className="bi bi-eye-fill" style={{ fontSize: 13 }}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && items.length === 0 && (
                    <tr><td colSpan={8} className="text-center text-muted py-4" style={{ fontSize: 13 }}>No applicants found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 py-3" style={{ borderTop: "1px solid #eef1f6", fontSize: 13, color: "#6b7a90" }}>
            <div>Showing <b>{fromRecord}–{toRecord}</b> of <b>{totalRecords}</b> applicants</div>
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
              <i className="bi bi-eye-fill"></i> Applicant Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 24, background: '#f8f9fe' }}>
            {viewLoading || !viewItem ? <ContentLoader loaderType="circleSpin" /> : (
              <DetailView fields={[
                { label: "Applicant Name", value: viewItem.seeker_name },
                { label: "Applicant Code", value: viewItem.seeker_code },
                { label: "Mobile", value: viewItem.seeker_mobile ? <a href={`tel:${viewItem.seeker_mobile}`}>{viewItem.seeker_mobile}</a> : "" },
                { label: "Email", value: viewItem.seeker_email ? <a href={`mailto:${viewItem.seeker_email}`}>{viewItem.seeker_email}</a> : "" },
                { label: "Gender", value: optionLabel(GENDER_OPTIONS, viewItem.seeker_gender) },
                { label: "Date of Birth", value: viewItem.seeker_dob ? `${formatDate(viewItem.seeker_dob)} (${ageFromDob(viewItem.seeker_dob)} years)` : "" },
                { label: "Job Category", value: viewItem.seeker_category_name },
                { label: "Highest Qualification", value: viewItem.seeker_qualification },
                { label: "Experience", value: experienceText(viewItem.seeker_experience_years) },
                { label: "Expected Salary", value: viewItem.seeker_expected_salary ? `${formatINR(viewItem.seeker_expected_salary)} / month` : "" },
                { label: "Location", value: formatLocation(viewItem.seeker_city_name, viewItem.seeker_state_name) },
                { label: "Skills", value: viewItem.seeker_skills },
                { label: "About", value: viewItem.seeker_about, full: true },
                { label: "Job Applied For", value: `${viewItem.job_title ?? ""} (${viewItem.job_code ?? ""})` },
                { label: "Applied On", value: formatDateTime(viewItem.applied_on) },
                { label: "Application Code", value: viewItem.application_code },
                {
                  label: "Application Status", value: statusLabel(viewItem.status), badge: true,
                  badgeColors: APPLICATION_STATUS_COLORS[viewItem.status],
                },
              ]} />
            )}
          </Modal.Body>
        </Modal>
      </section>
    </>
  )
}

export default ApplicationList;
