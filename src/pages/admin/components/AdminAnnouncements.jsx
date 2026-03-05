import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Loader2 } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import './AdminAnnouncements.css';

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [content, setContent] = useState('');
    const [type, setType] = useState('New'); // New, Update, Alert

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "announcements"));
            const announcementsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by createdAt descending
            announcementsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAnnouncements(announcementsData);
        } catch (error) {
            console.error("Error fetching announcements:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        if (!content) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, "announcements"), {
                content,
                type,
                createdAt: new Date().toISOString()
            });
            setContent('');
            setType('New');
            fetchAnnouncements();
        } catch (error) {
            console.error("Error adding announcement:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        try {
            await deleteDoc(doc(db, "announcements", id));
            fetchAnnouncements();
        } catch (error) {
            console.error("Error deleting announcement:", error);
        }
    };

    // Helper to format date
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="admin-announcements-page">
            <div className="page-header">
                <div>
                    <h2>Announcements Dashboard</h2>
                    <p>Broadcast updates, alerts, and news to all students.</p>
                </div>
            </div>

            <div className="announcements-grid">
                {/* Create Form */}
                <div className="glass-panel form-card">
                    <h3><Bell size={18} className="icon-amber" /> Create Announcement</h3>
                    <form className="admin-form" onSubmit={handleCreateAnnouncement}>
                        <div className="input-group">
                            <label className="input-label">Announcement Type</label>
                            <select
                                className="input-base select-base"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="New">New Label (Green)</option>
                                <option value="Update">Update Label (Blue/Grey)</option>
                                <option value="Alert">Alert Label (Red)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Message Content</label>
                            <textarea
                                className="input-base textarea-base"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Type the announcement details here..."
                                rows="4"
                                required
                            ></textarea>
                        </div>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? <Loader2 size={18} className="spinner" /> : <Plus size={18} />}
                            {submitting ? 'Posting...' : 'Post Announcement'}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="glass-panel list-card">
                    <h3>Recent Broadcasts</h3>
                    {loading ? (
                        <div className="loading-state"><Loader2 size={24} className="spinner" /> Loading broadcasts...</div>
                    ) : announcements.length === 0 ? (
                        <div className="empty-state">No announcements posted yet.</div>
                    ) : (
                        <div className="announcement-blocks">
                            {announcements.map(item => (
                                <div key={item.id} className="admin-announcement-item">
                                    <div className="ann-header">
                                        <span className={`ann-badge badge-${item.type.toLowerCase()}`}>{item.type}</span>
                                        <span className="ann-date">{formatDate(item.createdAt)}</span>
                                    </div>
                                    <p className="ann-body">{item.content}</p>
                                    <div className="ann-actions">
                                        <button
                                            className="icon-btn btn-danger"
                                            onClick={() => handleDeleteAnnouncement(item.id)}
                                            title="Delete Announcement"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAnnouncements;
