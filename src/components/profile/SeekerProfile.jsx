import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-multi-date-picker';
import toast from 'react-hot-toast';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import ContentLoader from '../loader/ContentLoader';
import DetailView from '../common/DetailView';
import PageTitleAndSnackBar from '../common/PageTitleAndSnackBar';
import { DContext } from '../../context/DContext';
import { seekerProfileService } from '../../services/seeker-profile.service';
import { jobCategoriesService } from '../../services/job-categories.service';
import { statesService } from '../../services/states.service';
import { citiesService } from '../../services/cities.service';
import { authStorageService } from '../../services/auth-storage.service';
import { GENDER_OPTIONS, optionLabel } from '../../constants/options';
import { ageFromDob, formatDate, todayYmd } from '../../helper/dateHelper';
import { experienceText, formatINR, formatLocation, initials } from '../../helper/stringMethods';
import { isValidMobile } from '../../helper/validator';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';

const GRAD = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

const initialProfile = {
  full_name: "",
  mobile: "",
  email: "",
  gender: "",
  dob: "",
  job_category_id: null,
  highest_qualification: "",
  experience_years: "",
  skills: "",
  expected_salary: "",
  state_id: null,
  city_id: null,
  about: "",
};

// mode: "view" | "edit"
const SeekerProfile = ({ mode }) => {
  const navigate = useNavigate();
  const { authDispatch } = useContext(DContext);
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(false);
  const [profileRes, setProfileRes] = useState(null);
  const [profile, setProfile] = useState(initialProfile);
  const [originalCategoryId, setOriginalCategoryId] = useState(null);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  useEffect(() => {
    if (isEdit) loadEditForm();
    else loadProfile();
  }, [mode]);

  const showSwal = (title, text, icon) => {
    withReactContent(Swal).fire({ title, text, icon })
  }

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await seekerProfileService.details();
      if (res?.success) {
        setProfileRes(res.resData?.data ?? res.resData);
      } else {
        toast.error(res?.message);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    } finally {
      setLoading(false);
    }
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

  // parent options first, then the record, then the dependent city list
  const loadEditForm = async () => {
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

      const res = await seekerProfileService.details();
      if (res?.success) {
        const v = res.resData?.data ?? res.resData;
        setProfile({
          full_name: v?.full_name || "",
          mobile: v?.mobile || "",
          email: v?.email || "",
          gender: v?.gender || "",
          dob: v?.dob || "",
          job_category_id: v?.job_category_id || null,
          highest_qualification: v?.highest_qualification || "",
          experience_years: v?.experience_years !== null && v?.experience_years !== undefined ? String(v.experience_years) : "",
          skills: v?.skills || "",
          expected_salary: v?.expected_salary !== null && v?.expected_salary !== undefined ? String(v.expected_salary) : "",
          state_id: v?.state_id || null,
          city_id: v?.city_id || null,
          about: v?.about || "",
        });
        setOriginalCategoryId(v?.job_category_id || null);
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
    setProfile({ ...profile, [e.target.name]: e.target.value });
  }

  const handleMobileChange = (e) => {
    setProfile({ ...profile, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) });
  }

  const handleStateChange = (o) => {
    setProfile({ ...profile, state_id: o ? o.value : null, city_id: null });
    setCityOptions([]);
    if (o) loadCities(o.value);
  }

  const validate = () => {
    if (!profile.full_name.trim()) return "Full name is required";
    if (!isValidMobile(profile.mobile)) return "Enter a valid 10 digit mobile number";
    if (!profile.gender) return "Gender is required";
    if (!profile.dob) return "Date of birth is required";
    if (profile.dob >= todayYmd()) return "Date of birth must be in the past";
    if (!profile.job_category_id) return "Primary job category is required";
    if (!profile.highest_qualification.trim()) return "Highest qualification is required";
    if (profile.experience_years === "" || Number(profile.experience_years) < 0) return "Experience is required";
    if (profile.expected_salary !== "" && Number(profile.expected_salary) < 0) return "Expected salary cannot be negative";
    if (!profile.state_id) return "State is required";
    if (!profile.city_id) return "City is required";
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const categoryChanged = originalCategoryId && profile.job_category_id !== originalCategoryId;
    const confirm = await withReactContent(Swal).fire({
      title: "Update profile?",
      text: categoryChanged ? "You changed your primary job category. Find Jobs will show jobs of the new category." : undefined,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update",
      cancelButtonText: "Cancel"
    });
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      const { email, ...rest } = profile;
      const res = await seekerProfileService.update({
        ...rest,
        experience_years: Number(profile.experience_years),
        expected_salary: profile.expected_salary === "" ? null : Number(profile.expected_salary),
      });
      if (res?.success) {
        authDispatch({ type: "PROFILE_LOADED", payload: res.resData?.data });
        authDispatch({ type: "USER_LOADED", payload: authStorageService.getUser() });
        await withReactContent(Swal).fire({ title: "Success", text: res.message, icon: "success" });
        navigate("/profile/view");
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

  /* ---------- view ---------- */
  if (!isEdit) {
    const p = profileRes;
    const incomplete = p && (!p.gender || !p.dob || !p.highest_qualification || !p.city_id);
    const age = ageFromDob(p?.dob);
    return (
      <section className="section dashboard">
        <PageTitleAndSnackBar title="My Profile" crumbs={[{ label: "My Profile" }]}>
          <Link to="/profile/edit" className="btn btn-sm d-flex align-items-center gap-1 text-white px-3" style={{ background: "#4f3df5", borderRadius: 8, height: 34, fontSize: 13, fontWeight: 600 }}>
            <i className="bi bi-pencil-fill"></i> Edit Profile
          </Link>
        </PageTitleAndSnackBar>

        {incomplete && (
          <div className="d-flex align-items-center gap-2 mb-3 px-3 py-2 flex-wrap" style={{ borderRadius: 10, background: "#fff4e6", border: "1px solid #ffd8a8", color: "#e8590c", fontSize: 13 }}>
            <i className="bi bi-info-circle-fill"></i>
            Your profile is incomplete. Institutions see it when you apply, so add your qualification, experience and location.
            <Link to="/profile/edit" className="fw-semibold ms-auto" style={{ color: "#e8590c" }}>Complete now</Link>
          </div>
        )}

        {p && (
          <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 14 }}>
            <div className="d-flex align-items-center gap-3 px-4 py-3 flex-wrap" style={{ background: GRAD, color: "#fff" }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{ width: 56, height: 56, background: "rgba(255,255,255,.2)", fontSize: 20, flexShrink: 0 }}>
                {initials(p?.full_name) || <i className="bi bi-person"></i>}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{p?.full_name}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>
                  {[p?.job_category_name, formatLocation(p?.city_name, p?.state_name)].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span className="ms-auto" style={{ fontSize: 12, background: "rgba(255,255,255,.2)", padding: "4px 10px", borderRadius: 12 }}>{p?.seeker_code}</span>
            </div>
            <div className="card-body" style={{ padding: 24, background: "#f8f9fe" }}>
              <DetailView fields={[
                { label: "Full Name", value: p?.full_name },
                { label: "Gender", value: optionLabel(GENDER_OPTIONS, p?.gender) },
                { label: "Mobile", value: p?.mobile ? <a href={`tel:${p.mobile}`}>{p.mobile}</a> : "" },
                { label: "Email", value: p?.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : "" },
                { label: "Date of Birth", value: p?.dob ? `${formatDate(p.dob)}${age !== null ? ` (${age} years)` : ""}` : "" },
                { label: "Primary Job Category", value: p?.job_category_name },
                { label: "Highest Qualification", value: p?.highest_qualification },
                { label: "Experience", value: experienceText(p?.experience_years) },
                { label: "Expected Salary", value: p?.expected_salary ? `${formatINR(p.expected_salary)} / month` : "" },
                { label: "Location", value: formatLocation(p?.city_name, p?.state_name) },
                { label: "Skills", value: p?.skills, full: true },
                { label: "About", value: p?.about, full: true },
                { label: "Last Updated", value: formatDate(p?.updated_at) },
              ]} />
            </div>
          </div>
        )}
      </section>
    );
  }

  /* ---------- edit ---------- */
  const labelStyle = { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "#6c757d", marginBottom: 6 };
  const inputStyle = { borderRadius: 8, border: "1px solid #dfe3ec", fontSize: 13, height: 40, background: "#fff" };
  const readOnlyStyle = { ...inputStyle, background: "#eef0f8", color: "#4a5568" };
  const textareaStyle = { ...inputStyle, height: "auto" };
  const selectStyles = {
    control: (base, state) => ({
      ...base, borderRadius: 8, border: state.isFocused ? "1px solid #667eea" : "1px solid #dfe3ec", minHeight: 40,
      fontSize: 13, boxShadow: state.isFocused ? "0 0 0 3px rgba(102,126,234,.15)" : "none", "&:hover": { borderColor: "#667eea" },
      background: state.isDisabled ? "#eef0f8" : "#fff",
    }),
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
  const title = "Update Profile";

  return (
    <>
      <section className="section dashboard">
        <div className="mb-3">
          <nav className="d-flex align-items-center gap-1" style={{ fontSize: 12, color: "#8a9ab5" }}>
            <Link to="/" style={{ color: "#8a9ab5" }}><i className="bi bi-house-door"></i></Link>
            <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
            <Link to="/profile/view" style={{ color: "#8a9ab5" }}>My Profile</Link>
            <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
            <span className="fw-semibold" style={{ color: "#4a5568" }}>{title}</span>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center gap-2 px-4 py-3"
            style={{ background: GRAD, color: "#fff", fontSize: 18, fontWeight: 600 }}>
            <i className="bi bi-person"></i> {title}
          </div>
          <div className="card-body" style={{ padding: 24, background: "#f8f9fe" }}>

            <div style={sectionCard}>
              {sectionTitle("bi-person-lines-fill", "Personal Detail")}
              <div className="row g-3">
                {field("Full Name", true,
                  <input type="text" className="form-control" placeholder="e.g. Anjali Mishra" name="full_name"
                    value={profile.full_name} onChange={handleChange} style={inputStyle} />
                )}
                {field("Gender", true,
                  <Select
                    options={GENDER_OPTIONS}
                    value={GENDER_OPTIONS.find(o => o.value === profile.gender) || null}
                    onChange={(o) => setProfile({ ...profile, gender: o ? o.value : "" })}
                    placeholder="Select gender"
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />, "col-6 col-md-3"
                )}
                {field("Date of Birth", true,
                  <DatePicker
                    value={profile.dob ? new Date(profile.dob + "T00:00:00") : ""}
                    onChange={(d) => setProfile({ ...profile, dob: d ? d.format("YYYY-MM-DD") : "" })}
                    format="DD MMM YYYY"
                    maxDate={new Date()}
                    onOpenPickNewDate={false}
                    portal
                    inputClass="form-control"
                    style={inputStyle}
                    placeholder="Select date"
                  />, "col-6 col-md-3"
                )}
                {field("Mobile", true,
                  <input type="text" inputMode="numeric" className="form-control" placeholder="10 digit mobile number" name="mobile"
                    value={profile.mobile} onChange={handleMobileChange} style={inputStyle} />
                )}
                {field("Email", true,
                  <input type="email" className="form-control" name="email" title="Your login email cannot be changed"
                    value={profile.email} readOnly style={readOnlyStyle} />
                )}
              </div>
            </div>

            <div style={sectionCard}>
              {sectionTitle("bi-briefcase", "Work Detail")}
              <div className="row g-3">
                {field("Primary Job Category", true,
                  <Select
                    options={categoryOptions}
                    value={categoryOptions.find(o => o.value === profile.job_category_id) || null}
                    onChange={(o) => setProfile({ ...profile, job_category_id: o ? o.value : null })}
                    placeholder="Select job category"
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />, "col-12 col-md-6", "Find Jobs shows open jobs in this category."
                )}
                {field("Highest Qualification", true,
                  <input type="text" className="form-control" placeholder="e.g. M.Sc Mathematics + B.Ed" name="highest_qualification"
                    value={profile.highest_qualification} onChange={handleChange} style={inputStyle} />
                )}
                {field("Experience (years)", true,
                  <input type="number" min="0" step="1" className="form-control" placeholder="e.g. 3 (0 if fresher)" name="experience_years"
                    value={profile.experience_years} onChange={handleChange} style={inputStyle} />
                )}
                {field("Expected Monthly Salary (INR)", false,
                  <input type="number" min="0" step="500" className="form-control" placeholder="e.g. 30000" name="expected_salary"
                    value={profile.expected_salary} onChange={handleChange} style={inputStyle} />
                )}
                {field("Skills", false,
                  <input type="text" className="form-control" placeholder="e.g. Mathematics, Smart class tools, Olympiad coaching" name="skills"
                    value={profile.skills} onChange={handleChange} style={inputStyle} />, "col-12", "Separate skills with commas."
                )}
              </div>
            </div>

            <div style={sectionCard}>
              {sectionTitle("bi-geo-alt", "Location")}
              <div className="row g-3">
                {field("State", true,
                  <Select
                    options={stateOptions}
                    value={stateOptions.find(o => o.value === profile.state_id) || null}
                    onChange={handleStateChange}
                    placeholder="Select state"
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />
                )}
                {field("City", true,
                  <Select
                    options={cityOptions}
                    value={cityOptions.find(o => o.value === profile.city_id) || null}
                    onChange={(o) => setProfile({ ...profile, city_id: o ? o.value : null })}
                    placeholder={profile.state_id ? "Select city" : "Select a state first"}
                    isDisabled={!profile.state_id}
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />
                )}
              </div>
            </div>

            <div style={sectionCard}>
              {sectionTitle("bi-card-text", "About")}
              <div className="row g-3">
                {field("About You", false,
                  <textarea className="form-control" rows={4} placeholder="e.g. Classes or roles you have handled, achievements, preferred shift" name="about"
                    value={profile.about} onChange={handleChange} style={textareaStyle} />, "col-12"
                )}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <Link to="/profile/view" className="btn px-4 d-flex align-items-center"
                style={{ background: "#fff", border: "1px solid #dfe3ec", borderRadius: 8, height: 40, fontSize: 13, color: "#444" }}>
                Back
              </Link>
              <button type="submit" className="btn px-4 text-white fw-semibold"
                style={{ background: GRAD, border: "none", borderRadius: 8, height: 40, fontSize: 13 }}>
                Update Profile
              </button>
            </div>

          </div>
        </form>
      </section>
    </>
  );
}

export default SeekerProfile;
