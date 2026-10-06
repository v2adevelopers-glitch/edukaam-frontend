import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Modal } from 'react-bootstrap';
import { useLoadingBar } from 'react-top-loading-bar';
import { CSVLink } from 'react-csv';
import toast from 'react-hot-toast';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import ContentLoader from '../loader/ContentLoader';
import DetailView from '../common/DetailView';
import { jobsService } from '../../services/jobs.service';
import { jobCategoriesService } from '../../services/job-categories.service';
import { JOB_STATUS_OPTIONS, JOB_TYPE_OPTIONS, optionLabel } from '../../constants/options';
import { formatDate, isPastDate } from '../../helper/dateHelper';
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

const JobList = () => {
  const { start, complete } = useLoadingBar({ color: "blue", height: 2 });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [listRes, setListRes] = useState({ pagination: {}, data: [] });

  const [pageValue, setPageValue] = useState(1);
  const [pagingLimit, setPagingLimit] = useState("10");
  const [goPage, setGoPage] = useState("");

  const initialFilters = { search: "", job_category_id: "", job_type: "", status: "" };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [categoryOptions, setCategoryOptions] = useState([]);

  const [show, setShow] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadJobs();
  }, [pagingLimit, pageValue, appliedFilters]);

  const showSwal = (title, text, icon) => {
    withReactContent(Swal).fire({ title, text, icon })
  }

  const loadCategories = async () => {
    try {
      const res = await jobCategoriesService.list({ page: 1, status: "active" });
      if (res?.success) {
        setCategoryOptions((res.resData?.data || []).map(c => ({ value: String(c?.id), label: c?.name })));
      } else {
        toast.error(res?.message);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    }
  }

  const loadJobs = async () => {
    try {
      setLoading(true);
      start();
      const res = await jobsService.list({
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

  const handleStatusChange = async (item, newStatus) => {
    if (newStatus === item?.status) return;
    const result = await withReactContent(Swal).fire({
      title: "Change status?",
      text: `Are you sure you want to mark "${item?.title}" as ${newStatus}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, change it",
      cancelButtonText: "Cancel"
    });
    if (!result.isConfirmed) return;
    try {
      setLoading(true);
      const res = await jobsService.updateStatus(item?.id, { status: newStatus });
      if (res?.success) {
        toast.success(res.message);
      } else {
        toast.error(res?.message);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    } finally {
      setLoading(false);
      loadJobs();
    }
  }

  const handleDelete = async (item) => {
    const result = await withReactContent(Swal).fire({
      title: "Delete job?",
      text: `Are you sure you want to delete "${item?.title}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d93025",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel"
    });
    if (!result.isConfirmed) return;
    try {
      setLoading(true);
      const res = await jobsService.delete(item?.id);
      if (res?.success) {
        toast.success(res.message);
      } else {
        toast.error(res?.message, { duration: 6000 });
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    } finally {
      setLoading(false);
      loadJobs();
    }
  }

  const handleEdit = (item) => {
    navigate("/jobs/add", { state: { jobId: item?.id } });
  }

  const handleApplicants = (item) => {
    navigate("/applications/list", { state: { jobId: item?.id } });
  }

  const handleView = async (id) => {
    setShow(true);
    setViewItem(null);
    try {
      setViewLoading(true);
      const res = await jobsService.details(id);
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
  const openCount = items.filter(v => v?.status === "open").length;
  const applicantsOnPage = items.reduce((sum, v) => sum + (Number(v?.applicants_count) || 0), 0);
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
    { label: "Code", key: "job_code" },
    { label: "Title", key: "title" },
    { label: "Category", key: "job_category_name" },
    { label: "Type", key: "job_type_label" },
    { label: "City", key: "city_name" },
    { label: "State", key: "state_name" },
    { label: "Vacancies", key: "vacancies" },
    { label: "Hired", key: "hired_count" },
    { label: "Applicants", key: "applicants_count" },
    { label: "Salary Min", key: "salary_min" },
    { label: "Salary Max", key: "salary_max" },
    { label: "Last Date", key: "last_date" },
    { label: "Status", key: "status" },
  ];
  const csvData = items.map(v => ({ ...v, job_type_label: optionLabel(JOB_TYPE_OPTIONS, v?.job_type) }));

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
  const tag = (bg, color) => ({ display: "inline-block", fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 10, background: bg, color });

  return (
    <>
      <section className="section dashboard">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="m-0 fw-bold" style={{ color: "#1a202c", fontSize: 20 }}>My Jobs</h4>
            <nav className="d-flex align-items-center gap-1 mt-1" style={{ fontSize: 12, color: "#8a9ab5" }}>
              <Link to="/" style={{ color: "#8a9ab5" }}><i className="bi bi-house-door"></i></Link>
              <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
              <span>Jobs</span>
              <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
              <span className="fw-semibold" style={{ color: "#4a5568" }}>Job List</span>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link to="/jobs/add" className="btn btn-sm d-flex align-items-center gap-1 text-white px-3" style={{ background: "#4f3df5", borderRadius: 8, height: 34, fontSize: 13, fontWeight: 600 }}>
              <i className="bi bi-plus-lg"></i> Post a Job
            </Link>
            <CSVLink data={csvData} headers={csvHeaders} filename="jobs.csv"
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
                <input type="text" className="form-control" name="search" placeholder="Search job title or code" value={filters.search} onChange={handleFilterChange} style={filterInput} />
              </div>
              <div className="col-12 col-sm-6 col-md-3 col-xl-2">
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
              <div className="col-6 col-md-2">
                <Select
                  options={JOB_TYPE_OPTIONS}
                  value={JOB_TYPE_OPTIONS.find(o => o.value === filters.job_type) || null}
                  onChange={(o) => setFilters({ ...filters, job_type: o ? o.value : "" })}
                  placeholder="Select Type"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              </div>
              <div className="col-6 col-md-2">
                <Select
                  options={JOB_STATUS_OPTIONS}
                  value={JOB_STATUS_OPTIONS.find(o => o.value === filters.status) || null}
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
          <span style={chip("#e8590c", "#fff4e6", "#ffd8a8")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{totalRecords}</b> Total Jobs</span>
          <span style={chip("#0f8a5f", "#e6f7f1", "#b7ebd6")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{openCount}</b> Open on this page</span>
          <span style={chip("#1971c2", "#e7f5ff", "#a5d8ff")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{applicantsOnPage}</b> Applicants on this page</span>
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
                    {["Job", "Category", "Type", "Location", "Vacancies", "Applicants", "Last Date", "Status", "Actions"].map((h, i) => (
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
                    const expired = isPastDate(item?.last_date);
                    return (
                      <tr key={item?.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                        <td className="ps-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 36, height: 36, background: '#e8f0fe', flexShrink: 0 }}>
                              <i className="bi bi-briefcase text-primary" style={{ fontSize: 14 }}></i>
                            </div>
                            <div style={{ minWidth: 160 }}>
                              <div className="fw-semibold text-dark" style={{ fontSize: 13 }}>{item?.title}</div>
                              <div className="text-muted" style={{ fontSize: 11 }}>{item?.job_code}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{item?.job_category_name}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{optionLabel(JOB_TYPE_OPTIONS, item?.job_type)}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <i className="bi bi-geo-alt me-1 text-muted" style={{ fontSize: 11 }}></i>{formatLocation(item?.city_name, item?.state_name)}
                        </td>
                        <td>
                          <div className="fw-semibold">{item?.vacancies}</div>
                          {Number(item?.hired_count) > 0 && <div className="text-muted" style={{ fontSize: 11 }}>{item?.hired_count} hired</div>}
                        </td>
                        <td>
                          <span style={tag(Number(item?.applicants_count) > 0 ? "#e7f5ff" : "#f1f3f5", Number(item?.applicants_count) > 0 ? "#1971c2" : "#868e96")}>
                            {item?.applicants_count ?? 0}
                          </span>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div>{formatDate(item?.last_date)}</div>
                          {expired && <span style={tag("#fdecec", "#d64545")}>Expired</span>}
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={item?.status}
                            onChange={(e) => handleStatusChange(item, e.target.value)}
                            style={{
                              width: 'auto', minWidth: 0, height: 28, padding: '0 26px 0 10px', backgroundPosition: 'right 8px center', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              backgroundColor: item?.status === "open" ? '#d4edda' : '#f8d7da',
                              color: item?.status === "open" ? '#155724' : '#721c24',
                              border: 'none'
                            }}
                          >
                            <option value="open">Open</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <button className="btn btn-sm d-flex align-items-center justify-content-center" onClick={() => handleApplicants(item)} title="Applicants" style={actionBtn('#f3f0ff', '#6741d9')}>
                              <i className="bi bi-people-fill" style={{ fontSize: 13 }}></i>
                            </button>
                            <button className="btn btn-sm d-flex align-items-center justify-content-center" onClick={() => handleView(item?.id)} title="View" style={actionBtn('#e6f7f1', '#0f8a5f')}>
                              <i className="bi bi-eye-fill" style={{ fontSize: 13 }}></i>
                            </button>
                            <button className="btn btn-sm d-flex align-items-center justify-content-center" onClick={() => handleEdit(item)} title="Edit" style={actionBtn('#e8f0fe', '#0d6efd')}>
                              <i className="bi bi-pencil-fill" style={{ fontSize: 13 }}></i>
                            </button>
                            <button className="btn btn-sm d-flex align-items-center justify-content-center" onClick={() => handleDelete(item)} title="Delete" style={actionBtn('#fce8e6', '#d93025')}>
                              <i className="bi bi-trash-fill" style={{ fontSize: 13 }}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && items.length === 0 && (
                    <tr><td colSpan={9} className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                      No jobs found. <Link to="/jobs/add">Post a job</Link> to start receiving applications.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 py-3" style={{ borderTop: "1px solid #eef1f6", fontSize: 13, color: "#6b7a90" }}>
            <div>Showing <b>{fromRecord}–{toRecord}</b> of <b>{totalRecords}</b> jobs</div>
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
              <i className="bi bi-eye-fill"></i> Job Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 24, background: '#f8f9fe' }}>
            {viewLoading || !viewItem ? <ContentLoader loaderType="circleSpin" /> : (
              <DetailView fields={[
                { label: "Job Code", value: viewItem.job_code },
                { label: "Title", value: viewItem.title },
                { label: "Job Category", value: viewItem.job_category_name },
                { label: "Job Type", value: optionLabel(JOB_TYPE_OPTIONS, viewItem.job_type) },
                { label: "Vacancies", value: viewItem.vacancies },
                { label: "Hired", value: viewItem.hired_count },
                { label: "Applicants", value: viewItem.applicants_count },
                { label: "Minimum Qualification", value: viewItem.min_qualification },
                { label: "Minimum Experience", value: experienceText(viewItem.min_experience) },
                { label: "Salary", value: salaryRange(viewItem.salary_min, viewItem.salary_max) },
                { label: "Location", value: formatLocation(viewItem.city_name, viewItem.state_name) },
                { label: "Last Date to Apply", value: formatDate(viewItem.last_date) + (isPastDate(viewItem.last_date) ? " (expired)" : "") },
                { label: "Posted On", value: formatDate(viewItem.created_at) },
                { label: "Status", value: viewItem.status, badge: true, badgeColors: viewItem.status === "open" ? { bg: "#e6f7f1", color: "#0f8a5f" } : undefined },
                { label: "Description", value: viewItem.description, full: true },
              ]} />
            )}
          </Modal.Body>
        </Modal>
      </section>
    </>
  )
}

export default JobList;
