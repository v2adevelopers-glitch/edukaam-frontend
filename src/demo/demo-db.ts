/*
 * DEMO ONLY. In-memory demo database, persisted to localStorage under one key so it survives a
 * refresh. Every service in src/services answers from here while REACT_APP_USE_DEMO_DATA=true.
 * This file and services/auth-storage.service.ts are the only files that touch localStorage.
 *
 * All people, institutions, phone numbers, emails and websites below are fictional.
 */
import type { UserRoleCode } from "../config/siteConfig";
import type { JobCategory } from "../types/job-categories.types";
import type { InstitutionType } from "../types/institution-types.types";
import type { State } from "../types/states.types";
import type { City } from "../types/cities.types";
import type { ProviderProfile } from "../types/provider-profile.types";
import type { SeekerProfile } from "../types/seeker-profile.types";
import type { Job } from "../types/jobs.types";
import type { ApplicationStatus } from "../types/applications.types";

export const DEMO_DB_KEY = "demo_db_v1";
export const DEMO_PASSWORD = "Demo@123";

export interface DemoUser {
  id: number;
  user_code: string;
  role_code: UserRoleCode;
  name: string;
  email: string;
  mobile: string;
  password: string; // plain text: demo data only
  status: "active" | "inactive";
  created_at: string;
}

export type DemoProviderProfile = Omit<ProviderProfile, "institution_type_name" | "state_name" | "city_name">;
export type DemoSeekerProfile = Omit<SeekerProfile, "job_category_name" | "state_name" | "city_name">;
export type DemoJob = Omit<Job, "job_category_name" | "state_name" | "city_name" | "applicants_count" | "hired_count">;

export interface DemoApplication {
  id: number;
  application_code: string;
  job_id: number;
  seeker_id: number; // user id of the seeker
  status: ApplicationStatus;
  applied_on: string;
  updated_at: string;
}

export interface DemoDb {
  version: 1;
  seeded_at: string;
  users: DemoUser[];
  provider_profiles: DemoProviderProfile[];
  seeker_profiles: DemoSeekerProfile[];
  job_categories: JobCategory[];
  institution_types: InstitutionType[];
  states: State[];
  cities: City[];
  jobs: DemoJob[];
  applications: DemoApplication[];
}

/* ---------- date helpers (local time) ---------- */

const pad = (n: number) => String(n).padStart(2, "0");

export const toYmd = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayYmd = (): string => toYmd(new Date());

// YYYY-MM-DD, n days from today (negative = past)
const dayOffset = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toYmd(d);
};

// ISO datetime, n days ago at a given hour
const daysAgoIso = (n: number, hour = 10): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, (n * 7) % 60, 0, 0);
  return d.toISOString();
};

export const nowIso = (): string => new Date().toISOString();

export const nextId = (rows: { id: number }[]): number => rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;

export const makeCode = (prefix: string, id: number, width = 4): string => `${prefix}-${String(id).padStart(width, "0")}`;

/* ---------- lookup seeds ---------- */

const CATEGORY_NAMES = [
  "Primary Teacher", "Secondary Teacher", "Lecturer", "Professor", "Coaching Faculty", "Principal",
  "Librarian", "Lab Assistant", "Office Staff", "Driver", "Security Guard", "Peon",
];
// category ids, in the order above
const CAT = {
  PRIMARY: 1, SECONDARY: 2, LECTURER: 3, PROFESSOR: 4, COACHING: 5, PRINCIPAL: 6,
  LIBRARIAN: 7, LAB: 8, OFFICE: 9, DRIVER: 10, GUARD: 11, PEON: 12,
};

const INSTITUTION_TYPE_NAMES = ["School", "College", "University", "Coaching Institute"];
const ITYPE = { SCHOOL: 1, COLLEGE: 2, UNIVERSITY: 3, COACHING: 4 };

