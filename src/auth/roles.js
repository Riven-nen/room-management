export const normalizeRole = (role) => {
    const value = String(role || "").toLowerCase()
    return value === "teacher" ? "faculty" : value
}

export const ROLE_LABELS = {
    student: "Student",
    faculty: "Faculty",
    admin: "Admin",
    mis_staff: "MIS Staff"
}

export const ALL_ROLES = ["student", "faculty", "admin", "mis_staff"]

export const PAGE_ACCESS = {
    Dashboard: ["admin", "faculty", "mis_staff"],
    LabManagement: ["admin"],
    Announcements: ALL_ROLES,
    Settings: ALL_ROLES,
    ScheduleViewer: ALL_ROLES,
    SemesterSchedule: ALL_ROLES,
    MasterSchedule: ALL_ROLES,
    AnalyticsReports: ["admin"],
    Reservation: ["admin", "faculty"],
    BookingsManager: ["admin", "faculty"],
    ScheduleManager: ["admin"],
    InviteCodes: ["admin"]
}

export const canAccessPage = (role, page) => {
    const allowed = PAGE_ACCESS[page] || []
    return allowed.includes(normalizeRole(role))
}

export const canBookLabs = (role) => ["admin", "faculty"].includes(normalizeRole(role))
