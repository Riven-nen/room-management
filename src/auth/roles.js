import permissions from "../../shared/permissions.json"

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

export const ALL_ROLES = permissions.roles
export const PAGE_ACCESS = permissions.pages
export const CAPABILITIES = permissions.capabilities

export const canAccessPage = (role, page) => {
    const allowed = PAGE_ACCESS[page] || []
    return allowed.includes(normalizeRole(role))
}

export const hasCapability = (role, capability) => {
    const allowed = CAPABILITIES[capability] || []
    return allowed.includes(normalizeRole(role))
}

export const canBookLabs = (role) => ["admin", "faculty"].includes(normalizeRole(role))
