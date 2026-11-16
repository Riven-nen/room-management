/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react"
import { KeyRound, Plus, Copy, Check, ShieldCheck, Ban } from "lucide-react"
import "./Schedules.css"

const API = import.meta.env.VITE_API_URL

const CODE_ROLES = [
    { value: "faculty", label: "Faculty" },
    { value: "admin", label: "Admin" },
    { value: "mis_staff", label: "MIS Staff" }
]

const ROLE_LABELS = {
    faculty: "Faculty",
    admin: "Admin",
    mis_staff: "MIS Staff",
    teacher: "Faculty"
}

const formatDateTime = (value) => {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function InviteCodes() {
    const [invites, setInvites] = useState([])
    const [form, setForm] = useState({ role: "faculty", label: "", max_uses: 1, expires_in_days: 7 })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [generatedCode, setGeneratedCode] = useState("")
    const [copied, setCopied] = useState(false)

    const loadInvites = async () => {
        try {
            const response = await fetch(`${API}/api/auth/invites`, { credentials: "include" })
            const data = await response.json()
            if (!response.ok) throw new Error(data.message || "Failed to load registration codes")
            setInvites(data.invites)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadInvites()
    }, [])

    const createCode = async (event) => {
        event.preventDefault()
        setSaving(true)
        setError("")
        setGeneratedCode("")
        setCopied(false)

        try {
            const response = await fetch(`${API}/api/auth/invites`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: form.role,
                    label: form.label,
                    max_uses: Number(form.max_uses),
                    expires_in_days: form.expires_in_days === "" ? null : Number(form.expires_in_days)
                })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.message || "Failed to create a registration code")

            setGeneratedCode(data.code)
            setForm(prev => ({ ...prev, label: "" }))
            await loadInvites()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(generatedCode)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
        } catch {
            setError("Could not copy automatically. Select the code and copy it manually.")
        }
    }

    const revoke = async (invite) => {
        if (!window.confirm(`Revoke this ${ROLE_LABELS[invite.role] || invite.role} registration code?`)) return

        try {
            const response = await fetch(`${API}/api/auth/invites/${invite.id}/revoke`, {
                method: "POST",
                credentials: "include"
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.message || "Failed to revoke the code")
            await loadInvites()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="schedule-page">
            <div className="schedule-hero">
                <div>
                    <h1>Registration Codes</h1>
                    <p>
                        Faculty, Admin, and MIS Staff need a one-time registration code.
                        Students can register without one. Codes are stored hashed and can
                        be limited by uses and expiry.
                    </p>
                </div>
                <div className="hero-meta">
                    <span className="hero-chip"><ShieldCheck size={14} /> Admin only</span>
                    <span className="hero-chip"><KeyRound size={14} /> {invites.filter(item => item.status === "active").length} active</span>
                </div>
            </div>

            {error && <div className="schedule-error">{error}</div>}

            <div className="master-grid">
                <div className="schedule-card">
                    <div className="schedule-card-header">
                        <div>
                            <h2>Generate a Code</h2>
                            <p>The code is only shown once, right after it is created.</p>
                        </div>
                    </div>
                    <div style={{ padding: 20 }}>
                        <form className="schedule-form" onSubmit={createCode}>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>Role</label>
                                    <select
                                        value={form.role}
                                        onChange={(event) => setForm(prev => ({ ...prev, role: event.target.value }))}
                                    >
                                        {CODE_ROLES.map(role => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Label (optional)</label>
                                    <input
                                        placeholder="e.g. New faculty batch"
                                        value={form.label}
                                        onChange={(event) => setForm(prev => ({ ...prev, label: event.target.value }))}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Maximum Uses</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={form.max_uses}
                                        onChange={(event) => setForm(prev => ({ ...prev, max_uses: event.target.value }))}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Expires In (days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Leave blank for no expiry"
                                        value={form.expires_in_days}
                                        onChange={(event) => setForm(prev => ({ ...prev, expires_in_days: event.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="primary-btn" disabled={saving}>
                                    <Plus size={16} /> {saving ? "Generating..." : "Generate Code"}
                                </button>
                            </div>
                        </form>

                        {generatedCode && (
                            <div className="invite-code-box" style={{ marginTop: 18 }}>
                                <div>
                                    <div className="invite-code-value">{generatedCode}</div>
                                    <p className="invite-code-note">
                                        Share this with the {ROLE_LABELS[form.role] || form.role} member. It will not be shown again.
                                    </p>
                                </div>
                                <button type="button" className="ghost-btn" onClick={copyCode}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="schedule-card">
                    <div className="schedule-card-header">
                        <div>
                            <h2>How It Works</h2>
                            <p>Protecting staff-only accounts.</p>
                        </div>
                    </div>
                    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, fontSize: 13.5, color: "#475569", lineHeight: 1.55 }}>
                        <p style={{ margin: 0 }}>
                            <strong style={{ color: "#00195c" }}>Students</strong> register normally from the Register page.
                        </p>
                        <p style={{ margin: 0 }}>
                            <strong style={{ color: "#00195c" }}>Faculty, Admin, and MIS Staff</strong> must enter a valid code during registration.
                        </p>
                        <p style={{ margin: 0 }}>
                            Codes are hashed, so they cannot be recovered later. Generate a new one if a code is lost.
                        </p>
                        <p style={{ margin: 0 }}>
                            Revoking a code immediately stops it from being used. Existing accounts are not affected.
                        </p>
                    </div>
                </div>
            </div>

            <div className="schedule-card">
                <div className="schedule-card-header">
                    <div>
                        <h2>All Registration Codes</h2>
                        <p>Only the code status is stored — never the plain code.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="schedule-loading">Loading registration codes...</div>
                ) : invites.length === 0 ? (
                    <div className="schedule-empty">
                        <KeyRound size={32} color="#94a3b8" />
                        <h3>No codes yet</h3>
                        <p>Generate a code above when a new staff member needs to register.</p>
                    </div>
                ) : (
                    <div className="schedule-table-wrapper">
                        <table className="schedule-table" style={{ minWidth: 760 }}>
                            <thead>
                                <tr>
                                    <th>Role</th>
                                    <th>Label</th>
                                    <th>Uses</th>
                                    <th>Expires</th>
                                    <th>Status</th>
                                    <th>Created By</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invites.map(invite => (
                                    <tr key={invite.id}>
                                        <td style={{ fontWeight: 700 }}>{ROLE_LABELS[invite.role] || invite.role}</td>
                                        <td>{invite.label || <span className="muted">—</span>}</td>
                                        <td>{invite.uses} / {invite.max_uses}</td>
                                        <td>{formatDateTime(invite.expires_at)}</td>
                                        <td>
                                            <span className={`status-badge ${invite.status}`}>{invite.status}</span>
                                        </td>
                                        <td>{invite.created_by_name || "—"}</td>
                                        <td>
                                            <div className="row-actions">
                                                {invite.status === "active" && (
                                                    <button className="icon-btn danger" title="Revoke" onClick={() => revoke(invite)}>
                                                        <Ban size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default InviteCodes
