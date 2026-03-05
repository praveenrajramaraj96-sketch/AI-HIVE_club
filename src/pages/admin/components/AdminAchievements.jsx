import React, { useState, useEffect } from 'react';
import { Award, Plus, Loader2, Trash2, Mail } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import './AdminAchievements.css';

const AdminAchievements = () => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [studentEmail, setStudentEmail] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [certificateUrl, setCertificateUrl] = useState('');

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "achievements"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAchievements(data);
        } catch (err) {
            console.error("Error fetching achievements", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAchievements();
    }, []);

    const handleIssue = async (e) => {
        e.preventDefault();
        if (!studentEmail || !title) return;
        setSubmitting(true);

        try {
            await addDoc(collection(db, "achievements"), {
                studentEmail,
                title,
                description,
                date,
                certificateUrl,
                createdAt: new Date().toISOString()
            });

            setStudentEmail('');
            setTitle('');
            setDescription('');
            setCertificateUrl('');
            fetchAchievements();
            alert("Achievement issued successfully!");
        } catch (err) {
            console.error("Error issuing achievement", err);
            alert("Error: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this achievement?")) return;
        try {
            await deleteDoc(doc(db, "achievements", id));
            fetchAchievements();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    return (
        <div className="admin-achievements-page">
            <div className="page-header">
                <div>
                    <h2>Achievements & Certificates</h2>
                    <p>Issue digital certificates and milestones to students.</p>
                </div>
            </div>

            <div className="admin-grid">
                <div className="glass-panel form-card">
                    <h3>Issue New Achievement</h3>
                    <form className="admin-form" onSubmit={handleIssue}>
                        <div className="input-group">
                            <label className="input-label">Student Email</label>
                            <div className="input-with-icon">
                                <Mail size={16} className="icon-muted" />
                                <input
                                    type="email"
                                    className="input-base"
                                    placeholder="student@aihive.edu"
                                    value={studentEmail}
                                    onChange={e => setStudentEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Title / Milestone</label>
                            <input
                                type="text"
                                className="input-base"
                                placeholder="e.g. AI Hackathon Winner"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Certificate URL (Image/PDF)</label>
                            <input
                                type="url"
                                className="input-base"
                                placeholder="Link to digital certificate"
                                value={certificateUrl}
                                onChange={e => setCertificateUrl(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Short Description</label>
                            <textarea
                                className="input-base"
                                rows="2"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            ></textarea>
                        </div>

                        <button type="submit" className="btn-primary w-full" disabled={submitting}>
                            {submitting ? <Loader2 className="spinner" size={18} /> : <Plus size={18} />}
                            {submitting ? 'Issuing...' : 'Issue Achievement'}
                        </button>
                    </form>
                </div>

                <div className="glass-panel list-card">
                    <h3>Recent Issues</h3>
                    {loading ? (
                        <div className="loading-state"><Loader2 className="spinner" /></div>
                    ) : achievements.length === 0 ? (
                        <div className="empty-state">No achievements recorded.</div>
                    ) : (
                        <div className="record-list">
                            {achievements.map(ach => (
                                <div key={ach.id} className="record-item">
                                    <div className="record-icon">
                                        <Award size={20} className="icon-purple" />
                                    </div>
                                    <div className="record-info">
                                        <h4>{ach.title}</h4>
                                        <p>{ach.studentEmail}</p>
                                        <span className="record-date">{ach.date}</span>
                                    </div>
                                    <button className="icon-btn btn-danger" onClick={() => handleDelete(ach.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAchievements;
