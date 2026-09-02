import './Announcements.css'
import {AudioLines, Lightbulb, ListFilter, PlusCircle, TrendingUp} from 'lucide-react'
import Card from './Card.jsx';
import Table from '../layout/Table.jsx';

const announcementColumns = [
    { key: 'title', label: 'Title' },
    { key: 'date', label: 'Date' },
    { key: 'target', label: 'Target' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
]

// TEST DATA
const announcements = [
    {
        title: 'Server Maintenance Schedule',
        date: 'Feb 21, 2026',
        target: 'ALL',
        status: 'Published',
        actions: '...'
    },
    {
        title: 'New AI Research Lab Opening',
        date: 'Feb 22, 2026',
        target: 'STUDENTS',
        status: 'Draft',
        actions: '...'
    },
]

function Announcements() {
    return (
        <>
            <div className="announcement-title">
                <div className="announcement-title-left">
                    <h1 id="announcement-title-text">System Wide Announcements</h1>
                    <label for="announcement-title-text">Broadcast critical updates and news to the LCUP academic community.</label>
                </div>


                <button className="announcement-title-register"> <PlusCircle size={20} strokeWidth={3}/> Create Announcement</button>
            </div>

            <div className="announcement-content">
                <Card className="announcement-content-stats">
                    <div className="announcement-content-stats-title">
                        <p>TOTAL ACTIVE</p>
                        <AudioLines/>
                    </div>
                    <h1> 12 </h1>
                    <div className="announcement-content-stats-flavortext total-active">
                        <TrendingUp/>
                        <p> 2 new this week </p>
                    </div>
                </Card>
                
                <Card className="announcement-content-stats">
                    <div className="announcement-content-stats-title">
                        <p>DRAFTS PENDING</p>
                        <AudioLines/>
                    </div>
                    <h1> 5 </h1>
                    <div className="announcement-content-stats-flavortext">
                        <p> Requires review before publishing </p>
                    </div>
                </Card>

                <Card className="announcement-content-stats">
                    <div className="announcement-content-stats-title">
                        <p>AUDIENCE REACH</p>
                        <AudioLines/>
                    </div>
                    <h1> 2483 </h1>
                    <div className="announcement-content-stats-flavortext">
                        <p> Total recipients reached today</p>
                    </div>
                </Card>

                <Card className="announcement-content-table" columns={2} rows={3}>
                    <div className="announcement-content-table-title">
                        <h1> Recent Announcements </h1>
                        <ListFilter/>
                    </div>
                    
                    <Table columns={announcementColumns} data={announcements}/>
                </Card>

                <Card className="announcement-content-drafts" rows={3}>
                    <h1> Drafts & Ideas</h1>

                    <div className="announcement-content-drafts-items">
                        <div className="announcement-content-drafts-item"> 
                            <div className="announcement-content-drafts-item-status">
                                <p> UNFINISHED </p>
                                <p> <span>Last Edit: 2h ago</span> </p>
                            </div>
                            <p className="announcement-content-drafts-item-title">
                                Annual System Audit 2024
                            </p>
                            <p className="announcement-content-drafts-item-text">
                                Draft for the upcoming system audit procedure for all laboratories in La Consolacion University Philippines.
                            </p>
                        </div>

                        <div className="announcement-content-drafts-item"> 
                            <div className="announcement-content-drafts-item-status">
                                <p> UNFINISHED </p>
                                <p> <span>Last Edit: 2h ago</span> </p>
                            </div>
                            <p className="announcement-content-drafts-item-title">
                                Annual System Audit 2024
                            </p>
                            <p className="announcement-content-drafts-item-text">
                                Draft for the upcoming system audit procedure for all laboratories in La Consolacion University Philippines.
                            </p>
                        </div>
                    </div>

                    <button className="announcement-content-drafts-viewall">
                        View All Drafts 
                    </button>

                    <div className="announcement-content-drafts-tip">
                        <div className="announcement-content-drafts-tip-title">
                            <Lightbulb color="yellow"/>
                            <p>Pro Tip</p>
                        </div>
                        <p>
                            Use targeted announcements to reduce information fatigue for students who aren't affected by lab-specific updates.
                        </p>
                    </div>
                </Card>
            </div>
        </>
    )
}

export default Announcements