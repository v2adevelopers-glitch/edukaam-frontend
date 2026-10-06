import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import toast from 'react-hot-toast';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import ContentLoader from '../loader/ContentLoader';
import DetailView from '../common/DetailView';
import PageTitleAndSnackBar from '../common/PageTitleAndSnackBar';
import { DContext } from '../../context/DContext';
import { providerProfileService } from '../../services/provider-profile.service';
import { institutionTypesService } from '../../services/institution-types.service';
import { statesService } from '../../services/states.service';
import { citiesService } from '../../services/cities.service';
import { authStorageService } from '../../services/auth-storage.service';
import { formatDate } from '../../helper/dateHelper';
import { formatLocation, initials } from '../../helper/stringMethods';
import { isValidMobile, isValidPincode, isValidUrl, isValidYear } from '../../helper/validator';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';

const GRAD = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

const initialProfile = {
  institution_name: "",
  institution_type_id: null,
  contact_person: "",
  designation: "",
  mobile: "",
  email: "",
  established_year: "",
  website: "",
  about: "",
  address: "",
  state_id: null,
  city_id: null,
  pincode: "",
};

// mode: "view" | "edit"
const ProviderProfile = ({ mode }) => {
  const navigate = useNavigate();
  const { authDispatch } = useContext(DContext);
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(false);
  const [profileRes, setProfileRes] = useState(null);
  const [profile, setProfile] = useState(initialProfile);

  const [institutionTypeOptions, setInstitutionTypeOptions] = useState([]);
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
      const res = await providerProfileService.details();
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
      const [typeRes, stateRes] = await Promise.all([
        institutionTypesService.list({ page: 1, status: "active" }),
        statesService.list({ page: 1, status: "active" }),
      ]);
      if (typeRes?.success) setInstitutionTypeOptions((typeRes.resData?.data || []).map(t => ({ value: t?.id, label: t?.name })));
      else toast.error(typeRes?.message);
      if (stateRes?.success) setStateOptions((stateRes.resData?.data || []).map(s => ({ value: s?.id, label: s?.name })));
      else toast.error(stateRes?.message);

      const res = await providerProfileService.details();
      if (res?.success) {
        const v = res.resData?.data ?? res.resData;
        setProfile({
          institution_name: v?.institution_name || "",
          institution_type_id: v?.institution_type_id || null,
          contact_person: v?.contact_person || "",
          designation: v?.designation || "",
          mobile: v?.mobile || "",
          email: v?.email || "",
          established_year: v?.established_year ? String(v.established_year) : "",
          website: v?.website || "",
          about: v?.about || "",
          address: v?.address || "",
          state_id: v?.state_id || null,
          city_id: v?.city_id || null,
          pincode: v?.pincode || "",
        });
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

  const handlePincodeChange = (e) => {
    setProfile({ ...profile, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) });
  }

  const handleStateChange = (o) => {
    setProfile({ ...profile, state_id: o ? o.value : null, city_id: null });
    setCityOptions([]);
    if (o) loadCities(o.value);
  }

  const validate = () => {
    if (!profile.institution_name.trim()) return "Institution name is required";
    if (!profile.institution_type_id) return "Institution type is required";
    if (!profile.contact_person.trim()) return "Contact person is required";
    if (!isValidMobile(profile.mobile)) return "Enter a valid 10 digit mobile number";
    if (profile.established_year && !isValidYear(profile.established_year)) return "Enter a valid established year";
    if (!isValidUrl(profile.website)) return "Enter a valid website address starting with http:// or https://";
    if (!profile.address.trim()) return "Address is required";
    if (!profile.state_id) return "State is required";
    if (!profile.city_id) return "City is required";
    if (!isValidPincode(profile.pincode)) return "Enter a valid 6 digit pincode";
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
      title: "Update institution profile?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update",
      cancelButtonText: "Cancel"
    });
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      const { email, ...rest } = profile;
      const res = await providerProfileService.update({
        ...rest,
        established_year: profile.established_year ? Number(profile.established_year) : null,
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
    const incomplete = p && (!p.contact_person || !p.address || !p.city_id || !p.pincode);
    return (
      <section className="section dashboard">
        <PageTitleAndSnackBar title="Institution Profile" crumbs={[{ label: "Institution Profile" }]}>
          <Link to="/profile/edit" className="btn btn-sm d-flex align-items-center gap-1 text-white px-3" style={{ background: "#4f3df5", borderRadius: 8, height: 34, fontSize: 13, fontWeight: 600 }}>
            <i className="bi bi-pencil-fill"></i> Edit Profile
          </Link>
        </PageTitleAndSnackBar>

        {incomplete && (
          <div className="d-flex align-items-center gap-2 mb-3 px-3 py-2" style={{ borderRadius: 10, background: "#fff4e6", border: "1px solid #ffd8a8", color: "#e8590c", fontSize: 13 }}>
            <i className="bi bi-info-circle-fill"></i>
            Your profile is incomplete. Add the contact person and address so job seekers know who is hiring.
            <Link to="/profile/edit" className="fw-semibold ms-auto" style={{ color: "#e8590c" }}>Complete now</Link>
          </div>
        )}

        {p && (
          <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 14 }}>
            <div className="d-flex align-items-center gap-3 px-4 py-3 flex-wrap" style={{ background: GRAD, color: "#fff" }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{ width: 56, height: 56, background: "rgba(255,255,255,.2)", fontSize: 20, flexShrink: 0 }}>
                {initials(p?.institution_name) || <i className="bi bi-building"></i>}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{p?.institution_name}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>
                  {[p?.institution_type_name, formatLocation(p?.city_name, p?.state_name)].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span className="ms-auto" style={{ fontSize: 12, background: "rgba(255,255,255,.2)", padding: "4px 10px", borderRadius: 12 }}>{p?.provider_code}</span>
            </div>
            <div className="card-body" style={{ padding: 24, background: "#f8f9fe" }}>
              <DetailView fields={[
                { label: "Institution Name", value: p?.institution_name },
                { label: "Institution Type", value: p?.institution_type_name },
                { label: "Contact Person", value: p?.contact_person },
                { label: "Designation", value: p?.designation },
                { label: "Mobile", value: p?.mobile ? <a href={`tel:${p.mobile}`}>{p.mobile}</a> : "" },
                { label: "Email", value: p?.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : "" },
                { label: "Established Year", value: p?.established_year },
                { label: "Website", value: p?.website ? <a href={p.website} target="_blank" rel="noopener noreferrer">{p.website}</a> : "" },
                { label: "Address", value: p?.address, full: true },
                { label: "City", value: p?.city_name },
                { label: "State", value: p?.state_name },
                { label: "Pincode", value: p?.pincode },
                { label: "Last Updated", value: formatDate(p?.updated_at) },
                { label: "About", value: p?.about, full: true },
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
  const field = (label, required, node, cls = "col-12 col-md-6") => (
    <div className={cls}>
      <div style={labelStyle}>{label}{required && <span className="text-danger"> *</span>}</div>
      {node}
    </div>
  );
  const title = "Update Institution Profile";

  return (
    <>
      <section className="section dashboard">
        <div className="mb-3">
          <nav className="d-flex align-items-center gap-1" style={{ fontSize: 12, color: "#8a9ab5" }}>
            <Link to="/" style={{ color: "#8a9ab5" }}><i className="bi bi-house-door"></i></Link>
            <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
            <Link to="/profile/view" style={{ color: "#8a9ab5" }}>Institution Profile</Link>
            <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
            <span className="fw-semibold" style={{ color: "#4a5568" }}>{title}</span>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center gap-2 px-4 py-3"
            style={{ background: GRAD, color: "#fff", fontSize: 18, fontWeight: 600 }}>
            <i className="bi bi-building"></i> {title}
          </div>
          <div className="card-body" style={{ padding: 24, background: "#f8f9fe" }}>

            <div style={sectionCard}>
              {sectionTitle("bi-building", "Institution Detail")}
              <div className="row g-3">
                {field("Institution Name", true,
                  <input type="text" className="form-control" placeholder="e.g. Green Valley Public School" name="institution_name"
                    value={profile.institution_name} onChange={handleChange} style={inputStyle} />
                )}
                {field("Institution Type", true,
                  <Select
                    options={institutionTypeOptions}
                    value={institutionTypeOptions.find(o => o.value === profile.institution_type_id) || null}
                    onChange={(o) => setProfile({ ...profile, institution_type_id: o ? o.value : null })}
                    placeholder="Select institution type"
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />
                )}
                {field("Established Year", false,
                  <input type="number" min="1800" max={new Date().getFullYear()} className="form-control" placeholder="e.g. 1998" name="established_year"
                    value={profile.established_year} onChange={handleChange} style={inputStyle} />
                )}
                {field("Website", false,
                  <input type="url" className="form-control" placeholder="e.g. https://www.yourschool.in" name="website"
                    value={profile.website} onChange={handleChange} style={inputStyle} />
                )}
                {field("About", false,
                  <textarea className="form-control" rows={4} placeholder="e.g. Board, classes or courses offered, campus facilities" name="about"
                    value={profile.about} onChange={handleChange} style={textareaStyle} />, "col-12"
                )}
              </div>
            </div>

            <div style={sectionCard}>
              {sectionTitle("bi-person-lines-fill", "Contact Person")}
              <div className="row g-3">
                {field("Contact Person", true,
                  <input type="text" className="form-control" placeholder="e.g. Rekha Saxena" name="contact_person"
                    value={profile.contact_person} onChange={handleChange} style={inputStyle} />
                )}
                {field("Designation", false,
                  <input type="text" className="form-control" placeholder="e.g. Principal, HR Manager" name="designation"
                    value={profile.designation} onChange={handleChange} style={inputStyle} />
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
              {sectionTitle("bi-geo-alt", "Address")}
              <div className="row g-3">
                {field("Address", true,
                  <input type="text" className="form-control" placeholder="e.g. Plot 4, Sector 18" name="address"
                    value={profile.address} onChange={handleChange} style={inputStyle} />, "col-12"
                )}
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
                {field("Pincode", true,
                  <input type="text" inputMode="numeric" className="form-control" placeholder="6 digit pincode" name="pincode"
                    value={profile.pincode} onChange={handlePincodeChange} style={inputStyle} />
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

export default ProviderProfile;
