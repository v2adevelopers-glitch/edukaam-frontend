export const SITE_CONFIG = {
  brandName: "EduJobs",
  tagline: "Jobs at schools, colleges, universities and coaching institutes",
  copyrightHolder: "EduJobs",
};

export const USER_ROLES = {
  JOB_SEEKER: "job_seeker",
  JOB_PROVIDER: "job_provider",
} as const;

export type UserRoleCode = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_LABELS: Record<UserRoleCode, string> = {
  job_seeker: "Job Seeker",
  job_provider: "Institution",
};
