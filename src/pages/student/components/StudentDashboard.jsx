import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Award, Bell, Loader2 } from 'lucide-react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import './StudentDashboard.css';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [stats, setStats] = useState({ attended: 0, certificates: 0, status: 'Active' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch Events (limit visually later)
                const eventsSnap = await getDocs(collection(db, "events"));
                const evts = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                evts.sort((a, b) => new Date(a.date) - new Date(b.date));
                setEvents(evts.slice(0, 2)); // Only show next 2

                // Fetch Announcements
                const annSnap = await getDocs(collection(db, "announcements"));
                const anns = annSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                anns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setAnnouncements(anns.slice(0, 3)); // Only show latest 3

                // Fetch Student stats
                if (auth.currentUser) {
                    const userEmail = auth.currentUser.email;

                    // 1. Get real account status (Active/Pending) from students collection
                    const q = query(collection(db, "students"), where("email", "==", userEmail));
                    const studentSnap = await getDocs(q);
                    let accountStatus = 'Active';
                    if (!studentSnap.empty) {
                        accountStatus = studentSnap.docs[0].data().status || 'Active';
                    }

                    // 2. Get registration count
                    const regQ = query(collection(db, "event_registrations"), where("email", "==", userEmail));
                    const regSnap = await getDocs(regQ);
                    const completedEventCount = regSnap.size;

                    // 3. Get certificate count
                    const certQ = query(collection(db, "achievements"), where("studentEmail", "==", userEmail));
                    const certSnap = await getDocs(certQ);
                    const certificateCount = certSnap.size;

                    setStats({
                        attended: completedEventCount,
                        certificates: certificateCount,
                        status: accountStatus
                    });
                }

            } catch (error) {
                console.error("Error fetching dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatEventMonth = (dateStr) => {
        return new Date(dateStr).toLocaleString('default', { month: 'short' }).toUpperCase();
    };

    const formatEventDay = (dateStr) => {
        return new Date(dateStr).getDate();
    };

    const timeAgo = (dateStr) => {
        const diff = new Date() - new Date(dateStr);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        return days === 1 ? 'Yesterday' : `${days} days ago`;
    };

    return (
        <div className="student-dashboard">
            <div className="welcome-banner glass-panel">
                <div className="banner-content">
                    <h1>Welcome back, Explorer! 👋</h1>
                    <p>Ready to dive into the world of AI today? Check out the upcoming events and latest announcements.</p>
                </div>
                <div className="banner-action">
                    <button className="btn-primary" onClick={() => navigate('/student/achievements')}>View My Certificates</button>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="glass-panel section-card">
                    <div className="section-header">
                        <h3><Calendar size={20} className="icon-blue" /> Upcoming Events</h3>
                        <button className="btn-link" onClick={() => navigate('/student/events')}>See all</button>
                    </div>
                    <div className="event-list">
                        {loading ? (
                            <Loader2 className="spinner" size={24} style={{ margin: 'auto' }} />
                        ) : events.length === 0 ? (
                            <p className="text-muted" style={{ padding: '1rem', textAlign: 'center' }}>No upcoming events.</p>
                        ) : events.map(evt => (
                            <div className="event-item" key={evt.id}>
                                <div className="event-date">
                                    <span className="month">{formatEventMonth(evt.date)}</span>
                                    <span className="day">{formatEventDay(evt.date)}</span>
                                </div>
                                <div className="event-details">
                                    <h4>{evt.title}</h4>
                                    <p className="dashboard-event-desc">{evt.description}</p>
                                </div>
                                <button className="btn-secondary btn-sm" disabled>Register</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel section-card announcements-card">
                    <div className="section-header">
                        <h3><Bell size={20} className="icon-amber" /> Recent Announcements</h3>
                    </div>
                    <div className="announcement-list">
                        {loading ? (
                            <Loader2 className="spinner" size={24} style={{ margin: 'auto' }} />
                        ) : announcements.length === 0 ? (
                            <p className="text-muted" style={{ padding: '1rem', textAlign: 'center' }}>No announcements to show.</p>
                        ) : announcements.map(ann => (
                            <div className="announcement-item" key={ann.id}>
                                <div className={`announcement-badge ${ann.type === 'New' ? 'new' : ''}`}>{ann.type}</div>
                                <p>{ann.content}</p>
                                <span className="time">{timeAgo(ann.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel section-card progress-card">
                    <div className="section-header">
                        <h3><Award size={20} className="icon-purple" /> My Progress</h3>
                    </div>
                    <div className="progress-content">
                        <div className="progress-stat">
                            <div className="stat-circle">
                                <span>{loading ? '...' : stats.attended}</span>
                            </div>
                            <p>Events Registered</p>
                        </div>
                        <div className="progress-stat">
                            <div className="stat-circle">
                                <span>{loading ? '...' : stats.certificates}</span>
                            </div>
                            <p>Certificates</p>
                        </div>
                        <div className="progress-stat">
                            <div className="stat-circle status-circle">
                                <span style={{ fontSize: '1rem', color: '#10b981' }}>{loading ? '...' : stats.status}</span>
                            </div>
                            <p>Status</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
