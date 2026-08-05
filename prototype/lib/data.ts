export type CompanyStatus = "active" | "suspended";
export type CompanyRegion = "us-east" | "eu-central" | "ap-southeast";
export type CompanyPlan = "free" | "pro" | "enterprise";

export interface Company {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  region: CompanyRegion;
  plan: CompanyPlan;
  members: number;
  teams: number;
  managers: number;
  shifts: number;
  createdAt: string;
  updatedAt: string;
  color: string;
}

export type AuditTone = "neutral" | "success" | "danger" | "warning";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: "super_admin" | "company_admin" | "system";
  action: string;
  tone: AuditTone;
  resource: string;
  resourceId: string;
  companyId: string;
  company: string;
  ip: string;
}

export const COMPANY_COLORS = [
  "#5e6ad2",
  "#3cbf7b",
  "#e09f2b",
  "#d25e6a",
  "#5f9ed2",
  "#9b6dd2",
  "#61b6b0",
  "#d2785e",
  "#8a9aa7",
];

const now = Date.now();
const minutes = (n: number) => n * 60 * 1000;
const hours = (n: number) => minutes(n * 60);
const days = (n: number) => hours(n * 24);
export const ts = (offset: number) => new Date(now - offset).toISOString();

export const seedCompanies: Company[] = [
  {
    id: "comp_01",
    name: "GreenLeaf Cafe",
    slug: "greenleaf-cafe",
    status: "active",
    region: "us-east",
    plan: "pro",
    members: 128,
    teams: 24,
    managers: 18,
    shifts: 312,
    createdAt: ts(days(412)),
    updatedAt: ts(minutes(42)),
    color: COMPANY_COLORS[0],
  },
  {
    id: "comp_02",
    name: "Northwind Labs",
    slug: "northwind-labs",
    status: "active",
    region: "eu-central",
    plan: "enterprise",
    members: 964,
    teams: 63,
    managers: 87,
    shifts: 1887,
    createdAt: ts(days(388)),
    updatedAt: ts(hours(3)),
    color: COMPANY_COLORS[4],
  },
  {
    id: "comp_03",
    name: "Harbor & Howe",
    slug: "harbor-and-howe",
    status: "active",
    region: "us-east",
    plan: "pro",
    members: 48,
    teams: 9,
    managers: 6,
    shifts: 141,
    createdAt: ts(days(340)),
    updatedAt: ts(hours(9)),
    color: COMPANY_COLORS[6],
  },
  {
    id: "comp_04",
    name: "RapidCare Clinics",
    slug: "rapidcare-clinics",
    status: "active",
    region: "eu-central",
    plan: "enterprise",
    members: 512,
    teams: 41,
    managers: 54,
    shifts: 940,
    createdAt: ts(days(291)),
    updatedAt: ts(hours(26)),
    color: COMPANY_COLORS[3],
  },
  {
    id: "comp_05",
    name: "Brightside Retail",
    slug: "brightside-retail",
    status: "active",
    region: "ap-southeast",
    plan: "pro",
    members: 203,
    teams: 17,
    managers: 22,
    shifts: 517,
    createdAt: ts(days(244)),
    updatedAt: ts(days(1)),
    color: COMPANY_COLORS[8],
  },
  {
    id: "comp_06",
    name: "BlueLine Construction",
    slug: "blueline-construction",
    status: "suspended",
    region: "us-east",
    plan: "pro",
    members: 176,
    teams: 12,
    managers: 15,
    shifts: 0,
    createdAt: ts(days(198)),
    updatedAt: ts(days(6)),
    color: COMPANY_COLORS[2],
  },
  {
    id: "comp_07",
    name: "Static Peak Industries",
    slug: "static-peak",
    status: "suspended",
    region: "us-east",
    plan: "free",
    members: 12,
    teams: 3,
    managers: 2,
    shifts: 0,
    createdAt: ts(days(87)),
    updatedAt: ts(days(11)),
    color: COMPANY_COLORS[7],
  },
  {
    id: "comp_08",
    name: "Sunset Foods",
    slug: "sunset-foods",
    status: "active",
    region: "ap-southeast",
    plan: "pro",
    members: 89,
    teams: 21,
    managers: 11,
    shifts: 268,
    createdAt: ts(days(41)),
    updatedAt: ts(minutes(18)),
    color: COMPANY_COLORS[5],
  },
];

