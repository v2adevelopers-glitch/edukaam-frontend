import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import AuthLayout from '../../layouts/AuthLayout';
import { DContext } from '../../context/DContext';
import { authenticationService } from '../../services/authentication.service';
import { authStorageService } from '../../services/auth-storage.service';
import { isValidEmail } from '../../helper/validator';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';

const GRAD = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

const initialLogin = {
  email: "",
  password: "",
};

const Login = () => {
  const { authDispatch } = useContext(DContext);
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState(initialLogin);
  const [showPassword, setShowPassword] = useState(false);

  const showSwal = (title, text, icon) => {
    withReactContent(Swal).fire({ title, text, icon })
  }

  const handleChange = (e) => {
    setLogin({ ...login, [e.target.name]: e.target.value });
  }

  const validate = () => {
    if (!login.email.trim()) return "Email is required";
    if (!isValidEmail(login.email)) return "Enter a valid email address";
    if (!login.password) return "Password is required";
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
      const res = await authenticationService.login({ email: login.email.trim(), password: login.password });
      if (!res?.success) {
        toast.error(res?.message);
        return;
      }
      const roleCode = res.resData?.role_info?.role_code;
      const menuRes = await authenticationService.getMenuAccess(roleCode);
      if (!menuRes?.success) {
        authStorageService.clearAuthentication();
        toast.error(menuRes?.message);
        return;
      }
      toast.success(res.message);
      authDispatch({ type: "LOGIN", payload: res.resData?.user_info });
      authDispatch({ type: "PROFILE_LOADED", payload: res.resData?.profile_res });
      authDispatch({ type: "MENU_LOADED", payload: menuRes.resData });
      authDispatch({ type: "USER_ROLE_LOADED", payload: res.resData?.role_info });
    } catch (err) {
      showSwal("Error", SOMETHING_WENT_WRONG, "error")
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "#6c757d", marginBottom: 6 };
  const inputStyle = { borderRadius: 8, border: "1px solid #dfe3ec", fontSize: 13, height: 40, background: "#fff" };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="card border-0 shadow-sm overflow-hidden mb-0" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center gap-2 px-4 py-3"
          style={{ background: GRAD, color: "#fff", fontSize: 18, fontWeight: 600 }}>
          <i className="bi bi-box-arrow-in-right"></i> Log in to your account
        </div>
        <div className="card-body" style={{ padding: 24, background: "#f8f9fe" }}>
          <div className="mb-3">
            <div style={labelStyle}>Email<span className="text-danger"> *</span></div>
            <input type="email" className="form-control" name="email" placeholder="name@example.com" autoComplete="username"
              value={login.email} onChange={handleChange} style={inputStyle} />
          </div>
          <div className="mb-4">
            <div style={labelStyle}>Password<span className="text-danger"> *</span></div>
            <div className="position-relative">
              <input type={showPassword ? "text" : "password"} className="form-control" name="password" placeholder="Your password"
                autoComplete="current-password" value={login.password} onChange={handleChange} style={{ ...inputStyle, paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}
                className="btn btn-sm position-absolute top-50 translate-middle-y end-0 me-1 border-0" style={{ color: "#8a9ab5" }}>
                <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn w-100 text-white fw-semibold d-flex align-items-center justify-content-center gap-2"
            style={{ background: GRAD, border: "none", borderRadius: 8, height: 40, fontSize: 13 }}>
            {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-box-arrow-in-right"></i>}
            Log In
          </button>
          <div className="text-center mt-3" style={{ fontSize: 13, color: "#6c757d" }}>
            New to EduJobs? <Link to="/signup" className="fw-semibold">Create an account</Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}

export default Login
