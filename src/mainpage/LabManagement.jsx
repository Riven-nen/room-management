import {DoorOpen, Monitor, User2, Wrench, PlusCircle, ListFilter, MapPin, Pen} from 'lucide-react'
import "./LabManagement.css"
import Card from "./Card"
import PlaceholderLab from "../assets/placeholder-lab.jpg"
import Toggle from "../layout/Toggle.jsx"

function LabManagement() {
    return (
        <>
            <div className="lab-management-title">
                <div className="lab-management-title-left">
                    <label for="lab-management-title-text">Facility Overview</label>
                    <h1 id="lab-management-title-text">Computer Laboratory Status</h1>
                </div>

                <div className="lab-management-title-right">
                    <button className="lab-management-title-filter"> <ListFilter size={20} strokeWidth={3}/> Filter </button>
                    <button className="lab-management-title-register"> <PlusCircle size={20} strokeWidth={3}/> Register New Lab</button>
                </div>
            </div>
            <div className="lab-management-content">
                <Card className="lab-management-stats lab-management-bookings" columns={3}> 
                    <div className="lab-management-stats-icon-wrapper icon-door">
                        <DoorOpen size={32}/>
                    </div>
                    <div className="lab-management-stats-title-number">
                        <p>Total Laboratories</p>
                        <h2>12 Rooms</h2>
                    </div>
                </Card>

                <Card className="lab-management-stats lab-management-reservationsr" columns={3}>
                    <div className="lab-management-stats-icon-wrapper icon-monitor"> 
                        <Monitor size={32}/>
                    </div>
                    <div className="lab-management-stats-title-number">
                        <p> Total Computers </p>
                        <h2> 1234 Units</h2>
                    </div>
                </Card>

                <Card className="lab-management-stats lab-management-utilization" columns={3}>
                    <div className="lab-management-stats-icon-wrapper icon-person"> 
                        <User2 size={32} color="#00195c"/>
                    </div>
                    <div className="lab-management-stats-title-number">
                        <p> Seating Capacity </p>
                        <h2> 123 Persons </h2>
                    </div>
                </Card>

                <Card className="lab-management-stats lab-management-alerts" columns={3}> 
                    <div className="lab-management-stats-icon-wrapper icon-wrench">
                        <Wrench size={32}/>
                    </div>
                    <div className="lab-management-stats-title-number">
                        <p> Pending Repairs </p>
                        <h2> 1234 Items </h2>
                    </div>
                </Card>

                <Card className="lab-management-labcard" columns={4}>
                    <img src={PlaceholderLab}/>
                    <div className="lab-management-labcard-info">
                        <div className="lab-management-labcard-info-title">
                            <h2> SA 304 </h2>
                            <div className="lab-management-labcard-info-title-location">
                                <MapPin/>
                                <p> St. Augustine Building</p>
                            </div>
                        </div>

                        <div className="lab-management-labcard-info-capacity">
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>CAPACITY</p>
                                <h2>50</h2>
                            </div>
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>PCS</p>
                                <h2>50</h2>
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

                <Card className="lab-management-labcard" columns={4}>
                    <img src={PlaceholderLab}/>
                    <div className="lab-management-labcard-info">
                        <div className="lab-management-labcard-info-title">
                            <h2> SA 304 </h2>
                            <div className="lab-management-labcard-info-title-location">
                                <MapPin/>
                                <p> St. Augustine Building</p>
                            </div>
                        </div>

                        <div className="lab-management-labcard-info-capacity">
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>CAPACITY</p>
                                <h2>50</h2>
                            </div>
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>PCS</p>
                                <h2>50</h2>
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

                <Card className="lab-management-labcard" columns={4}>
                    <img src={PlaceholderLab}/>
                    <div className="lab-management-labcard-info">
                        <div className="lab-management-labcard-info-title">
                            <h2> SA 304 </h2>
                            <div className="lab-management-labcard-info-title-location">
                                <MapPin/>
                                <p> St. Augustine Building</p>
                            </div>
                        </div>

                        <div className="lab-management-labcard-info-capacity">
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>CAPACITY</p>
                                <h2>50</h2>
                            </div>
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>PCS</p>
                                <h2>50</h2>
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
                
                <Card className="lab-management-labcard" columns={4}>
                    <img src={PlaceholderLab}/>
                    <div className="lab-management-labcard-info">
                        <div className="lab-management-labcard-info-title">
                            <h2> SA 304 </h2>
                            <div className="lab-management-labcard-info-title-location">
                                <MapPin/>
                                <p> St. Augustine Building</p>
                            </div>
                        </div>

                        <div className="lab-management-labcard-info-capacity">
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>CAPACITY</p>
                                <h2>50</h2>
                            </div>
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>PCS</p>
                                <h2>50</h2>
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

                <Card className="lab-management-labcard" columns={4}>
                    <img src={PlaceholderLab}/>
                    <div className="lab-management-labcard-info">
                        <div className="lab-management-labcard-info-title">
                            <h2> SA 304 </h2>
                            <div className="lab-management-labcard-info-title-location">
                                <MapPin/>
                                <p> St. Augustine Building</p>
                            </div>
                        </div>

                        <div className="lab-management-labcard-info-capacity">
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>CAPACITY</p>
                                <h2>50</h2>
                            </div>
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>PCS</p>
                                <h2>50</h2>
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

                <Card className="lab-management-labcard" columns={4}>
                    <img src={PlaceholderLab}/>
                    <div className="lab-management-labcard-info">
                        <div className="lab-management-labcard-info-title">
                            <h2> SA 304 </h2>
                            <div className="lab-management-labcard-info-title-location">
                                <MapPin/>
                                <p> St. Augustine Building</p>
                            </div>
                        </div>

                        <div className="lab-management-labcard-info-capacity">
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>CAPACITY</p>
                                <h2>50</h2>
                            </div>
                            <div className="lab-management-labcard-info-capacity-item">
                                <p>PCS</p>
                                <h2>50</h2>
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
            </div>
        </>
    )
}

export default LabManagement