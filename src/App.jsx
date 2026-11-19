import { useContext, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom"
import { Suspense } from "react"

import Login from "./auth/Login.jsx"
import Register from "./auth/Register.jsx"
import Sidebar from "./layout/Sidebar.jsx"
import Navbar from "./layout/Navbar.jsx"
import { UserContext } from "./auth/UserContext.jsx"
import { NotificationProvider } from "./auth/NotificationContext.jsx"
import { normalizeRole } from "./auth/roles.js"
import { SystemLoader, PageSkeleton } from "./layout/Loading.jsx"
import { ROUTES, defaultRouteForRole, routeByPath } from "./lib/routes.js"

function ProtectedLayout() {
    const { user, loading } = useContext(UserContext)
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    if (loading) return <SystemLoader />
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

    const role = normalizeRole(user.role)
    const route = routeByPath(location.pathname)
    const title = route?.title || "Dashboard"
    const allowed = route ? route.roles.includes(role) : true

    return (
        <NotificationProvider>
            <div className="app-layout">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div
                    className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                />
                <div className="main-container">
                    <Navbar pageTitle={title} onMenuClick={() => setSidebarOpen(true)} />
                    <div className="main-content">
                        <div className="page-transition" key={location.pathname}>
                            <Suspense fallback={<PageSkeleton label={`Loading ${title.toLowerCase()}`} rows={5} columns={6} />}>
                                {allowed ? <Outlet /> : <Navigate to={defaultRouteForRole(role)} replace />}
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>
        </NotificationProvider>
    )
}

function PublicOnly({ children }) {
    const { user, loading } = useContext(UserContext)

    if (loading) return <SystemLoader />
    if (user) return <Navigate to={defaultRouteForRole(normalizeRole(user.role))} replace />
    return children
}

function AppRoutes() {
    const { user, loading } = useContext(UserContext)
    const role = normalizeRole(user?.role)

    if (loading) return <SystemLoader />

    return (
        <Routes>
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

            <Route element={<ProtectedLayout />}>
                <Route index element={<Navigate to={defaultRouteForRole(role)} replace />} />
                {ROUTES.map(({ path, component: Component }) => (
                    <Route key={path} path={path} element={<Component />} />
                ))}
            </Route>

            <Route path="*" element={<Navigate to={user ? defaultRouteForRole(role) : "/login"} replace />} />
        </Routes>
    )
}

function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    )
}

export default App
