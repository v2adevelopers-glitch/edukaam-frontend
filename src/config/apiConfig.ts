export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || ""; // already includes the version prefix, e.g. https://api.example.com/api/v1

// true = every service answers from the in-browser demo store in src/demo instead of calling the backend
export const USE_DEMO_DATA = process.env.REACT_APP_USE_DEMO_DATA === "true";

const crud = (base: string) => ({
  list: (qs: string) => `${base}${qs ? `?${qs}` : ""}`,
  details: (id: number | string) => `${base}/${id}`,
  create: base,
  update: (id: number | string) => `${base}/${id}`,
  delete: (id: number | string) => `${base}/${id}`,
});

const lookup = (base: string) => ({
  list: (qs: string) => `${base}${qs ? `?${qs}` : ""}`,
  details: (id: number | string) => `${base}/${id}`,
});

export const API_ENDPOINTS = {
  authentication: {
    login: "/auth/login",
    signup: "/auth/signup",
    verifyToken: "/auth/verify-token",
    menuAccess: (roleCode: string) => `/rbac/menu-access/${roleCode}`,
  },
  jobCategories: lookup("/job-categories"),
  institutionTypes: lookup("/institution-types"),
  states: lookup("/states"),
  cities: lookup("/cities"),
  providerProfile: {
    details: "/provider-profile/me",
    update: "/provider-profile/me",
  },
  seekerProfile: {
    details: "/seeker-profile/me",
    update: "/seeker-profile/me",
  },
  jobs: {
    ...crud("/jobs"),
    openings: (qs: string) => `/jobs/openings${qs ? `?${qs}` : ""}`,
    openingDetails: (id: number | string) => `/jobs/openings/${id}`,
  },
  applications: crud("/applications"),
  dashboard: {
    provider: "/dashboard/provider",
    seeker: "/dashboard/seeker",
  },
};
