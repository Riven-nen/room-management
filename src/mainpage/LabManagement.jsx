import {DoorOpen, Monitor, User2, Wrench, PlusCircle, ListFilter, MapPin, Pen, Trash2} from 'lucide-react'
import "./LabManagement.css"
import Card from "./Card"
import PlaceholderLab from "../assets/placeholder-lab.jpg"
import Toggle from "../layout/Toggle.jsx"
import Modal from "../layout/Modal.jsx"
import {useState, useContext} from 'react'
import {UserContext} from "../auth/UserContext.jsx"

function LabManagement() {
    const [showModal, setShowModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)

    const {labs, setLabs} = useContext(UserContext)

    const [roomName, setRoomName] = useState("")
    const [roomBuilding, setRoomBuilding] = useState("")
    const [roomCapacity, setRoomCapacity] = useState("")
    const [roomPCS, setRoomPCS] = useState("")

    const [editRoom, setEditRoom] = useState("")
    const [editRoomName, setEditRoomName] = useState("")
    const [editRoomBuilding, setEditRoomBuilding] = useState("")
    const [editRoomCapacity, setEditRoomCapacity] = useState("")
    const [editRoomPCS, setEditRoomPCS] = useState("")

    const handleSubmit = async (event) => {
        event.preventDefault()

        const response = await fetch("http://localhost:3000/api/lab/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                roomName,
                roomBuilding,
                roomCapacity,
                roomPCS
            })
        })

        if (response.ok) {
            const labsResponse = await fetch("http://localhost:3000/api/lab/all", {
                credentials: "include"
            })

            const data = await labsResponse.json()

            setLabs(data.labs)

            setShowModal(false)
            setRoomName("")
            setRoomBuilding("")
            setRoomCapacity("")
            setRoomPCS("")
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
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                roomName: editRoom,
                newRoomName: editRoomName,
                roomBuilding: editRoomBuilding,
                roomCapacity: editRoomCapacity,
                roomPCS: editRoomPCS
            })
        })

        if (response.ok) {
            const labsResponse = await fetch("http://localhost:3000/api/lab/all", {
                credentials: "include"
            })

            const data = await labsResponse.json()

            setLabs(data.labs)
            setEditRoom(editRoomName)
            setShowEditModal(false)
        }
    }

    const handleDelete = async () => {
        const response = await fetch("http://localhost:3000/api/lab/delete", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                roomName: editRoom
            })
        })

        if (response.ok) {
            const labsResponse = await fetch("http://localhost:3000/api/lab/all", {
                credentials: "include"
            })

            const data = await labsResponse.json()

            setLabs(data.labs)
            setShowEditModal(false)
        }
    }

    return (
        <>
            <div className="lab-management-title">
                <div className="lab-management-title-left">
                    <label htmlFor="lab-management-title-text">
                        Facility Overview
                    </label>

                    <h1 id="lab-management-title-text">
                        Computer Laboratory Status
                    </h1>
                </div>

                <div className="lab-management-title-right">
                    <button className="lab-management-title-filter">
                        <ListFilter size={20} strokeWidth={3} />
                        Filter
                    </button>

                    <button
                        type="button"
                        className="lab-management-title-register"
                        onClick={() => setShowModal(true)}
                    >
                        <PlusCircle size={20} strokeWidth={3} />
                        Register New Lab
                    </button>
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Register New Lab"
            >
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Room number"
                        id="room-name"
                        value={roomName}
                        onChange={(event) => setRoomName(event.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Building"
                        id="room-building"
                        value={roomBuilding}
                        onChange={(event) => setRoomBuilding(event.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Capacity"
                        id="room-capacity"
                        value={roomCapacity}
                        onChange={(event) => setRoomCapacity(event.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Available PCs"
                        id="room-pcs"
                        value={roomPCS}
                        onChange={(event) => setRoomPCS(event.target.value)}
                    />

                    <button type="submit">
                        Add Room
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Lab"
            >
                <form onSubmit={handleEditSubmit}>
                    <input
                        type="text"
                        placeholder="Room number"
                        value={editRoomName}
                        onChange={(event) => setEditRoomName(event.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Building"
                        value={editRoomBuilding}
                        onChange={(event) => setEditRoomBuilding(event.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Capacity"
                        value={editRoomCapacity}
                        onChange={(event) => setEditRoomCapacity(event.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Available PCs"
                        value={editRoomPCS}
                        onChange={(event) => setEditRoomPCS(event.target.value)}
                    />

                    <button type="submit">
                        Save Changes
                    </button>

                    <button
                        type="button"
                        className="lab-management-delete"
                        onClick={handleDelete}
                    >
                        <Trash2/>
                        Delete Lab
                    </button>
                </form>
            </Modal>

            <div className="lab-management-content">
                <Card className="lab-management-stats lab-management-bookings" columns={3}>
                    <div className="lab-management-stats-icon-wrapper icon-door">
                        <DoorOpen size={32}/>
                    </div>

                    <div className="lab-management-stats-title-number">
                        <p>Total Laboratories</p>
                        <h2>{labs.length} Rooms</h2>
                    </div>
                </Card>

                <Card className="lab-management-stats lab-management-reservationsr" columns={3}>
                    <div className="lab-management-stats-icon-wrapper icon-monitor">
                        <Monitor size={32}/>
                    </div>

                    <div className="lab-management-stats-title-number">
                        <p>Total Computers</p>
                        <h2>
                            {labs.reduce((total, lab) => total + Number(lab.computer_count), 0)} Units
                        </h2>
                    </div>
                </Card>

                <Card className="lab-management-stats lab-management-utilization" columns={3}>
                    <div className="lab-management-stats-icon-wrapper icon-person">
                        <User2 size={32} color="#00195c"/>
                    </div>

                    <div className="lab-management-stats-title-number">
                        <p>Seating Capacity</p>
                        <h2>
                            {labs.reduce((total, lab) => total + Number(lab.capacity), 0)} Persons
                        </h2>
                    </div>
                </Card>

                <Card className="lab-management-stats lab-management-alerts" columns={3}>
                    <div className="lab-management-stats-icon-wrapper icon-wrench">
                        <Wrench size={32}/>
                    </div>

                    <div className="lab-management-stats-title-number">
                        <p>Pending Repairs</p>
                        <h2>0 Items</h2>
                    </div>
                </Card>

                {labs.map((lab) => (
                    <Card
                        key={lab.id}
                        className="lab-management-labcard"
                        columns={4}
                    >
                        <img src={PlaceholderLab}/>

                        <div className="lab-management-labcard-info">
                            <div className="lab-management-labcard-info-title">
                                <h2>{lab.name}</h2>

                                <div className="lab-management-labcard-info-title-location">
                                    <MapPin/>
                                    <p>{lab.location}</p>
                                </div>
                            </div>

                            <div className="lab-management-labcard-info-capacity">
                                <div className="lab-management-labcard-info-capacity-item">
                                    <p>CAPACITY</p>
                                    <h2>{lab.capacity}</h2>
                                </div>

                                <div className="lab-management-labcard-info-capacity-item">
                                    <p>PCS</p>
                                    <h2>{lab.computer_count}</h2>
                                </div>
                            </div>

                            <div className="lab-management-labcard-info-diag">
                                <p>Maintenance</p>
                                <Toggle/>

                                <button
                                    type="button"
                                    className="lab-management-labcard-info-diag-edit"
                                    onClick={() => handleEditClick(lab)}
                                >
                                    <Pen/>
                                    <p>Edit Details</p>
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    )
}

export default LabManagement