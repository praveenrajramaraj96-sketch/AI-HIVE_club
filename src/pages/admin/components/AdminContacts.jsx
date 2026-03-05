import React, { useState, useEffect } from 'react';
import { Mail, Trash2, Loader2, MessageSquare, ExternalLink } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import './AdminContacts.css';

const AdminContacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setContacts(data);
        } catch (err) {
            console.error("Error fetching contacts", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const markAsRead = async (id, currentStatus) => {
        if (currentStatus === 'Read') return;
        try {
            await updateDoc(doc(db, "contacts", id), { status: 'Read' });
            fetchContacts();
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            await deleteDoc(doc(db, "contacts", id));
            fetchContacts();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="admin-contacts-page">
            <div className="page-header">
                <div>
                    <h2>Student Inquiries</h2>
                    <p>View and manage questions sent from the student portal.</p>
                </div>
            </div>

            <div className="contacts-list">
                {loading ? (
                    <div className="loading-state glass-panel"><Loader2 className="spinner" /> Loading messages...</div>
                ) : contacts.length === 0 ? (
                    <div className="empty-state glass-panel">
                        <MessageSquare size={40} className="icon-muted" />
                        <p>No messages received yet.</p>
                    </div>
                ) : (
                    <div className="contacts-grid">
                        {contacts.map(c => (
                            <div key={c.id} className={`glass-panel contact-item ${c.status === 'Unread' ? 'unread' : ''}`}>
                                <div className="contact-head">
                                    <div className="contact-meta">
                                        <span className={`status-pill ${c.status === 'Unread' ? 'pill-new' : 'pill-read'}`}>
                                            {c.status}
                                        </span>
                                        <span className="contact-time">{formatDate(c.createdAt)}</span>
                                    </div>
                                    <div className="contact-actions">
                                        {c.status === 'Unread' && (
                                            <button className="btn-secondary btn-sm" onClick={() => markAsRead(c.id, c.status)}>
                                                Mark Read
                                            </button>
                                        )}
                                        <button className="icon-btn btn-danger" onClick={() => handleDelete(c.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="contact-body">
                                    <h3>{c.subject}</h3>
                                    <p className="contact-from">From: <strong>{c.studentEmail}</strong></p>
                                    <div className="contact-message">
                                        {c.message}
                                    </div>
                                </div>
                                <div className="contact-footer">
                                    <a href={`mailto:${c.studentEmail}?subject=Re: ${c.subject}`} className="btn-primary btn-sm">
                                        <Mail size={14} /> Reply via Email
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminContacts;
