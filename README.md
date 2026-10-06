# EduJobs (frontend)

EduJobs is a job portal that connects educational institutions (schools, colleges, universities and
coaching institutes) with people looking for work there: teachers, lecturers, professors,
librarians, lab assistants, office staff, drivers, security guards, peons and similar roles.

This repository is the **frontend only**. It runs entirely on demo data stored in the browser, so no
backend is needed to try it. The architecture follows the project blueprint (CRA 5, JSX components,
a TypeScript API layer, Bootstrap 5 with NiceAdmin-style static assets).

## Run it

Requirements: Node 18 or newer and npm.

```bash
npm install
npm start                 # http://localhost:3000
CI=false npm run build    # production build in ./build
```

The app is a single-page app. `netlify.toml` builds it and rewrites every path to `index.html`.

## Demo accounts

All demo accounts use the password **`Demo@123`**.

| Role | Email | What is in it |
|---|---|---|
| Job provider (school) | `greenfield.school@example.com` | Greenfield Public School, Noida. 8 jobs and 15 applicants. TGT Mathematics has 2 vacancies, 1 already hired and 2 more applicants, so hiring one more closes the job automatically. |
| Job provider (coaching institute) | `brightfuture.coaching@example.com` | Bright Future Coaching Institute, Kota. 6 jobs and 9 applicants. |
| Job seeker (teacher) | `priya.teacher@example.com` | Secondary Teacher. 3 applications (shortlisted, interview, rejected), 3 open jobs still to apply to. |
| Job seeker (driver) | `ramesh.driver@example.com` | Driver. 2 applications (shortlisted, applied), 3 open jobs still to apply to. |
| Job seeker (security guard) | `sunil.guard@example.com` | Security Guard. 2 applications (interview, rejected), 3 open jobs still to apply to. |

Every other seeded account (6 institutions and 20 seekers in total, listed in `src/demo/demo-db.ts`)
also logs in with `Demo@123`. All people, institutions, phone numbers, emails and websites in the demo
data are fictional.

You can also create new accounts on the Signup page. They are saved in the demo store too.

## What each role can do

| Route | Role | Page |
|---|---|---|
| `/login`, `/signup` | logged out | Login, signup (choose "I am hiring" or "I am looking for a job") |
| `/` | both | Dashboard (role-specific stat cards and charts) |
| `/profile/view`, `/profile/edit` | both | Institution profile or seeker profile |
| `/jobs/list`, `/jobs/add` | job_provider | My Jobs, Post a Job (Edit opens `/jobs/add` with the job id in router state) |
| `/applications/list` | job_provider | Applicants on the provider's own jobs (status change, Hire, contact details) |
| `/openings/list` | job_seeker | Find Jobs: open jobs in the seeker's own category, View and Apply |
| `/my-applications/list` | job_seeker | My Applications: View, Withdraw while still "Applied" |

The sidebar is built from the menu that the (demo) menu API returns for the role. Opening a page the
role's menu does not include redirects to the dashboard.

## Demo data

- The demo store lives in `src/demo/`. It is seeded on first use and saved in `localStorage` under the
  single key `demo_db_v1`, so jobs, applications and profile changes survive a page refresh.
- Seed dates (last dates to apply, application dates) are relative to the day the store is seeded, so a
  fresh store always has open jobs and a few expired ones.
- Changes made in one tab are picked up by other tabs of the same browser.

### Reset the demo data

Use either of these:

- In the app: open the profile menu (top right) and choose **Reset demo data**. This restores the seed
  data and logs you out.
- In the browser console: `localStorage.removeItem("demo_db_v1")`, then reload the page.

## Switch to a real backend

Every component calls a service in `src/services`. Each service already contains the real `apiClient`
call (endpoints in `src/config/apiConfig.ts`, request and response types in `src/types`). The first
line of each method sends the call to `src/demo` instead while demo mode is on.

1. In `.env`, set `REACT_APP_USE_DEMO_DATA=false` and set `REACT_APP_API_BASE_URL` to the API base
   URL, including the version prefix (for example `https://api.example.com/api/v1`).
2. Make the backend match the paths in `API_ENDPOINTS` and the shapes in `src/types`. Every response is
   `{ success, statusCode, message, resData }`, and every list returns
   `resData: { data: [], pagination: { total, page, limit, totalPages } }` for `page`, `limit` and
   `search` query parameters.
3. The backend must scope data by the `x-access-token` header in the same way the demo handlers do:
   a provider only sees their own jobs and the applications on them, a seeker only sees their own
   applications, and `/jobs/openings` only returns open jobs in the seeker's category.
4. Rebuild. No component changes are needed. Once the backend is live, `src/demo` (and the
   "Reset demo data" menu item, which only shows in demo mode) can be deleted.

## Project layout

```
public/assets/          Bootstrap CSS/JS, bootstrap-icons and the NiceAdmin-style style.css / main.js
src/config/             apiConfig.ts (base URL, USE_DEMO_DATA, endpoints), siteConfig.ts (brand, USER_ROLES)
src/types/              request and response interfaces, one file per resource
src/services/           api-client, auth-storage and one service per resource
src/demo/               DEMO ONLY: seed data, in-browser store and request handlers
src/context/            DContext with authReducer and commonReducer
src/layouts/            UserLayout (header, sidebar, main), AuthLayout
src/pages/              thin :method pages and the dashboard
src/components/         list, add/edit, profile and dashboard components, shared building blocks
src/helper/             numberInputGuard, dateHelper, stringMethods, validator, access
```
