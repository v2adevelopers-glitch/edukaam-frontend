export const initialAuthState = {
  isLoggedIn: false,
  authLoading: true,
  user: null,
  user_role: null,
  menu_access: null,
  userProfile: null,
  authError: null,
};

export const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload, isLoggedIn: true, authLoading: false };
    case "USER_LOADED":
      return { ...state, user: action.payload, isLoggedIn: true, authLoading: false };
    case "PROFILE_LOADED":
      return { ...state, userProfile: action.payload };
    case "MENU_LOADED":
      return { ...state, menu_access: action.payload };
    case "USER_ROLE_LOADED":
      return { ...state, user_role: action.payload };
    case "LOGOUT":
      return { ...state, isLoggedIn: false, authLoading: false, user: null };
    case "AUTH_ERROR":
      return { ...state, isLoggedIn: false, authLoading: false, user: null, authError: action.payload };
    default:
      return state;
  }
};
