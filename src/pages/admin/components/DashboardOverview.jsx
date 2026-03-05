import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Megaphone, Activity, Loader2 } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import './DashboardOverview.css';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className={`glass-panel stat-card ${colorClass}`}>
        <div className="stat-icon-wrapper">
            <Icon size={24} />
        </div>
        <div className="stat-content">
            <h3>{value}</h3>
            <p>{title}</p>
        </div>
    </div>
);

const DashboardOverview = () => {
    const navigate = useNavigate();
    const [counts, setCounts] = useState({ events: 0, announcements: 0, gallery: 0, students: 0 });
    const [recentMessages, setRecentMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [eventsRes, announceRes, galleryRes, studentsRes] = await Promise.allSettled([
                    getDocs(collection(db, "events")),
                    getDocs(collection(db, "announcements")),
                    getDocs(collection(db, "gallery")),
                    getDocs(collection(db, "students"))
                ]);

                // Fetch real recent messages
                const msgQuery = query(collection(db, "contacts"), orderBy("createdAt", "desc"), limit(3));
                const msgSnap = await getDocs(msgQuery);
                const msgs = msgSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecentMessages(msgs);

                setCounts({
                    events: eventsRes.status === 'fulfilled' ? eventsRes.value.size : 0,
                    announcements: announceRes.status === 'fulfilled' ? announceRes.value.size : 0,
                    gallery: galleryRes.status === 'fulfilled' ? galleryRes.value.size : 0,
                    students: studentsRes.status === 'fulfilled' ? studentsRes.value.size : 0
                });
            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="dashboard-overview">
            <div className="stats-grid">
                <StatCard title="Total Students" value={loading ? "..." : counts.students} icon={Users} colorClass="primary-glow" />
                <StatCard title="Total Events" value={loading ? "..." : counts.events} icon={Calendar} colorClass="secondary-glow" />
                <StatCard title="Gallery Items" value={loading ? "..." : counts.gallery} icon={Activity} colorClass="accent-glow" />
                <StatCard title="Announcements" value={loading ? "..." : counts.announcements} icon={Megaphone} colorClass="success-glow" />
            </div>

            <div className="dashboard-content-grid">
                <div className="glass-panel recent-activity">
                    <h3>Recent Messages</h3>
                    <ul className="activity-list">
                        {loading ? (
                            <li className="text-muted">Loading messages...</li>
                        ) : recentMessages.length === 0 ? (
                            <li className="text-muted">No new inquiries.</li>
                        ) : recentMessages.map(msg => (
                            <li key={msg.id} onClick={() => navigate('/admin/contacts')} style={{ cursor: 'pointer' }}>
                                <div className="activity-icon">{msg.studentEmail.charAt(0).toUpperCase()}</div>
                                <div className="activity-details">
                                    <span className="activity-title">{msg.studentEmail}</span>
                                    <span className="activity-desc">{msg.subject}</span>
                                </div>
                                <span className={`status-tag ${msg.status === 'Unread' ? 'tag-new' : ''}`}>
                                    {msg.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="glass-panel quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="action-buttons">
                        <button className="btn-primary" onClick={() => navigate('/admin/events')}>Create Event</button>
                        <button className="btn-secondary" onClick={() => navigate('/admin/announcements')}>New Announcement</button>
                        <button className="btn-secondary" onClick={() => navigate('/admin/members')}>Review Members</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
