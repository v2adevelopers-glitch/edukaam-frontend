import React, { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { DContext } from "../context/DContext";

// "/jobs/list" -> "jobs", "/" -> ""
export const moduleOf = (path) => String(path ?? "").split("/").filter(Boolean)[0] || "";

// A module is accessible when the role's menu_access lists at least one path inside it.
export const canAccessModule = (menuAccess, module) =>
  Array.isArray(menuAccess) && menuAccess.some((item) => moduleOf(item?.path) === module);

export const useModuleAccess = (module) => {
  const { authState } = useContext(DContext);
  return canAccessModule(authState?.menu_access, module);
};

// Rendered by thin pages when the role has no access (or the method does not exist): back to home.
export const NoAccessRedirect = () => {
  useEffect(() => {
    toast.error("You do not have access to that page.", { id: "no-access" });
  }, []);
  return <Navigate to="/" replace />;
};
