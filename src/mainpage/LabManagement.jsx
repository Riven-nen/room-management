import { DoorOpen, Monitor, User2, Wrench, PlusCircle, MapPin, Pen, Trash2 } from 'lucide-react'
import "./LabManagement.css"
import Card from "./Card"
import PlaceholderLab from "../assets/placeholder-lab.jpg"
import Toggle from "../layout/Toggle.jsx"
import Modal from "../layout/Modal.jsx"
import { useState, useContext } from 'react'
import { UserContext } from "../auth/UserContext.jsx"

function LabManagement() {
    const { labs, setLabs } = useContext(UserContext)

    const [showModal, setShowModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
    const [showPCModal, setShowPCModal] = useState(false)

    const [activeLab, setActiveLab] = useState(null)
    const [computers, setComputers] = useState([])
    const [selectedPC, setSelectedPC] = useState(null)
    const [pcReason, setPcReason] = useState("")

    const [maintenanceLab, setMaintenanceLab] = useState(null)
    const [maintenanceReason, setMaintenanceReason] = useState("")
    const [maintenanceUntil, setMaintenanceUntil] = useState("")

    const [roomName, setRoomName] = useState("")
    const [roomBuilding, setRoomBuilding] = useState("")
    const [roomCapacity, setRoomCapacity] = useState("")
    const [roomPCS, setRoomPCS] = useState("")

    const [editRoom, setEditRoom] = useState("")
    const [editRoomName, setEditRoomName] = useState("")
    const [editRoomBuilding, setEditRoomBuilding] = useState("")
    const [editRoomCapacity, setEditRoomCapacity] = useState("")
    const [editRoomPCS, setEditRoomPCS] = useState("")

    const refreshLabs = async () => {
        const labsResponse = await fetch("http://localhost:3000/api/lab/all", { credentials: "include" })
        const data = await labsResponse.json()
        setLabs(data.labs)
    }

    const handleAddSubmit = async (event) => {
        event.preventDefault()
        const response = await fetch("http://localhost:3000/api/lab/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ roomName, roomBuilding, roomCapacity, roomPCS })
        })
        if (response.ok) {
            await refreshLabs()
            setShowModal(false)
            setRoomName(""); setRoomBuilding(""); setRoomCapacity(""); setRoomPCS("")
        }
    }

    const handleEditClick = (lab) => {
        setEditRoom(lab.name)
        setEditRoomName(lab.name)
        setEditRoomBuilding(lab.location)
        setEditRoomCapacity(lab.capacity)
        setEditRoomPCS(lab.computer_count)
        setShowEditModal(true)
    }

    const handleEditSubmit = async (event) => {
        event.preventDefault()
        const response = await fetch("http://localhost:3000/api/lab/edit", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                roomName: editRoom, newRoomName: editRoomName, roomBuilding: editRoomBuilding, roomCapacity: editRoomCapacity, roomPCS: editRoomPCS
            })
        })
        if (response.ok) {
            await refreshLabs()
            setEditRoom(editRoomName)
            setShowEditModal(false)
        }
    }

    const handleDelete = async () => {
        const response = await fetch("http://localhost:3000/api/lab/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ roomName: editRoom })
        })
        if (response.ok) {
            await refreshLabs()
            setShowEditModal(false)
        }
    }

    // --- ROOM MAINTENANCE ---
    const handleToggleMaintenance = (lab) => {
        console.log("1. TOGGLE CLICKED FOR:", lab.name, "Status:", lab.maintenance)
        if (!lab.maintenance) {
            setMaintenanceLab(lab)
            setMaintenanceReason("")
            setMaintenanceUntil("")
            setShowMaintenanceModal(true)
        } else {
            console.log("Turning maintenance OFF directly")
            submitMaintenance(lab.name, false, null, null)
        }
    }

    const submitMaintenance = async (roomName, status, reason, until) => {
        console.log("2. SUBMITTING TO BACKEND:", { roomName, status, reason, until })
        try {
            const response = await fetch("http://localhost:3000/api/lab/maintenance", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    roomName: roomName,
                    maintenance: status,
                    maintenanceReason: reason,
                    maintenanceUntil: until
                })
            })
            console.log("3. BACKEND RESPONSE:", response.status)

            if (response.ok) {
                await refreshLabs()
                setShowMaintenanceModal(false)
            } else {
                const errorData = await response.json()
                console.error("BACKEND ERROR:", errorData)
                alert("Failed: " + (errorData.error || "Unknown error"))
            }
        } catch (error) {
            console.error("FETCH NETWORK ERROR:", error)
            alert("Network error. Check backend terminal.")
        }
    }

    const handleMaintenanceSubmit = (e) => {
        e.preventDefault()
        console.log("Form submitted inside modal")
        submitMaintenance(maintenanceLab.name, true, maintenanceReason, maintenanceUntil)
    }

    // --- PC LAYOUT ---
    const openPCLayout = async (lab) => {
        setActiveLab(lab)
        setSelectedPC(null)
        setShowPCModal(true)
        try {
            const res = await fetch(`http://localhost:3000/api/lab/get-computers?roomId=${lab.id}`, { credentials: "include" })
            const data = await res.json()
            if (res.ok) setComputers(data.computers || [])
        } catch (error) { console.error(error) }
    }

    const handlePCClick = (pc) => {
        if (pc.is_maintenance) {
            togglePCStatus(pc.id, false, null)
        } else {
            setSelectedPC(pc)
            setPcReason("")
        }
    }

    const togglePCStatus = async (computerId, isMaintenance, reason) => {
        try {
            const res = await fetch("http://localhost:3000/api/lab/toggle-pc", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ computerId, isMaintenance, maintenanceReason: reason })
            })
            if (res.ok) {
                const pcRes = await fetch(`http://localhost:3000/api/lab/get-computers?roomId=${activeLab.id}`, { credentials: "include" })
                const pcData = await pcRes.json()
                if (pcRes.ok) setComputers(pcData.computers || [])
                setSelectedPC(null)
            }
        } catch (error) { console.error(error) }
    }

    const submitPCMaintenance = (e) => {
        e.preventDefault()
        togglePCStatus(selectedPC.id, true, pcReason)
    }

    return (
        <>
            <div className="lab-management-title">
                <div className="lab-management-title-left">
                    <label htmlFor="lab-management-title-text">Facility Overview</label>
                    <h1 id="lab-management-title-text">Computer Laboratory Status</h1>
                </div>
                <div className="lab-management-title-right">
                    <button className="lab-management-title-register" onClick={() => setShowModal(true)}>
                        <PlusCircle size={20} strokeWidth={3} /> Register New Lab
                    </button>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register New Lab">
                <form onSubmit={handleAddSubmit}>
                    <input type="text" placeholder="Room number" value={roomName} onChange={(e) => setRoomName(e.target.value)} required />
                    <input type="text" placeholder="Building" value={roomBuilding} onChange={(e) => setRoomBuilding(e.target.value)} required />
                    <input type="number" placeholder="Capacity" value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} required />
                    <input type="number" placeholder="Available PCs" value={roomPCS} onChange={(e) => setRoomPCS(e.target.value)} required />
                    <button type="submit">Add Room</button>
                </form>
            </Modal>

            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Lab">
                <form onSubmit={handleEditSubmit}>
                    <input type="text" placeholder="Room number" value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)} required />
                    <input type="text" placeholder="Building" value={editRoomBuilding} onChange={(e) => setEditRoomBuilding(e.target.value)} required />
                    <input type="number" placeholder="Capacity" value={editRoomCapacity} onChange={(e) => setEditRoomCapacity(e.target.value)} required />
                    <input type="number" placeholder="Available PCs" value={editRoomPCS} onChange={(e) => setEditRoomPCS(e.target.value)} required />
                    <button type="submit">Save Changes</button>
                    <button type="button" className="lab-management-delete" onClick={handleDelete}>
                        <Trash2 /> Delete Lab
                    </button>
                </form>
            </Modal>

            <Modal isOpen={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} title={`Maintenance: ${maintenanceLab?.name}`}>
                <form onSubmit={handleMaintenanceSubmit}>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>Reason for Maintenance</label>
                    <input type="text" placeholder="e.g. Broken AC" value={maintenanceReason} onChange={(e) => setMaintenanceReason(e.target.value)} required style={{marginBottom: '16px'}} />
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>Estimated Date Available</label>
                    <input type="datetime-local" value={maintenanceUntil} onChange={(e) => setMaintenanceUntil(e.target.value)} required style={{marginBottom: '16px'}} />
                    <button type="submit" style={{backgroundColor: '#dc2626'}}>Put Lab Under Maintenance</button>
                </form>
            </Modal>

            {showPCModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h2 style={{ margin: 0, color: '#00195c' }}>
                                {selectedPC ? `Set PC ${selectedPC.pc_number} to Maintenance` : `PC Layout: ${activeLab?.name}`}
                            </h2>
                            <button onClick={() => { setShowPCModal(false); setSelectedPC(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>✕</button>
                        </div>
                        
                        {selectedPC ? (
                            <form onSubmit={submitPCMaintenance} style={{ padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                                <p style={{ marginTop: 0, fontSize: '14px', color: '#64748b' }}>Why is PC {selectedPC.pc_number} broken?</p>
                                <input type="text" placeholder="Reason (e.g. Broken Monitor)" value={pcReason} onChange={(e) => setPcReason(e.target.value)} required style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" onClick={() => setSelectedPC(null)} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ flex: 1, backgroundColor: '#dc2626', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Click a PC to toggle its status. Red PCs are under maintenance.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
                                    {Array.isArray(computers) && computers.map(pc => (
                                        <button type="button" key={pc.id} onClick={() => handlePCClick(pc)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 8px', borderRadius: '8px', cursor: 'pointer', border: pc.is_maintenance ? '2px solid #dc2626' : '2px solid #e2e8f0', backgroundColor: pc.is_maintenance ? '#f8d7da' : '#f8fafc', color: pc.is_maintenance ? '#dc2626' : '#334155' }}>
                                            <Monitor size={24} />
                                            <p style={{ margin: '8px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>PC {pc.pc_number}</p>
                                            {pc.is_maintenance && <span style={{ fontSize: '9px', marginTop: '4px', textAlign: 'center' }}>{pc.maintenance_reason}</span>}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="lab-management-content">
                <Card className="lab-management-stats lab-management-bookings" columns={3}>
                    <div className="lab-management-stats-icon-wrapper icon-door"><DoorOpen size={32}/></div>
                    <div className="lab-management-stats-title-number"><p>Total Laboratories</p><h2>{labs.length} Rooms</h2></div>
                </Card>
                <Card className="lab-management-stats lab-management-reservationsr" columns={3}>
                    <div className="lab-management-stats-icon-wrapper icon-monitor"><Monitor size={32}/></div>
                    <div className="lab-management-stats-title-number"><p>Total Computers</p><h2>{labs.reduce((total, lab) => total + Number(lab.computer_count), 0)} Units</h2></div>
                </Card>
                <Card className="lab-management-stats lab-management-utilization" columns={3}>
                    <div className="lab-management-stats-icon-wrapper icon-person"><User2 size={32} color="#00195c"/></div>
                    <div className="lab-management-stats-title-number"><p>Seating Capacity</p><h2>{labs.reduce((total, lab) => total + Number(lab.capacity), 0)} Persons</h2></div>
                </Card>
                <Card className="lab-management-stats lab-management-alerts" columns={3}>
                    <div className="lab-management-stats-icon-wrapper icon-wrench"><Wrench size={32}/></div>
                    <div className="lab-management-stats-title-number"><p>Pending Repairs</p><h2>{labs.filter(lab => lab.maintenance).length} Rooms</h2></div>
                </Card>

                {labs.map((lab) => (
                    <Card key={lab.id} className="lab-management-labcard" columns={4}>
                        <img src={PlaceholderLab}/>
                        <div className="lab-management-labcard-info">
                            <div className="lab-management-labcard-info-title">
                                <h2>{lab.name}</h2>
                                <div className="lab-management-labcard-info-title-location"><MapPin /><p>{lab.location}</p></div>
                            </div>
                            <div className="lab-management-labcard-info-capacity">
                                <div className="lab-management-labcard-info-capacity-item"><p>CAPACITY</p><h2>{lab.capacity}</h2></div>
                                <div className="lab-management-labcard-info-capacity-item"><p>PCS</p><h2>{lab.computer_count}</h2></div>
                            </div>
                            <div className="lab-management-labcard-info-diag">
                                <p>Whole Room Maintenance</p>
                                <Toggle checked={lab.maintenance} onChange={() => handleToggleMaintenance(lab)} />
                            </div>
                            {lab.maintenance && (
                                <div style={{fontSize: '11px', color: '#dc2626', backgroundColor: '#f8d7da', padding: '8px', borderRadius: '4px', width: '100%', boxSizing: 'border-box'}}>
                                    <strong>Reason:</strong> {lab.maintenance_reason} <br/>
                                    <strong>Until:</strong> {lab.maintenance_until ? new Date(lab.maintenance_until).toLocaleString() : "TBD"}
                                </div>
                            )}
                            <button onClick={() => openPCLayout(lab)} style={{marginTop: '10px', padding: '8px', backgroundColor: '#00195c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>View PC Layout</button>
                            <button type="button" className="lab-management-labcard-info-diag-edit" onClick={() => handleEditClick(lab)}><Pen /><p>Edit Details</p></button>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    )
}

export default LabManagement