const STATE_CITIES: [string, string[]][] = [
  ["Uttar Pradesh", ["Noida", "Greater Noida", "Lucknow", "Kanpur", "Ghaziabad"]],
  ["Delhi", ["New Delhi", "Dwarka", "Rohini", "Saket"]],
  ["Maharashtra", ["Mumbai", "Pune", "Nagpur", "Nashik"]],
  ["Rajasthan", ["Jaipur", "Jodhpur", "Udaipur", "Kota"]],
  ["Karnataka", ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"]],
  ["Gujarat", ["Ahmedabad", "Surat", "Vadodara", "Rajkot"]],
];

const buildLocations = () => {
  const states: State[] = [];
  const cities: City[] = [];
  STATE_CITIES.forEach(([stateName, cityNames], si) => {
    const stateId = si + 1;
    states.push({ id: stateId, name: stateName, status: "active" });
    cityNames.forEach((cityName) => {
      cities.push({ id: cities.length + 1, state_id: stateId, name: cityName, status: "active" });
    });
  });
  return { states, cities };
};

/* ---------- seed builder ---------- */

const buildSeed = (): DemoDb => {
  const { states, cities } = buildLocations();
  const loc = (cityName: string) => {
    const city = cities.find((c) => c.name === cityName);
    if (!city) throw new Error(`Unknown seed city ${cityName}`);
    return { state_id: city.state_id, city_id: city.id };
  };

  const users: DemoUser[] = [];
  const provider_profiles: DemoProviderProfile[] = [];
  const seeker_profiles: DemoSeekerProfile[] = [];

  const addUser = (role: UserRoleCode, name: string, email: string, mobile: string, createdDaysAgo: number) => {
    const id = users.length + 1;
    users.push({
      id, user_code: makeCode("USR", id), role_code: role, name, email, mobile,
      password: DEMO_PASSWORD, status: "active", created_at: daysAgoIso(createdDaysAgo, 9),
    });
    return id;
  };

  /* --- providers (users 1-6) --- */
  type ProviderSeed = [string, number, string, string, string, string, number, string, string, string, string, string];
  // name, type, email, mobile, contact person, designation, established, website, city, address, pincode, about
  const providerSeeds: ProviderSeed[] = [
    ["Greenfield Public School", ITYPE.SCHOOL, "greenfield.school@example.com", "9000000101", "Anita Verma", "Principal", 1998,
      "https://greenfield-school.example.com", "Noida", "Plot 12, Sector 62", "201309",
      "CBSE affiliated co-educational school from Nursery to Class XII with about 2,400 students, smart classrooms and a dedicated transport fleet."],
    ["Bright Future Coaching Institute", ITYPE.COACHING, "brightfuture.coaching@example.com", "9000000102", "Manoj Khandelwal", "Director", 2009,
      "https://brightfuture-coaching.example.com", "Kota", "14-B, Indra Vihar, Talwandi", "324005",
      "Coaching for JEE (Main and Advanced), NEET and Olympiads, with classroom and weekend batches for Classes XI, XII and droppers."],
    ["Sunrise Convent School", ITYPE.SCHOOL, "sunrise.convent@example.com", "9000000103", "Sister Mary Joseph", "Administrator", 1987,
      "https://sunrise-convent.example.com", "Jaipur", "C-Scheme, Ashok Marg", "302001",
      "English medium RBSE school known for its arts, music and sports programmes."],
    ["Riverside Degree College", ITYPE.COLLEGE, "riverside.college@example.com", "9000000104", "Dr. Sanjay Kulkarni", "Registrar", 1972,
      "https://riverside-college.example.com", "Pune", "Riverside Road, Shivajinagar", "411005",
      "Affiliated degree college offering B.Com, B.Sc and BA programmes with NAAC A accreditation."],
    ["Northfield University", ITYPE.UNIVERSITY, "northfield.university@example.com", "9000000105", "Prof. Lakshmi Narayan", "Dean, Human Resources", 2004,
      "https://northfield-university.example.com", "Bengaluru", "Outer Ring Road, Marathahalli", "560037",
      "Private university with schools of engineering, sciences and management on a 60 acre campus."],
    ["Heritage Arts & Science College", ITYPE.COLLEGE, "heritage.college@example.com", "9000000106", "Mr. Kiran Desai", "Administrative Officer", 1993,
      "https://heritage-college.example.com", "Ahmedabad", "Near Law Garden, Ellisbridge", "380006",
      "Arts and science college with a higher secondary wing, hostel and a strong NSS unit."],
  ];

  providerSeeds.forEach((p, i) => {
    const [name, typeId, email, mobile, contact, designation, est, website, city, address, pincode, about] = p;
    const userId = addUser("job_provider", name, email, mobile, 200 - i * 10);
    provider_profiles.push({
      id: i + 1, user_id: userId, provider_code: makeCode("INST", i + 1, 3),
      institution_name: name, institution_type_id: typeId, contact_person: contact, designation, mobile, email,
      established_year: est, website, about, address, ...loc(city), pincode, updated_at: daysAgoIso(30 - i, 11),
    });
  });
  const P = { GREENFIELD: 1, BRIGHT: 2, SUNRISE: 3, RIVERSIDE: 4, NORTHFIELD: 5, HERITAGE: 6 };

  /* --- seekers (users 7-26) --- */
  type SeekerSeed = [string, string, string, "male" | "female", string, number, string, number, string, number, string, string];
  // name, email, mobile, gender, dob, category, qualification, experience, skills, expected salary, city, about
  const seekerSeeds: SeekerSeed[] = [
    ["Priya Sharma", "priya.teacher@example.com", "9000000201", "female", "1993-04-12", CAT.SECONDARY, "M.Sc Mathematics + B.Ed", 6,
      "Mathematics, Physics, CBSE curriculum, Smart class tools, Olympiad coaching", 45000, "Noida",
      "Secondary school teacher with six years of experience teaching Mathematics and Physics to Classes VIII to XII."],
    ["Rohit Mehra", "rohit.mehra@example.com", "9000000202", "male", "1990-09-03", CAT.SECONDARY, "M.Sc Physics + B.Ed", 8,
      "Physics, Lab demonstrations, Board exam preparation", 50000, "New Delhi", "PGT Physics, comfortable with CBSE and ICSE boards."],
    ["Kavita Joshi", "kavita.joshi@example.com", "9000000203", "female", "1995-01-21", CAT.SECONDARY, "B.Sc + B.Ed", 4,
      "General Science, Biology, Activity based learning", 36000, "Jaipur", "TGT Science teacher who enjoys project based learning."],
    ["Arjun Nair", "arjun.nair@example.com", "9000000204", "male", "1992-07-15", CAT.SECONDARY, "M.Sc Chemistry + B.Ed", 5,
      "Chemistry, Mathematics, Online teaching", 42000, "Bengaluru", "Chemistry teacher with experience in residential schools."],
    ["Neha Gupta", "neha.gupta@example.com", "9000000205", "female", "1997-11-02", CAT.PRIMARY, "B.A + D.El.Ed", 3,
      "English, Phonics, Storytelling, Classroom management", 28000, "Lucknow", "Primary teacher for Classes I to V."],
    ["Pooja Singh", "pooja.singh@example.com", "9000000206", "female", "1996-03-19", CAT.PRIMARY, "B.A + B.Ed", 2,
      "Hindi, EVS, Art and craft", 25000, "Kanpur", "Primary teacher who loves working with young children."],
    ["Ramesh Yadav", "ramesh.driver@example.com", "9000000207", "male", "1985-06-10", CAT.DRIVER, "10th Pass, Heavy vehicle licence", 12,
      "School bus driving, Route planning, First aid, Vehicle upkeep", 22000, "Greater Noida",
      "School bus driver with twelve years of accident-free driving on Noida and Greater Noida routes."],
    ["Mahesh Patil", "mahesh.patil@example.com", "9000000208", "male", "1982-12-25", CAT.DRIVER, "8th Pass, LMV and HMV licence", 15,
      "Bus driving, Van driving, Night driving", 21000, "Pune", "Experienced driver for staff and student transport."],
    ["Sunil Kumar", "sunil.guard@example.com", "9000000209", "male", "1988-08-08", CAT.GUARD, "10th Pass", 7,
      "Gate management, CCTV monitoring, Visitor register, Fire safety", 16000, "Noida",
      "Security guard with seven years at school and hospital campuses, comfortable with night shifts."],
    ["Harpal Singh", "harpal.singh@example.com", "9000000210", "male", "1979-02-14", CAT.GUARD, "12th Pass, Ex-serviceman", 18,
      "Campus security, Team supervision, Emergency response", 20000, "Rohini", "Ex-serviceman with supervisory security experience."],
    ["Ananya Rao", "ananya.rao@example.com", "9000000211", "female", "1991-05-30", CAT.LECTURER, "M.A English + NET", 5,
      "English literature, Communication skills, Research writing", 55000, "Mysuru", "Lecturer in English with UGC NET."],
    ["Vikram Deshmukh", "vikram.deshmukh@example.com", "9000000212", "male", "1989-10-11", CAT.LECTURER, "M.Com + NET", 6,
      "Accountancy, Business studies, Tally", 52000, "Mumbai", "Commerce lecturer for undergraduate programmes."],
    ["Dr. Meera Iyer", "meera.iyer@example.com", "9000000213", "female", "1984-01-09", CAT.PROFESSOR, "Ph.D Computer Science", 11,
      "Machine learning, Data structures, Research guidance", 140000, "Bengaluru", "Researcher and teacher with 20+ papers."],
    ["Saurabh Jain", "saurabh.jain@example.com", "9000000214", "male", "1990-04-04", CAT.COACHING, "B.Tech + M.Sc Physics", 7,
      "JEE Physics, Problem solving, Doubt sessions", 85000, "Kota", "JEE Physics faculty with strong selection results."],
    ["Ritika Agarwal", "ritika.agarwal@example.com", "9000000215", "female", "1994-09-17", CAT.COACHING, "M.Sc Chemistry", 4,
      "NEET Chemistry, Organic chemistry, Test series", 50000, "Jaipur", "NEET Chemistry faculty."],
    ["Rajeev Malhotra", "rajeev.malhotra@example.com", "9000000216", "male", "1975-03-28", CAT.PRINCIPAL, "M.A + M.Ed", 20,
      "School administration, CBSE affiliation, Staff training", 120000, "New Delhi", "Vice principal looking for a principal role."],
    ["Shalini Tiwari", "shalini.tiwari@example.com", "9000000217", "female", "1987-07-07", CAT.LIBRARIAN, "M.Lib.I.Sc", 9,
      "Library management, Koha, Cataloguing", 30000, "Lucknow", "Librarian experienced with digital library systems."],
    ["Deepak Chauhan", "deepak.chauhan@example.com", "9000000218", "male", "1996-12-01", CAT.LAB, "B.Sc Chemistry", 2,
      "Lab safety, Chemical inventory, Practical setup", 20000, "Ahmedabad", "Lab assistant for chemistry and physics labs."],
    ["Farhan Ali", "farhan.ali@example.com", "9000000219", "male", "1994-02-22", CAT.OFFICE, "B.Com", 4,
      "MS Office, Fee management, Front desk", 22000, "Noida", "Office executive with admissions desk experience."],
    ["Bablu Prasad", "bablu.prasad@example.com", "9000000220", "male", "1986-05-15", CAT.PEON, "8th Pass", 10,
      "Office upkeep, File movement, Tea and pantry", 12000, "Ghaziabad", "Reliable office helper."],
  ];

  seekerSeeds.forEach((s, i) => {
    const [name, email, mobile, gender, dob, cat, qual, exp, skills, salary, city, about] = s;
    const userId = addUser("job_seeker", name, email, mobile, 150 - i * 3);
    seeker_profiles.push({
      id: i + 1, user_id: userId, seeker_code: makeCode("SKR", i + 1), full_name: name, mobile, email, gender, dob,
      job_category_id: cat, highest_qualification: qual, experience_years: exp, skills, expected_salary: salary,
      ...loc(city), about, updated_at: daysAgoIso(20 - (i % 10), 12),
    });
  });
  // seeker user ids (1-based seeker index + 6 providers)
  const S = (n: number) => 6 + n;

  /* --- jobs --- */
  type JobSeed = [number, string, number, Job["job_type"], number, string, number, number, number, string, number, Job["status"], number, string];
  // provider, title, category, type, vacancies, qualification, min exp, salary min, salary max, city, last date offset, status, posted days ago, description
  const jobSeeds: JobSeed[] = [
    // Greenfield Public School (demo school)
    [P.GREENFIELD, "TGT Mathematics", CAT.SECONDARY, "full_time", 2, "B.Sc + B.Ed", 2, 32000, 45000, "Noida", 20, "open", 12,
      "Teach Mathematics to Classes VI to X following the CBSE curriculum. Prepare lesson plans, conduct periodic tests and remedial classes."],
    [P.GREENFIELD, "PGT Physics", CAT.SECONDARY, "full_time", 1, "M.Sc Physics + B.Ed", 3, 40000, 55000, "Noida", 25, "open", 10,
      "Teach Physics to Classes XI and XII, run the physics lab and prepare students for board practicals."],
    [P.GREENFIELD, "TGT Computer Science", CAT.SECONDARY, "full_time", 1, "B.Sc / BCA + B.Ed", 2, 30000, 40000, "Noida", -20, "closed", 55,
      "Teach Computer Science and ICT to Classes VI to X and manage the computer lab."],
    [P.GREENFIELD, "PRT English", CAT.PRIMARY, "full_time", 2, "Graduate + D.El.Ed / B.Ed", 1, 25000, 35000, "Noida", 15, "open", 8,
      "Teach English to Classes I to V with a focus on phonics, reading and spoken English."],
    [P.GREENFIELD, "School Bus Driver", CAT.DRIVER, "full_time", 2, "10th Pass, heavy vehicle licence", 3, 16000, 22000, "Noida", 18, "open", 6,
      "Drive the school bus on morning and afternoon routes, keep the bus log and follow child safety rules."],
    [P.GREENFIELD, "Security Guard (Night Shift)", CAT.GUARD, "full_time", 2, "10th Pass", 1, 13000, 17000, "Noida", 12, "open", 9,
      "Guard the campus from 8 pm to 8 am, keep the visitor and vehicle register and patrol the premises."],
    [P.GREENFIELD, "Librarian", CAT.LIBRARIAN, "full_time", 1, "B.Lib.I.Sc", 2, 22000, 30000, "Noida", -5, "open", 40,
      "Manage the school library, issue and return records and reading programmes."],
    [P.GREENFIELD, "Office Peon", CAT.PEON, "full_time", 1, "8th Pass", 0, 10000, 13000, "Noida", -10, "closed", 50,
      "General office support, file movement and upkeep of the administration block."],

    // Bright Future Coaching Institute (demo coaching)
    [P.BRIGHT, "Physics Faculty (JEE)", CAT.COACHING, "full_time", 2, "B.Tech / M.Sc Physics", 3, 60000, 90000, "Kota", 22, "open", 7,
      "Teach JEE Main and Advanced Physics to Class XI, XII and dropper batches, and run doubt sessions."],
    [P.BRIGHT, "Chemistry Faculty (NEET)", CAT.COACHING, "part_time", 1, "M.Sc Chemistry", 2, 35000, 50000, "Kota", 14, "open", 5,
      "Evening and weekend NEET Chemistry batches with weekly test analysis."],
    [P.BRIGHT, "Visiting Mathematics Faculty", CAT.COACHING, "visiting", 1, "M.Sc Mathematics", 5, 30000, 45000, "Jaipur", -3, "open", 35,
      "Weekend Mathematics classes for the Jaipur branch."],
    [P.BRIGHT, "Front Office Counsellor", CAT.OFFICE, "full_time", 1, "Graduate", 1, 18000, 25000, "Kota", 20, "open", 11,
      "Handle admission enquiries, counsel parents and maintain student records."],
    [P.BRIGHT, "Security Guard", CAT.GUARD, "contract", 1, "10th Pass", 0, 12000, 15000, "Kota", 16, "open", 4,
      "Day shift security for the Talwandi centre, including student entry checks."],
    [P.BRIGHT, "Staff Van Driver", CAT.DRIVER, "contract", 1, "10th Pass, LMV licence", 2, 15000, 19000, "Kota", 10, "open", 3,
      "Drive the staff van between the hostels and the institute."],

    // Sunrise Convent School
    [P.SUNRISE, "TGT Science", CAT.SECONDARY, "full_time", 1, "B.Sc + B.Ed", 2, 28000, 38000, "Jaipur", 19, "open", 13,
      "Teach General Science to Classes VI to VIII and coordinate the science exhibition."],
    [P.SUNRISE, "TGT Social Science", CAT.SECONDARY, "full_time", 1, "B.A + B.Ed", 2, 27000, 36000, "Jaipur", 30, "open", 2,
      "Teach History, Geography and Civics to Classes VI to X."],
    [P.SUNRISE, "PRT Hindi", CAT.PRIMARY, "full_time", 1, "Graduate + D.El.Ed", 1, 22000, 30000, "Jaipur", -8, "closed", 45,
      "Teach Hindi to Classes I to V."],
    [P.SUNRISE, "Principal", CAT.PRINCIPAL, "full_time", 1, "Post Graduate + B.Ed", 12, 90000, 130000, "Jaipur", 35, "open", 15,
      "Lead academics and administration for a school of 1,800 students."],
    [P.SUNRISE, "School Van Driver", CAT.DRIVER, "part_time", 1, "8th Pass, LMV licence", 2, 9000, 12000, "Jaipur", 9, "open", 6,
      "Morning and afternoon van routes for primary students."],

    // Riverside Degree College
    [P.RIVERSIDE, "Assistant Lecturer - Commerce", CAT.LECTURER, "full_time", 2, "M.Com + NET", 1, 45000, 60000, "Pune", 28, "open", 9,
      "Teach Accountancy and Business Studies to B.Com students and mentor final year projects."],
    [P.RIVERSIDE, "Lecturer - English", CAT.LECTURER, "contract", 1, "M.A English + NET", 2, 40000, 52000, "Mumbai", 12, "closed", 30,
      "Teach compulsory English for the Mumbai extension centre."],
    [P.RIVERSIDE, "Lab Assistant (Chemistry)", CAT.LAB, "full_time", 1, "B.Sc Chemistry", 1, 18000, 24000, "Pune", 17, "open", 8,
      "Prepare practicals, maintain chemical stock and lab safety records."],
    [P.RIVERSIDE, "Security Supervisor", CAT.GUARD, "full_time", 1, "12th Pass", 3, 18000, 23000, "Pune", -2, "open", 33,
      "Supervise a team of six guards across two campuses."],

    // Northfield University
    [P.NORTHFIELD, "Assistant Professor - Computer Science", CAT.PROFESSOR, "full_time", 2, "Ph.D / M.Tech + NET", 3, 90000, 140000, "Bengaluru", 40, "open", 14,
      "Teach undergraduate and postgraduate computer science courses and guide research projects."],
    [P.NORTHFIELD, "University Bus Driver", CAT.DRIVER, "full_time", 2, "10th Pass, heavy vehicle licence", 5, 20000, 26000, "Bengaluru", 21, "open", 10,
      "Drive the university buses on city routes for students and staff."],
    [P.NORTHFIELD, "Campus Security Guard", CAT.GUARD, "contract", 3, "10th Pass", 0, 14000, 18000, "Bengaluru", 11, "open", 7,
      "Rotating shifts at hostel and academic block gates."],

    // Heritage Arts & Science College
    [P.HERITAGE, "PGT Chemistry (Higher Secondary)", CAT.SECONDARY, "full_time", 1, "M.Sc Chemistry + B.Ed", 3, 38000, 50000, "Ahmedabad", 24, "open", 4,
      "Teach Chemistry to Classes XI and XII in the higher secondary wing."],
    [P.HERITAGE, "Security Guard", CAT.GUARD, "full_time", 1, "10th Pass", 1, 13000, 16000, "Ahmedabad", 20, "open", 1,
      "Main gate security and hostel night rounds."],
    [P.HERITAGE, "College Driver", CAT.DRIVER, "full_time", 1, "10th Pass, LMV licence", 3, 16000, 20000, "Ahmedabad", 26, "open", 2,
      "Drive the college car and staff van for official trips."],
  ];

  const jobs: DemoJob[] = jobSeeds.map((j, i) => {
    const [provider, title, cat, type, vac, qual, exp, smin, smax, city, lastOffset, status, postedAgo, description] = j;
    const providerUserId = provider_profiles[provider - 1].user_id;
    const id = i + 1;
    return {
      id, job_code: makeCode("JOB", id), provider_id: providerUserId, title, job_category_id: cat, job_type: type,
      vacancies: vac, min_qualification: qual, min_experience: exp, salary_min: smin, salary_max: smax, ...loc(city),
      last_date: dayOffset(lastOffset), description, status, created_at: daysAgoIso(postedAgo, 10), updated_at: daysAgoIso(postedAgo, 10),
    };
  });
  const J = (title: string, providerNo: number) => {
    const userId = provider_profiles[providerNo - 1].user_id;
    const job = jobs.find((x) => x.title === title && x.provider_id === userId);
    if (!job) throw new Error(`Unknown seed job ${title}`);
    return job;
  };

  /* --- applications --- */
  const applications: DemoApplication[] = [];
  const apply = (job: DemoJob, seekerNo: number, status: ApplicationStatus, appliedDaysAgo: number) => {
    const id = applications.length + 1;
    applications.push({
      id, application_code: makeCode("APP", id), job_id: job.id, seeker_id: S(seekerNo), status,
      applied_on: daysAgoIso(appliedDaysAgo, 9 + (id % 8)),
      updated_at: daysAgoIso(Math.max(0, appliedDaysAgo - (status === "applied" ? 0 : 2)), 15),
    });
  };

  // Secondary Teacher (seekers 1-4; seeker 1 is the demo teacher)
  const tgtMaths = J("TGT Mathematics", P.GREENFIELD);
  apply(tgtMaths, 2, "hired", 11);
  apply(tgtMaths, 3, "shortlisted", 10);
  apply(tgtMaths, 4, "interview", 9);
  const pgtPhysics = J("PGT Physics", P.GREENFIELD);
  apply(pgtPhysics, 1, "shortlisted", 9);
  apply(pgtPhysics, 2, "applied", 4);
  apply(pgtPhysics, 4, "rejected", 8);
  const tgtCs = J("TGT Computer Science", P.GREENFIELD);
  apply(tgtCs, 3, "hired", 50);
  apply(tgtCs, 1, "rejected", 52);
  apply(tgtCs, 2, "rejected", 49);
  const tgtScience = J("TGT Science", P.SUNRISE);
  apply(tgtScience, 1, "interview", 12);
  apply(tgtScience, 3, "applied", 6);
  apply(J("TGT Social Science", P.SUNRISE), 2, "applied", 1);
  const pgtChem = J("PGT Chemistry (Higher Secondary)", P.HERITAGE);
  apply(pgtChem, 4, "applied", 3);
  apply(pgtChem, 3, "rejected", 2);

  // Primary Teacher (seekers 5-6)
  const prtEnglish = J("PRT English", P.GREENFIELD);
  apply(prtEnglish, 5, "shortlisted", 7);
  apply(prtEnglish, 6, "applied", 3);
  const prtHindi = J("PRT Hindi", P.SUNRISE);
  apply(prtHindi, 6, "hired", 40);
  apply(prtHindi, 5, "rejected", 42);

  // Driver (seekers 7-8; seeker 7 is the demo driver)
  apply(J("School Bus Driver", P.GREENFIELD), 8, "interview", 5);
  const nfBus = J("University Bus Driver", P.NORTHFIELD);
  apply(nfBus, 7, "shortlisted", 8);
  apply(nfBus, 8, "applied", 6);
  apply(J("School Van Driver", P.SUNRISE), 7, "applied", 4);
  apply(J("Staff Van Driver", P.BRIGHT), 8, "rejected", 2);

  // Security Guard (seekers 9-10; seeker 9 is the demo guard)
  apply(J("Security Guard (Night Shift)", P.GREENFIELD), 10, "hired", 8);
  const supervisor = J("Security Supervisor", P.RIVERSIDE);
  apply(supervisor, 9, "rejected", 25);
  apply(supervisor, 10, "interview", 24);
  const campusGuard = J("Campus Security Guard", P.NORTHFIELD);
  apply(campusGuard, 9, "interview", 6);
  apply(campusGuard, 10, "applied", 5);
  apply(J("Security Guard", P.BRIGHT), 10, "shortlisted", 3);

  // Lecturer (seekers 11-12)
  const commerce = J("Assistant Lecturer - Commerce", P.RIVERSIDE);
  apply(commerce, 12, "shortlisted", 7);
  apply(commerce, 11, "applied", 5);
  const english = J("Lecturer - English", P.RIVERSIDE);
  apply(english, 11, "hired", 25);
  apply(english, 12, "rejected", 26);

  // Professor (seeker 13)
  apply(J("Assistant Professor - Computer Science", P.NORTHFIELD), 13, "interview", 10);

  // Coaching Faculty (seekers 14-15)
  const physicsFaculty = J("Physics Faculty (JEE)", P.BRIGHT);
  apply(physicsFaculty, 14, "hired", 6);
  apply(physicsFaculty, 15, "interview", 5);
  const chemFaculty = J("Chemistry Faculty (NEET)", P.BRIGHT);
  apply(chemFaculty, 15, "applied", 3);
  apply(chemFaculty, 14, "shortlisted", 4);
  const visitingMaths = J("Visiting Mathematics Faculty", P.BRIGHT);
  apply(visitingMaths, 14, "rejected", 30);
  apply(visitingMaths, 15, "rejected", 28);

  // One each for the remaining categories
  apply(J("Principal", P.SUNRISE), 16, "interview", 9);
  apply(J("Librarian", P.GREENFIELD), 17, "shortlisted", 20);
  apply(J("Lab Assistant (Chemistry)", P.RIVERSIDE), 18, "applied", 5);
  apply(J("Front Office Counsellor", P.BRIGHT), 19, "interview", 8);
  apply(J("Office Peon", P.GREENFIELD), 20, "hired", 45);

  return {
    version: 1,
    seeded_at: nowIso(),
    users,
    provider_profiles,
    seeker_profiles,
    job_categories: CATEGORY_NAMES.map((name, i) => ({
      id: i + 1, code: name.toUpperCase().replace(/[^A-Z]+/g, "_"), name, status: "active",
    })),
    institution_types: INSTITUTION_TYPE_NAMES.map((name, i) => ({
      id: i + 1, code: name.toUpperCase().replace(/[^A-Z]+/g, "_"), name, status: "active",
    })),
    states,
    cities,
    jobs,
    applications,
  };
};

/* ---------- store ---------- */

let cache: DemoDb | null = null;

const persist = (db: DemoDb): void => {
  try {
    localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
  } catch {
    // storage full or disabled: keep working in memory for this tab
  }
};

const load = (): DemoDb | null => {
  try {
    const raw = localStorage.getItem(DEMO_DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoDb;
    return parsed?.version === 1 && Array.isArray(parsed.jobs) ? parsed : null;
  } catch {
    return null;
  }
};

// Current demo database (loaded from localStorage, seeded on first use)
export const getDb = (): DemoDb => {
  if (cache) return cache;
  cache = load();
  if (!cache) {
    cache = buildSeed();
    persist(cache);
  }
  return cache;
};

// Apply a change to the demo database and persist it
export const updateDb = <T>(change: (db: DemoDb) => T): T => {
  const db = getDb();
  const result = change(db);
  persist(db);
  return result;
};

// Throw away all demo changes and start again from the seed data
export const resetDemoDb = (): void => {
  cache = buildSeed();
  persist(cache);
};
