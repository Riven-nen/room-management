import { lazy } from "react"
import permissions from "../../shared/permissions.json"

const Dashboard = lazy(() => import("../mainpage/Dashboard.jsx"))
const LabManagement = lazy(() => import("../mainpage/LabManagement.jsx"))
const Settings = lazy(() => import("../mainpage/Settings.jsx"))
const ScheduleViewer = lazy(() => import("../mainpage/ScheduleViewer.jsx"))
const SemesterSchedule = lazy(() => import("../mainpage/SemesterSchedule.jsx"))
const MasterSchedule = lazy(() => import("../mainpage/MasterSchedule.jsx"))
const ScheduleManager = lazy(() => import("../mainpage/ScheduleManager.jsx"))
const InviteCodes = lazy(() => import("../mainpage/InviteCodes.jsx"))
const UserManagement = lazy(() => import("../mainpage/UserManagement.jsx"))
const AnalyticsReports = lazy(() => import("../mainpage/AnalyticsReports.jsx"))
const Reservation = lazy(() => import("../mainpage/Reservation.jsx"))
const BookingsManager = lazy(() => import("../mainpage/BookingsManager.jsx"))

export const ROUTES = [
    {
        key: "dashboard",
        path: "/dashboard",
        title: "Dashboard",
        component: Dashboard,
        roles: permissions.pages.dashboard
    },
    {
        key: "classSchedule",
        path: "/class-schedule",
        title: "Class Schedule",
        component: SemesterSchedule,
        roles: permissions.pages.classSchedule
    },
    {
        key: "universityCalendar",
        path: "/university-calendar",
        title: "University Calendar",
        component: MasterSchedule,
        roles: permissions.pages.universityCalendar
    },
    {
        key: "labSchedule",
        path: "/lab-schedule",
        title: "Laboratory Schedule",
        component: ScheduleViewer,
        roles: permissions.pages.labSchedule
    },
    {
        key: "bookings",
        path: "/bookings",
        title: "Lab Reservation",
        component: Reservation,
        roles: permissions.pages.bookings
    },
    {
        key: "manageBookings",
        path: "/manage-bookings",
        title: "Manage Bookings",
        component: BookingsManager,
        roles: permissions.pages.manageBookings
    },
    {
        key: "scheduleManager",
        path: "/admin/schedules",
        title: "Manage Schedules",
        component: ScheduleManager,
        roles: permissions.pages.scheduleManager
    },
    {
        key: "inviteCodes",
        path: "/admin/registration-codes",
        title: "Registration Codes",
        component: InviteCodes,
        roles: permissions.pages.inviteCodes
    },
    {
        key: "userManagement",
        path: "/admin/users",
        title: "User Management",
        component: UserManagement,
        roles: permissions.pages.userManagement
    },
    {
        key: "labManagement",
        path: "/admin/labs",
        title: "Lab Management",
        component: LabManagement,
        roles: permissions.pages.labManagement
    },
    {
        key: "analytics",
        path: "/admin/analytics",
        title: "Analytics Reports",
        component: AnalyticsReports,
        roles: permissions.pages.analytics
    },
    {
        key: "settings",
        path: "/settings",
        title: "Settings",
        component: Settings,
        roles: permissions.pages.settings
    }
]

export const defaultRouteForRole = (role) => (role === "student" ? "/class-schedule" : "/dashboard")

export const routeByPath = (pathname) => ROUTES.find((route) => route.path === pathname)
