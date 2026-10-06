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
import { jobsService } from '../../services/jobs.service';
import { applicationsService } from '../../services/applications.service';
import { institutionTypesService } from '../../services/institution-types.service';
import { statesService } from '../../services/states.service';
import { citiesService } from '../../services/cities.service';
import { APPLICATION_STATUS_COLORS, APPLICATION_STATUS_OPTIONS, JOB_TYPE_OPTIONS, optionLabel } from '../../constants/options';
import { daysUntil, formatDate } from '../../helper/dateHelper';
import { experienceText, formatLocation, salaryRange } from '../../helper/stringMethods';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';

const selectStyles = {
  control: (base, state) => ({
    ...base, borderRadius: 8, border: "1px solid #e8edf5", background: state.isDisabled ? "#eef0f8" : "#f8f9fe", minHeight: 34, height: 34,
    fontSize: 13, boxShadow: "none", "&:hover": { borderColor: state.isFocused ? "#667eea" : "#e8edf5" }
  }),
  singleValue: (base, state) => ({ ...base, color: state.isDisabled ? "#4a5568" : base.color, fontWeight: state.isDisabled ? 600 : base.fontWeight }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  indicatorsContainer: (base) => ({ ...base, height: 34 }),
  placeholder: (base) => ({ ...base, color: "#a0a8b8", fontSize: 13 }),
  menuPortal: (base) => ({ ...base, zIndex: 2000 }),
};

const OpeningList = () => {
  const { start, complete } = useLoadingBar({ color: "blue", height: 2 });

  const [loading, setLoading] = useState(false);
  const [listRes, setListRes] = useState({ pagination: {}, data: [] });
  // the backend always limits openings to the seeker's own category and tells us which one
  const [category, setCategory] = useState({ id: null, name: "" });

  const [pageValue, setPageValue] = useState(1);
  const [pagingLimit, setPagingLimit] = useState("10");
  const [goPage, setGoPage] = useState("");

  const initialFilters = { search: "", institution_type_id: "", job_type: "", state_id: "", city_id: "" };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [institutionTypeOptions, setInstitutionTypeOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  const [show, setShow] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadOpenings();
  }, [pagingLimit, pageValue, appliedFilters]);

  const showSwal = (title, text, icon) => {
    withReactContent(Swal).fire({ title, text, icon })
  }

  const loadFilterOptions = async () => {
    try {
      const [typeRes, stateRes] = await Promise.all([
        institutionTypesService.list({ page: 1, status: "active" }),
        statesService.list({ page: 1, status: "active" }),
      ]);
      if (typeRes?.success) setInstitutionTypeOptions((typeRes.resData?.data || []).map(t => ({ value: String(t?.id), label: t?.name })));
      else toast.error(typeRes?.message);
      if (stateRes?.success) setStateOptions((stateRes.resData?.data || []).map(s => ({ value: String(s?.id), label: s?.name })));
      else toast.error(stateRes?.message);
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    }
  }

  const loadCities = async (stateId) => {
    if (!stateId) {
      setCityOptions([]);
      return;
    }
    try {
      const res = await citiesService.list({ page: 1, status: "active", state_id: stateId });
      if (res?.success) setCityOptions((res.resData?.data || []).map(c => ({ value: String(c?.id), label: c?.name })));
      else toast.error(res?.message);
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    }
  }

  const loadOpenings = async () => {
    try {
      setLoading(true);
      start();
      const res = await jobsService.openings({
        page: Number(pageValue),
        limit: Number(pagingLimit),
        ...appliedFilters,
      });
      if (res?.success) {
        setListRes({
          pagination: res.resData?.pagination || {},
          data: res.resData?.data || []
        })
        setCategory({ id: res.resData?.job_category_id ?? null, name: res.resData?.job_category_name || "" });
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

  const handleApplyJob = async (item) => {
    const result = await withReactContent(Swal).fire({
      title: "Apply for this job?",
      text: `Send your profile to ${item?.institution_name} for "${item?.title}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, apply",
      cancelButtonText: "Cancel"
    });
    if (!result.isConfirmed) return;
    try {
      setLoading(true);
      const res = await applicationsService.create({ job_id: item?.id });
      if (res?.success) {
        toast.success(res.message);
      } else {
        toast.error(res?.message);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    } finally {
      setLoading(false);
      loadOpenings();
    }
  }

  const handleView = async (id) => {
    setShow(true);
    setViewItem(null);
    try {
      setViewLoading(true);
      const res = await jobsService.openingDetails(id);
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

  const handleStateFilter = (o) => {
    setFilters({ ...filters, state_id: o ? o.value : "", city_id: "" });
    setCityOptions([]);
    if (o) loadCities(o.value);
  }

  const handleApply = (e) => {
    e?.preventDefault();
    setPageValue(1);
    setAppliedFilters({ ...filters });
  }

  const handleReset = () => {
    setFilters(initialFilters);
    setCityOptions([]);
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
  const appliedCount = items.filter(v => v?.has_applied).length;
  const canApplyCount = items.filter(v => !v?.has_applied && !v?.is_expired).length;
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
    { label: "Institution", key: "institution_name" },
    { label: "Institution Type", key: "institution_type_name" },
    { label: "Type", key: "job_type_label" },
    { label: "City", key: "city_name" },
    { label: "State", key: "state_name" },
    { label: "Salary Min", key: "salary_min" },
    { label: "Salary Max", key: "salary_max" },
    { label: "Vacancies", key: "vacancies" },
    { label: "Last Date", key: "last_date" },
    { label: "Applied", key: "applied_label" },
  ];
  const csvData = items.map(v => ({ ...v, job_type_label: optionLabel(JOB_TYPE_OPTIONS, v?.job_type), applied_label: v?.has_applied ? "Yes" : "No" }));

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
  const tag = (bg, color) => ({ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: bg, color, whiteSpace: "nowrap" });
  const lockedCategory = category.name ? [{ value: String(category.id), label: category.name }] : [];

  const lastDateCell = (item) => {
    const left = daysUntil(item?.last_date);
    return (
      <>
        <div>{formatDate(item?.last_date)}</div>
        {item?.is_expired
          ? <span style={tag("#fdecec", "#d64545")}>Expired</span>
          : left !== null && left <= 7 && <span style={tag("#fff4e6", "#e8590c")}>{left === 0 ? "Last day" : `${left} day${left === 1 ? "" : "s"} left`}</span>}
      </>
    );
  }

  return (
    <>
      <section className="section dashboard">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="m-0 fw-bold" style={{ color: "#1a202c", fontSize: 20 }}>Find Jobs</h4>
            <nav className="d-flex align-items-center gap-1 mt-1" style={{ fontSize: 12, color: "#8a9ab5" }}>
              <Link to="/" style={{ color: "#8a9ab5" }}><i className="bi bi-house-door"></i></Link>
              <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
              <span>Jobs</span>
              <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
              <span className="fw-semibold" style={{ color: "#4a5568" }}>Open Jobs</span>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link to="/my-applications/list" className="btn btn-sm d-flex align-items-center gap-1 text-white px-3" style={{ background: "#4f3df5", borderRadius: 8, height: 34, fontSize: 13, fontWeight: 600 }}>
              <i className="bi bi-send"></i> My Applications
            </Link>
            <CSVLink data={csvData} headers={csvHeaders} filename="open-jobs.csv"
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
              <div className="col-12 col-md-6 col-xl-3">
                <input type="text" className="form-control" name="search" placeholder="Search job title or institution" value={filters.search} onChange={handleFilterChange} style={filterInput} />
              </div>
              <div className="col-12 col-sm-6 col-md-6 col-xl-2" title="Jobs are shown for your primary job category. Change it from My Profile.">
                <Select
                  options={lockedCategory}
                  value={lockedCategory[0] || null}
                  placeholder="Your category"
                  isDisabled
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                  components={{ DropdownIndicator: () => <i className="bi bi-lock-fill px-2" style={{ color: "#8a9ab5", fontSize: 12 }}></i>, IndicatorSeparator: null }}
                />
              </div>
              <div className="col-6 col-md-3 col-xl-2">
                <Select
                  options={institutionTypeOptions}
                  value={institutionTypeOptions.find(o => o.value === filters.institution_type_id) || null}
                  onChange={(o) => setFilters({ ...filters, institution_type_id: o ? o.value : "" })}
                  placeholder="Institution Type"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              </div>
              <div className="col-6 col-md-3 col-xl-1">
                <Select
                  options={JOB_TYPE_OPTIONS}
                  value={JOB_TYPE_OPTIONS.find(o => o.value === filters.job_type) || null}
                  onChange={(o) => setFilters({ ...filters, job_type: o ? o.value : "" })}
                  placeholder="Job Type"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              </div>
              <div className="col-6 col-md-3 col-xl-2">
                <Select
                  options={stateOptions}
                  value={stateOptions.find(o => o.value === filters.state_id) || null}
                  onChange={handleStateFilter}
                  placeholder="Select State"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              </div>
              <div className="col-6 col-md-3 col-xl-2">
                <Select
                  options={cityOptions}
                  value={cityOptions.find(o => o.value === filters.city_id) || null}
                  onChange={(o) => setFilters({ ...filters, city_id: o ? o.value : "" })}
                  placeholder="Select City"
                  isClearable
                  isDisabled={!filters.state_id}
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
          <span style={chip("#e8590c", "#fff4e6", "#ffd8a8")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{totalRecords}</b> Total Open Jobs{category.name ? ` for ${category.name}` : ""}</span>
          <span style={chip("#0f8a5f", "#e6f7f1", "#b7ebd6")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{canApplyCount}</b> You can apply to on this page</span>
          <span style={chip("#1971c2", "#e7f5ff", "#a5d8ff")}><i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i><b>{appliedCount}</b> Already applied on this page</span>
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
                    {["Job", "Institution", "Location", "Salary", "Vacancies", "Last Date", "Actions"].map((h, i) => (
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
                  {items.map((item) => (
                    <tr key={item?.id} style={{ borderBottom: '1px solid #f0f2f5', opacity: item?.is_expired && !item?.has_applied ? 0.7 : 1 }}>
                      <td className="ps-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: 36, height: 36, background: '#e8f0fe', flexShrink: 0 }}>
                            <i className="bi bi-briefcase text-primary" style={{ fontSize: 14 }}></i>
                          </div>
                          <div style={{ minWidth: 150 }}>
                            <div className="fw-semibold text-dark" style={{ fontSize: 13 }}>{item?.title}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>{item?.job_code} · {optionLabel(JOB_TYPE_OPTIONS, item?.job_type)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <div style={{ fontSize: 13 }}>{item?.institution_name}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{item?.institution_type_name}</div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <i className="bi bi-geo-alt me-1 text-muted" style={{ fontSize: 11 }}></i>{formatLocation(item?.city_name, item?.state_name)}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{salaryRange(item?.salary_min, item?.salary_max)}</td>
                      <td>{item?.vacancies}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{lastDateCell(item)}</td>
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <button className="btn btn-sm d-flex align-items-center justify-content-center" onClick={() => handleView(item?.id)} title="View" style={actionBtn('#e6f7f1', '#0f8a5f')}>
                            <i className="bi bi-eye-fill" style={{ fontSize: 13 }}></i>
                          </button>
                          {item?.has_applied ? (
                            <span style={tag("#d4edda", "#155724")} title={`Status: ${optionLabel(APPLICATION_STATUS_OPTIONS, item?.application_status)}`}>
                              <i className="bi bi-check2-circle"></i> Applied
                            </span>
                          ) : item?.is_expired ? (
                            <span style={tag("#f1f3f5", "#868e96")} title="The last date to apply has passed">
                              <i className="bi bi-slash-circle"></i> Closed
                            </span>
                          ) : (
                            <button className="btn btn-sm d-flex align-items-center justify-content-center" onClick={() => handleApplyJob(item)} title="Apply" style={actionBtn('#4f3df5', '#fff')}>
                              <i className="bi bi-send-fill" style={{ fontSize: 13 }}></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && items.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                      No open jobs found{category.name ? ` for ${category.name}` : ""}. Try clearing the filters, or check back later.
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
                { label: "Job Title", value: viewItem.title },
                { label: "Job Code", value: viewItem.job_code },
                { label: "Job Category", value: viewItem.job_category_name },
                { label: "Job Type", value: optionLabel(JOB_TYPE_OPTIONS, viewItem.job_type) },
                { label: "Vacancies", value: viewItem.vacancies },
                { label: "Salary", value: salaryRange(viewItem.salary_min, viewItem.salary_max) },
                { label: "Minimum Qualification", value: viewItem.min_qualification },
                { label: "Minimum Experience", value: experienceText(viewItem.min_experience) },
                { label: "Job Location", value: formatLocation(viewItem.city_name, viewItem.state_name) },
                { label: "Last Date to Apply", value: formatDate(viewItem.last_date) + (viewItem.is_expired ? " (closed for applications)" : "") },
                { label: "Description", value: viewItem.description, full: true },
                { label: "Institution", value: viewItem.institution_name },
                { label: "Institution Type", value: viewItem.institution_type_name },
                { label: "Established", value: viewItem.institution_established_year },
                {
                  label: "Website", value: viewItem.institution_website
                    ? <a href={viewItem.institution_website} target="_blank" rel="noopener noreferrer">{viewItem.institution_website}</a> : ""
                },
                { label: "Institution Address", value: [viewItem.institution_address, formatLocation(viewItem.institution_city_name, viewItem.institution_state_name)].filter(Boolean).join(", ") },
                { label: "Posted On", value: formatDate(viewItem.created_at) },
                { label: "About the Institution", value: viewItem.institution_about, full: true },
                {
                  label: "Your Application", value: viewItem.has_applied ? optionLabel(APPLICATION_STATUS_OPTIONS, viewItem.application_status) : "Not applied yet",
                  badge: true, badgeColors: viewItem.has_applied ? APPLICATION_STATUS_COLORS[viewItem.application_status] : { bg: "#f1f3f5", color: "#868e96" },
                },
              ]} />
            )}
          </Modal.Body>
        </Modal>
      </section>
    </>
  )
}

export default OpeningList;
