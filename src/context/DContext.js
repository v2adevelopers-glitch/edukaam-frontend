import React, { useReducer, useEffect } from "react";
import { authReducer, initialAuthState } from "./reducers/AuthReducer";
import { commonReducer, initialCommonState } from "./reducers/CommonReducer";
import { authenticationService } from "../services/authentication.service";
import { authStorageService } from "../services/auth-storage.service";

export const DContext = React.createContext();

export const DProvider = (props) => {
  const [authState, authDispatch] = useReducer(authReducer, initialAuthState);
  const [commonState, commonDispatch] = useReducer(commonReducer, initialCommonState);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    if (!authStorageService.getToken()) {
      authDispatch({ type: "LOGOUT" });
      return;
    }
    const res = await authenticationService.verifyToken();
    if (res?.success) {
      authDispatch({ type: "USER_LOADED", payload: res.resData.user_info });
      authDispatch({ type: "PROFILE_LOADED", payload: res.resData.profile_res });
      authDispatch({ type: "MENU_LOADED", payload: res.resData.menu_access });
      authDispatch({ type: "USER_ROLE_LOADED", payload: res.resData.role_info });
    } else {
      // apiClient already cleared the token on 401; a network error keeps it so a refresh keeps the session
      authDispatch({ type: "LOGOUT" });
    }
  };

  return (
    <DContext.Provider value={{ authState, authDispatch, commonState, commonDispatch }}>
      {props.children}
    </DContext.Provider>
  );
};

export default DContext;