const e = (
  id: string,
  offMs: number,
  actor: string,
  role: AuditEntry["actorRole"],
  action: string,
  tone: AuditTone,
  resource: string,
  resourceId: string,
  companyId: string,
  company: string,
  ip: string,
): AuditEntry => ({
  id,
  timestamp: ts(offMs),
  actor,
  actorRole: role,
  action,
  tone,
  resource,
  resourceId,
  companyId,
  company,
  ip,
});

export const seedAudit: AuditEntry[] = [
  e("evt_01", minutes(2), "bishal@roster.app", "super_admin", "company.plan.changed", "neutral", "Northwind Labs", "company:comp_02", "comp_02", "Northwind Labs", "203.0.113.7"),
  e("evt_02", minutes(18), "sarah@sunsetfoods.com", "company_admin", "shift.published", "success", "Week 32 roster", "sched:2026-08-03", "comp_08", "Sunset Foods", "198.51.100.23"),
  e("evt_03", hours(1), "tts@roster.app", "system", "backup.completed", "neutral", "eu-central cluster", "cluster:eu1", "comp_04", "RapidCare Clinics", "10.0.4.2"),
  e("evt_04", hours(2), "sarah@sunsetfoods.com", "company_admin", "clock.import", "success", "Timesheet · 41 entries", "imp:8421", "comp_08", "Sunset Foods", "198.51.100.23"),
  e("evt_05", hours(3), "ops@roster.app", "system", "data.export", "neutral", "Company backup", "bak:2026-08-05", "comp_02", "Northwind Labs", "203.0.113.9"),
  e("evt_06", hours(4), "danya@rapidcare.com", "company_admin", "shift.published", "success", "Week 14 roster", "sched:2026-08-03", "comp_04", "RapidCare Clinics", "192.0.2.44"),
  e("evt_07", hours(5), "psanders@blueline.com", "company_admin", "company.registration", "neutral", "BlueLine Construction", "company:comp_06", "comp_06", "BlueLine Construction", "198.51.100.12"),
  e("evt_08", hours(6), "admin@roster.app", "super_admin", "company.activated", "success", "Clearview Dental", "company:comp_09", "comp_09", "Clearview Dental", "203.0.113.4"),
  e("evt_09", hours(7), "m.otho@harborandhowe.co", "company_admin", "team.deleted", "danger", "Delivery Unit", "team:73", "comp_03", "Harbor & Howe", "192.0.2.55"),
  e("evt_10", hours(8), "admin@roster.app", "super_admin", "company.plan.changed", "neutral", "RapidCare Clinics → Enterprise", "company:comp_04", "comp_04", "RapidCare Clinics", "203.0.113.4"),
  e("evt_11", hours(9), "crew@greenleafcafe.com", "company_admin", "person.invited", "neutral", "Priya Shah · Front of house", "person:3812", "comp_01", "GreenLeaf Cafe", "198.51.100.71"),
  e("evt_12", hours(12), "security@roster.app", "system", "honeypot.captured", "warning", "Unauthorized probe blocked", "evt:7b3c", "comp_00", "Platform", "185.220.101.41"),
  e("evt_13", hours(15), "admin@roster.app", "super_admin", "company.suspended", "danger", "RedRock Logistics", "company:comp_10", "comp_10", "RedRock Logistics", "203.0.113.4"),
  e("evt_14", hours(18), "it@northwindlabs.com", "company_admin", "mfa.factor.added", "success", "TOTP · Support desk", "sso:4c2", "comp_02", "Northwind Labs", "10.0.1.16"),
  e("evt_15", days(1), "admin@roster.app", "super_admin", "company.created", "success", "Sunset Foods", "company:comp_08", "comp_08", "Sunset Foods", "203.0.113.4"),
  e("evt_16", days(1) + hours(2), "root@static-peak.com", "company_admin", "role.changed", "neutral", "Publics · Admin", "user:um_22", "comp_07", "Static Peak Industries", "10.0.3.9"),
  e("evt_17", days(1) + hours(4), "crew@greenleafcafe.com", "company_admin", "shift.assigned", "neutral", "Morning shift · 4 people", "shift:44a1", "comp_01", "GreenLeaf Cafe", "198.51.100.72"),
  e("evt_18", days(2), "crew@greenleafcafe.com", "company_admin", "shift.assigned", "neutral", "Evening shift · 6 people", "shift:44b7", "comp_01", "GreenLeaf Cafe", "198.51.100.73"),
  e("evt_19", days(2) + hours(2), "bishal@roster.app", "super_admin", "region.routing.changed", "warning", "ap-southeast → cluster sg1", "region:ap-southeast", "comp_00", "Platform", "203.0.113.4"),
  e("evt_20", days(2) + hours(4), "admin@roster.app", "super_admin", "company.suspended", "danger", "Static Peak Industries", "company:comp_07", "comp_07", "Static Peak Industries", "203.0.113.4"),
  e("evt_21", days(2) + hours(6), "compliance@roster.app", "system", "person.erased", "danger", "GDPR erasure · §5.2", "user:9412", "comp_04", "Cascade Pac", "10.0.2.30"),
  e("evt_22", days(2) + hours(9), "audit@roster.app", "system", "audit.export", "neutral", "Audit log · last 30 days", "org:4a", "comp_00", "Platform", "203.0.113.10"),
  e("evt_23", days(3), "sarah@sunsetfoods.com", "company_admin", "shift.deleted", "danger", "Unpublished draft", "shift:09f", "comp_08", "Sunset Foods", "198.51.100.24"),
  e("evt_24", days(4), "crew@greenleafcafe.com", "company_admin", "team.created", "success", "Front of House", "team:88", "comp_01", "GreenLeaf Cafe", "198.51.100.71"),
  e("evt_25", days(5), "finance@roster.app", "system", "billing.card_failed", "warning", "Visa ···· 4242", "org:cx", "comp_06", "BlueLine Construction", "198.51.100.91"),
  e("evt_26", days(6), "admin@roster.app", "super_admin", "company.suspended", "danger", "BlueLine Materials", "comp:comp_06", "comp_06", "BlueLine Construction", "203.0.113.4"),
  e("evt_27", days(7), "crew@greenleafcafe.com", "company_admin", "invite.resend", "neutral", "Marie K. · invite resent", "user:812", "comp_01", "GreenLeaf Cafe", "198.51.100.74"),
  e("evt_28", days(8), "billing@northwindlabs.com", "company_admin", "company.updated", "neutral", "Billing address updated", "company:comp_02", "comp_02", "Northwind Labs", "203.0.113.7"),
  e("evt_29", days(9), "roster+hr@harborandhow.co", "company_admin", "shift.imported", "success", "CSV · 34 shifts", "shift:1d", "comp_03", "Harbor & Howe", "192.0.2.57"),
  e("evt_30", days(10), "it@brightside.com", "company_admin", "api.key.created", "warning", "Archive bot key", "key:09", "comp_05", "Brightside Retail", "198.51.100.30"),
  e("evt_31", days(11), "ops@northwindlabs.com", "company_admin", "company.timezone.changed", "neutral", "Timezone → Europe/London", "company:comp_02", "comp_02", "Northwind Labs", "203.0.113.7"),
  e("evt_32", days(13), "admin@roster.app", "super_admin", "company.deleted", "danger", "RedRock Logistics (archived)", "company:comp_10", "comp_10", "RedRock Logistics", "203.0.113.4"),
];