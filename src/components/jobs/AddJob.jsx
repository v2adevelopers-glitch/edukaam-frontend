import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-multi-date-picker';
import toast from 'react-hot-toast';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import ContentLoader from '../loader/ContentLoader';
import { jobsService } from '../../services/jobs.service';
import { jobCategoriesService } from '../../services/job-categories.service';
import { statesService } from '../../services/states.service';
import { citiesService } from '../../services/cities.service';
import { JOB_STATUS_OPTIONS, JOB_TYPE_OPTIONS } from '../../constants/options';
import { isPastDate } from '../../helper/dateHelper';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';

const GRAD = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

const initialJob = {
  title: "",
  job_category_id: null,
  job_type: "",
  vacancies: "1",
  min_qualification: "",
  min_experience: "0",
  salary_min: "",
  salary_max: "",
  state_id: null,
  city_id: null,
  last_date: "",
  description: "",
  status: "open",
};

const AddJob = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editJobId = location.state?.jobId;
  const isEdit = !!editJobId;

  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState(initialJob);
  const [applicantsCount, setApplicantsCount] = useState(0);
  const [originalLastDate, setOriginalLastDate] = useState("");

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  useEffect(() => {
    loadForm();
  }, [editJobId]);

  const showSwal = (title, text, icon) => {
    withReactContent(Swal).fire({ title, text, icon })
  }

  const loadCities = async (stateId) => {
    if (!stateId) {
      setCityOptions([]);
      return;
    }
    const res = await citiesService.list({ page: 1, status: "active", state_id: stateId });
    if (res?.success) {
      setCityOptions((res.resData?.data || []).map(c => ({ value: c?.id, label: c?.name })));
    } else {
      toast.error(res?.message);
    }
  }

  // parent options first, then (in edit mode) the record, then the dependent city list
  const loadForm = async () => {
    try {
      setLoading(true);
      const [catRes, stateRes] = await Promise.all([
        jobCategoriesService.list({ page: 1, status: "active" }),
        statesService.list({ page: 1, status: "active" }),
      ]);
      if (catRes?.success) setCategoryOptions((catRes.resData?.data || []).map(c => ({ value: c?.id, label: c?.name })));
      else toast.error(catRes?.message);
      if (stateRes?.success) setStateOptions((stateRes.resData?.data || []).map(s => ({ value: s?.id, label: s?.name })));
      else toast.error(stateRes?.message);

      if (!isEdit) {
        setJob(initialJob);
        setCityOptions([]);
        return;
      }
      const res = await jobsService.details(editJobId);
      if (res?.success) {
        const v = res.resData?.data ?? res.resData;
        setJob({
          title: v?.title || "",
          job_category_id: v?.job_category_id || null,
          job_type: v?.job_type || "",
          vacancies: String(v?.vacancies ?? "1"),
          min_qualification: v?.min_qualification || "",
          min_experience: String(v?.min_experience ?? "0"),
          salary_min: String(v?.salary_min ?? ""),
          salary_max: String(v?.salary_max ?? ""),
          state_id: v?.state_id || null,
          city_id: v?.city_id || null,
          last_date: v?.last_date || "",
          description: v?.description || "",
          status: v?.status || "open",
        });
        setApplicantsCount(Number(v?.applicants_count) || 0);
        setOriginalLastDate(v?.last_date || "");
        await loadCities(v?.state_id);
      } else {
        toast.error(res?.message);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    setJob({ ...job, [e.target.name]: e.target.value });
  }

  const handleStateChange = (o) => {
    setJob({ ...job, state_id: o ? o.value : null, city_id: null });
    setCityOptions([]);
    if (o) loadCities(o.value);
  }

  const validate = () => {
    if (!job.title.trim()) return "Job title is required";
    if (!job.job_category_id) return "Job category is required";
    if (!job.job_type) return "Job type is required";
    if (!(Number(job.vacancies) >= 1) || !Number.isInteger(Number(job.vacancies))) return "Vacancies must be at least 1";
    if (!job.min_qualification.trim()) return "Minimum qualification is required";
    if (job.min_experience === "" || Number(job.min_experience) < 0) return "Minimum experience is required";
    if (job.salary_min === "" || Number(job.salary_min) < 0) return "Minimum salary is required";
    if (job.salary_max === "" || Number(job.salary_max) < 0) return "Maximum salary is required";
    if (Number(job.salary_max) < Number(job.salary_min)) return "Maximum salary must be greater than or equal to minimum salary";
    if (!job.state_id) return "State is required";
    if (!job.city_id) return "City is required";
    if (!job.last_date) return "Last date to apply is required";
    if (job.last_date !== originalLastDate && isPastDate(job.last_date)) return "Last date to apply cannot be in the past";
    if (!job.description.trim()) return "Description is required";
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const confirm = await withReactContent(Swal).fire({
      title: isEdit ? "Update job?" : "Post job?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isEdit ? "Yes, update" : "Yes, post it",
      cancelButtonText: "Cancel"
    });
    if (!confirm.isConfirmed) return;

    const payload = {
      ...job,
      title: job.title.trim(),
      min_qualification: job.min_qualification.trim(),
      description: job.description.trim(),
      vacancies: Number(job.vacancies),
      min_experience: Number(job.min_experience),
      salary_min: Number(job.salary_min),
      salary_max: Number(job.salary_max),
    };

    try {
      setLoading(true);
      const res = isEdit
        ? await jobsService.update(editJobId, payload)
        : await jobsService.create(payload);
      if (res?.success) {
        await withReactContent(Swal).fire({ title: "Success", text: res.message, icon: "success" });
        if (isEdit) {
          navigate("/jobs/list");
        } else {
          setJob(initialJob);
          setCityOptions([]);
        }
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

  const labelStyle = { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "#6c757d", marginBottom: 6 };
  const inputStyle = { borderRadius: 8, border: "1px solid #dfe3ec", fontSize: 13, height: 40, background: "#fff" };
  const textareaStyle = { ...inputStyle, height: "auto" };
  const selectStyles = {
    control: (base, state) => ({
      ...base, borderRadius: 8, border: state.isFocused ? "1px solid #667eea" : "1px solid #dfe3ec", minHeight: 40,
      fontSize: 13, boxShadow: state.isFocused ? "0 0 0 3px rgba(102,126,234,.15)" : "none", "&:hover": { borderColor: "#667eea" },
      background: state.isDisabled ? "#eef0f8" : "#fff",
    }),
    singleValue: (base, state) => ({ ...base, color: state.isDisabled ? "#4a5568" : base.color }),
    option: (base, state) => ({
      ...base, fontSize: 13,
      background: state.isSelected ? "#667eea" : state.isFocused ? "#eef0ff" : "#fff",
      color: state.isSelected ? "#fff" : "#1f2a44",
    }),
    valueContainer: (base) => ({ ...base, padding: "0 10px" }),
    placeholder: (base) => ({ ...base, color: "#a0a8b8", fontSize: 13 }),
    menuPortal: (base) => ({ ...base, zIndex: 2000 }),
  };
  const sectionCard = { background: "#fff", borderRadius: 12, border: "1px solid #e8ebf7", padding: 20, marginBottom: 16 };
  const sectionTitle = (icon, text) => (
    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: 14, color: "#4b3f8f" }}>
      <i className={"bi " + icon} style={{ color: "#667eea" }}></i> {text}
    </h6>
  );
  const field = (label, required, node, cls = "col-12 col-md-6", hint = null) => (
    <div className={cls}>
      <div style={labelStyle}>{label}{required && <span className="text-danger"> *</span>}</div>
      {node}
      {hint && <div className="mt-1" style={{ fontSize: 11, color: "#8a9ab5" }}>{hint}</div>}
    </div>
  );
  const title = isEdit ? "Update Job" : "Post a Job";
  const categoryLocked = isEdit && applicantsCount > 0;

  return (
    <>
      <section className="section dashboard">
        <div className="mb-3">
          <nav className="d-flex align-items-center gap-1" style={{ fontSize: 12, color: "#8a9ab5" }}>
            <Link to="/" style={{ color: "#8a9ab5" }}><i className="bi bi-house-door"></i></Link>
            <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
            <Link to="/jobs/list" style={{ color: "#8a9ab5" }}>Jobs</Link>
            <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
            <span className="fw-semibold" style={{ color: "#4a5568" }}>{title}</span>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center gap-2 px-4 py-3"
            style={{ background: GRAD, color: "#fff", fontSize: 18, fontWeight: 600 }}>
            <i className="bi bi-briefcase"></i> {title}
          </div>
          <div className="card-body" style={{ padding: 24, background: "#f8f9fe" }}>

            <div style={sectionCard}>
              {sectionTitle("bi-briefcase", "Job Detail")}
              <div className="row g-3">
                {field("Job Title", true,
                  <input type="text" className="form-control" placeholder="e.g. TGT Mathematics" name="title"
                    value={job.title} onChange={handleChange} style={inputStyle} />
                )}
                {field("Job Category", true,
                  <Select
                    options={categoryOptions}
                    value={categoryOptions.find(o => o.value === job.job_category_id) || null}
                    onChange={(o) => setJob({ ...job, job_category_id: o ? o.value : null })}
                    placeholder="Select job category"
                    isDisabled={categoryLocked}
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />, "col-12 col-md-6", categoryLocked ? "Locked because people have already applied in this category." : null
                )}
                {field("Job Type", true,
                  <Select
                    options={JOB_TYPE_OPTIONS}
                    value={JOB_TYPE_OPTIONS.find(o => o.value === job.job_type) || null}
                    onChange={(o) => setJob({ ...job, job_type: o ? o.value : "" })}
                    placeholder="Select job type"
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />
                )}
                {field("Vacancies", true,
                  <input type="number" min="1" step="1" className="form-control" placeholder="e.g. 2" name="vacancies"
                    value={job.vacancies} onChange={handleChange} style={inputStyle} />, "col-6 col-md-3"
                )}
                {field("Status", false,
                  <Select
                    options={JOB_STATUS_OPTIONS}
                    value={JOB_STATUS_OPTIONS.find(o => o.value === job.status) || null}
                    onChange={(o) => setJob({ ...job, status: o ? o.value : "open" })}
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />, "col-6 col-md-3"
                )}
              </div>
            </div>

            <div style={sectionCard}>
              {sectionTitle("bi-mortarboard", "Eligibility")}
              <div className="row g-3">
                {field("Minimum Qualification", true,
                  <input type="text" className="form-control" placeholder="e.g. B.Sc + B.Ed" name="min_qualification"
                    value={job.min_qualification} onChange={handleChange} style={inputStyle} />
                )}
                {field("Minimum Experience (years)", true,
                  <input type="number" min="0" step="1" className="form-control" placeholder="e.g. 2 (0 for freshers)" name="min_experience"
                    value={job.min_experience} onChange={handleChange} style={inputStyle} />
                )}
              </div>
            </div>

            <div style={sectionCard}>
              {sectionTitle("bi-currency-rupee", "Salary per Month (INR)")}
              <div className="row g-3">
                {field("Minimum Salary", true,
                  <input type="number" min="0" step="500" className="form-control" placeholder="e.g. 25000" name="salary_min"
                    value={job.salary_min} onChange={handleChange} style={inputStyle} />
                )}
                {field("Maximum Salary", true,
                  <input type="number" min="0" step="500" className="form-control" placeholder="e.g. 35000" name="salary_max"
                    value={job.salary_max} onChange={handleChange} style={inputStyle} />
                )}
              </div>
            </div>

            <div style={sectionCard}>
              {sectionTitle("bi-geo-alt", "Location and Deadline")}
              <div className="row g-3">
                {field("State", true,
                  <Select
                    options={stateOptions}
                    value={stateOptions.find(o => o.value === job.state_id) || null}
                    onChange={handleStateChange}
                    placeholder="Select state"
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />, "col-12 col-md-4"
                )}
                {field("City", true,
                  <Select
                    options={cityOptions}
                    value={cityOptions.find(o => o.value === job.city_id) || null}
                    onChange={(o) => setJob({ ...job, city_id: o ? o.value : null })}
                    placeholder={job.state_id ? "Select city" : "Select a state first"}
                    isDisabled={!job.state_id}
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />, "col-12 col-md-4"
                )}
                {field("Last Date to Apply", true,
                  <DatePicker
                    value={job.last_date ? new Date(job.last_date + "T00:00:00") : ""}
                    onChange={(d) => setJob({ ...job, last_date: d ? d.format("YYYY-MM-DD") : "" })}
                    format="DD MMM YYYY"
                    minDate={new Date()}
                    onOpenPickNewDate={false}
                    portal
                    inputClass="form-control"
                    style={inputStyle}
                    placeholder="Select date"
                  />, "col-12 col-md-4"
                )}
              </div>
            </div>

            <div style={sectionCard}>
              {sectionTitle("bi-card-text", "Description")}
              <div className="row g-3">
                {field("Job Description", true,
                  <textarea className="form-control" rows={5} placeholder="e.g. Classes to teach, duties, timings and facilities offered" name="description"
                    value={job.description} onChange={handleChange} style={textareaStyle} />, "col-12"
                )}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <Link to="/jobs/list" className="btn px-4 d-flex align-items-center"
                style={{ background: "#fff", border: "1px solid #dfe3ec", borderRadius: 8, height: 40, fontSize: 13, color: "#444" }}>
                Back
              </Link>
              <button type="submit" className="btn px-4 text-white fw-semibold"
                style={{ background: GRAD, border: "none", borderRadius: 8, height: 40, fontSize: 13 }}>
                {isEdit ? "Update Job" : "Post Job"}
              </button>
            </div>

          </div>
        </form>
      </section>
    </>
  );
}

export default AddJob;
