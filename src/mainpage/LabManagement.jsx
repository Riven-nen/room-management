import {DoorOpen, Monitor, User2, Wrench, PlusCircle, ListFilter, MapPin, Pen} from 'lucide-react'
import "./LabManagement.css"
import Card from "./Card"
import PlaceholderLab from "../assets/placeholder-lab.jpg"
import Toggle from "../layout/Toggle.jsx"
import Modal from "../layout/Modal.jsx"
import {useEffect, useState} from 'react'

function LabManagement() {
    const [showModal, setShowModal] = useState(false)
    const [labs, setLabs] = useState([])

    const [roomName, setRoomName] = useState("")
    const [roomBuilding, setRoomBuilding] = useState("")
    const [roomCapacity, setRoomCapacity] = useState("")
    const [roomPCS, setRoomPCS] = useState("")

    const fetchLabs = async () => {
        const response = await fetch("http://localhost:3000/api/lab/get", {
            credentials: "include"
        })

        const data = await response.json()
        setLabs(data.labs)
        console.log(data.labs)
    }

    useEffect(() => {
        fetchLabs()
    }, [])

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
            setShowModal(false)

            setRoomName("")
            setRoomBuilding("")
            setRoomCapacity("")
            setRoomPCS("")

            fetchLabs()
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
                            {labs.reduce((total, lab) => total + Number(lab.pcs), 0)} Units
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

                                <div className="lab-management-labcard-info-diag-edit">
                                    <Pen/>
                                    <p>Edit Details</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    )
}

export default LabManagement