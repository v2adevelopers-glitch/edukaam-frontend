import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import toast from 'react-hot-toast';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import AuthLayout from '../../layouts/AuthLayout';
import { authenticationService } from '../../services/authentication.service';
import { jobCategoriesService } from '../../services/job-categories.service';
import { institutionTypesService } from '../../services/institution-types.service';
import { USER_ROLES } from '../../config/siteConfig';
import { isStrongPassword, isValidEmail, isValidMobile } from '../../helper/validator';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';

const GRAD = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

const ROLE_CARDS = [
  { role: USER_ROLES.JOB_PROVIDER, icon: "bi-building", title: "I am hiring", text: "School, college, university or coaching institute" },
  { role: USER_ROLES.JOB_SEEKER, icon: "bi-person-workspace", title: "I am looking for a job", text: "Teaching, library, lab, office, transport or security roles" },
];

const initialSignup = {
  role_code: "",
  name: "",
  mobile: "",
  email: "",
  password: "",
  confirm_password: "",
  job_category_id: null,
  institution_type_id: null,
};

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signup, setSignup] = useState(initialSignup);
  const [showPassword, setShowPassword] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [institutionTypeOptions, setInstitutionTypeOptions] = useState([]);

  const isProvider = signup.role_code === USER_ROLES.JOB_PROVIDER;
  const isSeeker = signup.role_code === USER_ROLES.JOB_SEEKER;

  useEffect(() => {
    loadOptions();
  }, []);

  const showSwal = (title, text, icon) => {
    withReactContent(Swal).fire({ title, text, icon })
  }

  const loadOptions = async () => {
    try {
      const [catRes, typeRes] = await Promise.all([
        jobCategoriesService.list({ page: 1, status: "active" }),
        institutionTypesService.list({ page: 1, status: "active" }),
      ]);
      if (catRes?.success) {
        setCategoryOptions((catRes.resData?.data || []).map(c => ({ value: c?.id, label: c?.name })));
      } else {
        toast.error(catRes?.message);
      }
      if (typeRes?.success) {
        setInstitutionTypeOptions((typeRes.resData?.data || []).map(t => ({ value: t?.id, label: t?.name })));
      } else {
        toast.error(typeRes?.message);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    }
  }

  const handleChange = (e) => {
    setSignup({ ...signup, [e.target.name]: e.target.value });
  }

  const handleMobileChange = (e) => {
    setSignup({ ...signup, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) });
  }

  const handleRole = (role) => {
    setSignup({ ...signup, role_code: role, job_category_id: null, institution_type_id: null });
  }

  const validate = () => {
    if (!signup.role_code) return "Choose whether you are hiring or looking for a job";
    if (!signup.name.trim()) return isProvider ? "Institution name is required" : "Full name is required";
    if (isProvider && !signup.institution_type_id) return "Institution type is required";
    if (isSeeker && !signup.job_category_id) return "Job category is required";
    if (!isValidMobile(signup.mobile)) return "Enter a valid 10 digit mobile number";
    if (!isValidEmail(signup.email)) return "Enter a valid email address";
    if (!isStrongPassword(signup.password)) return "Password must be at least 8 characters with a letter and a number";
    if (signup.password !== signup.confirm_password) return "Passwords do not match";
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    try {
      setLoading(true);
      const res = await authenticationService.signup({
        role_code: signup.role_code,
        name: signup.name.trim(),
        mobile: signup.mobile,
        email: signup.email.trim().toLowerCase(),
        password: signup.password,
        ...(isProvider ? { institution_type_id: signup.institution_type_id } : { job_category_id: signup.job_category_id }),
      });
      if (res?.success) {
        await withReactContent(Swal).fire({ title: "Account created", text: res.message, icon: "success" });
        navigate("/login");
      } else {
        toast.error(res?.message);
      }
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "#6c757d", marginBottom: 6 };
  const inputStyle = { borderRadius: 8, border: "1px solid #dfe3ec", fontSize: 13, height: 40, background: "#fff" };
  const selectStyles = {
    control: (base, state) => ({
      ...base, borderRadius: 8, border: state.isFocused ? "1px solid #667eea" : "1px solid #dfe3ec", minHeight: 40,
      fontSize: 13, boxShadow: state.isFocused ? "0 0 0 3px rgba(102,126,234,.15)" : "none", "&:hover": { borderColor: "#667eea" }
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
  const field = (label, required, node, cls = "col-12 col-md-6") => (
    <div className={cls}>
      <div style={labelStyle}>{label}{required && <span className="text-danger"> *</span>}</div>
      {node}
    </div>
  );
  const roleCard = (selected) => ({
    cursor: "pointer", borderRadius: 12, padding: 16, height: "100%", textAlign: "left", width: "100%",
    border: selected ? "2px solid #667eea" : "1px solid #e8ebf7",
    background: selected ? "#eef0ff" : "#fff",
    boxShadow: selected ? "0 0 0 3px rgba(102,126,234,.15)" : "none",
  });

  return (
    <AuthLayout wide>
      <form onSubmit={handleSubmit} className="card border-0 shadow-sm overflow-hidden mb-0" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center gap-2 px-4 py-3"
          style={{ background: GRAD, color: "#fff", fontSize: 18, fontWeight: 600 }}>
          <i className="bi bi-person-plus"></i> Create your account
        </div>
        <div className="card-body" style={{ padding: 24, background: "#f8f9fe" }}>

          <div style={sectionCard}>
            {sectionTitle("bi-ui-radios-grid", "Who are you?")}
            <div className="row g-3" role="radiogroup" aria-label="Account type">
              {ROLE_CARDS.map((c) => {
                const selected = signup.role_code === c.role;
                return (
                  <div className="col-12 col-md-6" key={c.role}>
                    <button type="button" role="radio" aria-checked={selected} onClick={() => handleRole(c.role)} style={roleCard(selected)}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: 44, height: 44, flexShrink: 0, background: selected ? GRAD : "#f1f3fb", color: selected ? "#fff" : "#667eea" }}>
                          <i className={"bi " + c.icon} style={{ fontSize: 20 }}></i>
                        </div>
                        <div>
                          <div className="fw-bold" style={{ fontSize: 14, color: "#1a202c" }}>{c.title}</div>
                          <div style={{ fontSize: 12, color: "#6c757d" }}>{c.text}</div>
                        </div>
                        {selected && <i className="bi bi-check-circle-fill ms-auto" style={{ color: "#667eea", fontSize: 18 }}></i>}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {signup.role_code && (
            <>
              <div style={sectionCard}>
                {sectionTitle(isProvider ? "bi-building" : "bi-person-lines-fill", isProvider ? "Institution Detail" : "Your Detail")}
                <div className="row g-3">
                  {field(isProvider ? "Institution Name" : "Full Name", true,
                    <input type="text" className="form-control" name="name" placeholder={isProvider ? "e.g. Green Valley Public School" : "e.g. Anjali Mishra"}
                      value={signup.name} onChange={handleChange} style={inputStyle} />
                  )}
                  {isProvider && field("Institution Type", true,
                    <Select
                      options={institutionTypeOptions}
                      value={institutionTypeOptions.find(o => o.value === signup.institution_type_id) || null}
                      onChange={(o) => setSignup({ ...signup, institution_type_id: o ? o.value : null })}
                      placeholder="Select institution type"
                      menuPortalTarget={document.body}
                      styles={selectStyles}
                    />
                  )}
                  {isSeeker && field("Job Category", true,
                    <Select
                      options={categoryOptions}
                      value={categoryOptions.find(o => o.value === signup.job_category_id) || null}
                      onChange={(o) => setSignup({ ...signup, job_category_id: o ? o.value : null })}
                      placeholder="Select the job you are looking for"
                      menuPortalTarget={document.body}
                      styles={selectStyles}
                    />
                  )}
                  {field("Mobile", true,
                    <input type="text" inputMode="numeric" className="form-control" name="mobile" placeholder="10 digit mobile number"
                      value={signup.mobile} onChange={handleMobileChange} style={inputStyle} />
                  )}
                  {field("Email", true,
                    <input type="email" className="form-control" name="email" placeholder="name@example.com" autoComplete="username"
                      value={signup.email} onChange={handleChange} style={inputStyle} />
                  )}
                </div>
              </div>

              <div style={sectionCard}>
                {sectionTitle("bi-shield-lock", "Password")}
                <div className="row g-3">
                  {field("Password", true,
                    <div className="position-relative">
                      <input type={showPassword ? "text" : "password"} className="form-control" name="password" autoComplete="new-password"
                        placeholder="At least 8 characters with a number" value={signup.password} onChange={handleChange}
                        style={{ ...inputStyle, paddingRight: 40 }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}
                        className="btn btn-sm position-absolute top-50 translate-middle-y end-0 me-1 border-0" style={{ color: "#8a9ab5" }}>
                        <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                      </button>
                    </div>
                  )}
                  {field("Confirm Password", true,
                    <input type={showPassword ? "text" : "password"} className="form-control" name="confirm_password" autoComplete="new-password"
                      placeholder="Type the password again" value={signup.confirm_password} onChange={handleChange} style={inputStyle} />
                  )}
                </div>
              </div>
            </>
          )}

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div style={{ fontSize: 13, color: "#6c757d" }}>
              Already have an account? <Link to="/login" className="fw-semibold">Log in</Link>
            </div>
            <button type="submit" disabled={loading || !signup.role_code} className="btn px-4 text-white fw-semibold d-flex align-items-center gap-2"
              style={{ background: GRAD, border: "none", borderRadius: 8, height: 40, fontSize: 13 }}>
              {loading && <span className="spinner-border spinner-border-sm"></span>}
              Create Account
            </button>
          </div>

        </div>
      </form>
    </AuthLayout>
  )
}

export default Signup
