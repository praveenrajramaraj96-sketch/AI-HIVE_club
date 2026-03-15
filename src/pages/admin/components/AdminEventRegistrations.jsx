import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Download, ArrowLeft, Loader2, CheckCircle, XCircle, ExternalLink, QrCode } from 'lucide-react';
import { db } from '../../../firebase';
import './AdminEventRegistrations.css';

const AdminEventRegistrations = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [registrations, setRegistrations] = useState([]);
    const [eventTitle, setEventTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [imageViewer, setImageViewer] = useState(null); // stores the base64 string to view

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            // Get event title
            const eventDoc = await getDoc(doc(db, "events", eventId));
            if (eventDoc.exists()) {
                setEventTitle(eventDoc.data().title);
            }

            // Get registrations
            const q = query(collection(db, "event_registrations"), where("eventId", "==", eventId));
            const querySnapshot = await getDocs(q);
            const regsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by latest
            regsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setRegistrations(regsData);
        } catch (error) {
            console.error("Error fetching registrations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (eventId) {
            fetchRegistrations();
        }
    }, [eventId]);

    const handleUpdateStatus = async (id, status) => {
        if (!window.confirm(`Are you sure you want to mark this as ${status}?`)) return;
        setProcessingId(id);
        try {
            await updateDoc(doc(db, "event_registrations", id), {
                status: status
            });
            await fetchRegistrations(); // Refresh list
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error updating status.");
        } finally {
            setProcessingId(null);
        }
    };

    const exportToCSV = () => {
        if (registrations.length === 0) return;

        // Extract all dynamic custom field keys across all registrations
        const customFieldKeys = new Set();
        registrations.forEach(reg => {
            if (reg.extraDetails) {
                Object.keys(reg.extraDetails).forEach(key => customFieldKeys.add(key));
            }
        });
        const dynamicHeaders = Array.from(customFieldKeys);

        // Standard CSV Headers
        const headers = ["Name", "Email", "Phone", "Is Club Member", "Status", "Ticket ID", "Attendance", "Submission Date", "Proof URL", ...dynamicHeaders];

        // Escape CSV helper
        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '""';
            const strValue = String(value);

            // Prevent massive Base64 Image Strings from crashing the Excel Export
            if (strValue.startsWith('data:image/')) {
                return '"[Attached Image]"';
            }

            if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
                return `"${strValue.replace(/"/g, '""')}"`;
            }
            return strValue;
        };

        const csvRows = [
            headers.join(','), // Header row
            ...registrations.map(reg => {
                const date = new Date(reg.createdAt).toLocaleDateString() + ' ' + new Date(reg.createdAt).toLocaleTimeString();

                // Base data
                const baseInfo = [
                    reg.name,
                    reg.email,
                    reg.phone,
                    reg.isMember ? "Yes" : "No",
                    reg.status || 'Pending',
                    reg.ticketId || 'N/A',
                    reg.checkedIn ? "Present" : "Absent",
                    date,
                    reg.proofUrl || 'No Link'
                ].map(escapeCSV);

                // Dynamic data
                const dynamicInfo = dynamicHeaders.map(key => {
                    const val = (reg.extraDetails && reg.extraDetails[key]) ? reg.extraDetails[key] : '';
                    return escapeCSV(val);
                });

                return [...baseInfo, ...dynamicInfo].join(',');
            })
        ];

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);

        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${eventTitle || 'Event'}_Registrations.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="admin-events-page">
            <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                <button className="btn-secondary" onClick={() => navigate('/admin/events')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    <ArrowLeft size={18} /> Back to Events
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                        <h2>{eventTitle} - Registrations</h2>
                        <p>Manage and review all attendees for this event.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-secondary" onClick={() => navigate(`/admin/events/${eventId}/scanner`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <QrCode size={18} /> Open Scanner
                        </button>
                        <button className="btn-primary" onClick={exportToCSV} disabled={registrations.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={18} /> Export Excel (CSV)
                        </button>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto', padding: '1.5rem', marginTop: '1rem' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <Loader2 className="spinner" size={30} color="var(--pk-primary)" />
                    </div>
                ) : registrations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No registrations received yet.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Name</th>
                                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Contact</th>
                                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Status / Role</th>
                                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Ticket ID</th>
                                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Attendance</th>
                                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Dynamic Info</th>
                                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Payment Proof</th>
                                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrations.map(reg => (
                                <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{reg.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(reg.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <span>{reg.email}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>{reg.phone}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                background: reg.isMember ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                                color: reg.isMember ? '#60A5FA' : 'var(--text-secondary)'
                                            }}>
                                                {reg.isMember ? 'AI-Hive Member' : 'Guest'}
                                            </span>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                background: reg.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : reg.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                color: reg.status === 'Approved' ? 'var(--pk-success)' : reg.status === 'Rejected' ? 'var(--pk-danger)' : '#F59E0B'
                                            }}>
                                                {reg.status || 'Pending'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.4rem', borderRadius: '0.3rem', fontSize: '0.75rem' }}>{reg.ticketId}</code>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.75rem',
                                            background: reg.checkedIn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                            color: reg.checkedIn ? 'var(--pk-success)' : 'var(--text-muted)'
                                        }}>
                                            {reg.checkedIn ? 'Checked In' : 'Not Present'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', maxWidth: '250px' }}>
                                        {reg.extraDetails && Object.keys(reg.extraDetails).length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
                                                {Object.entries(reg.extraDetails).map(([key, value]) => (
                                                    <div key={key}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>{key}: </span>
                                                        {(typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image/'))) ? (
                                                            <button
                                                                onClick={() => setImageViewer(value)}
                                                                className="btn-secondary"
                                                                style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', display: 'inline-block' }}
                                                            >
                                                                View Item
                                                            </button>
                                                        ) : (
                                                            <span>{value}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No extras</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        {reg.proofUrl && (
                                            <button
                                                onClick={() => setImageViewer(reg.proofUrl)}
                                                className="btn-secondary"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                            >
                                                <ExternalLink size={14} /> View Proof
                                            </button>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                        {processingId === reg.id ? (
                                            <Loader2 className="spinner" size={20} />
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                {reg.status !== 'Approved' && (
                                                    <button
                                                        className="icon-btn"
                                                        style={{ color: 'var(--pk-success)', background: 'rgba(16, 185, 129, 0.1)' }}
                                                        onClick={() => handleUpdateStatus(reg.id, 'Approved')}
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                {reg.status !== 'Rejected' && (
                                                    <button
                                                        className="icon-btn"
                                                        style={{ color: 'var(--pk-danger)', background: 'rgba(239, 68, 68, 0.1)' }}
                                                        onClick={() => handleUpdateStatus(reg.id, 'Rejected')}
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Image Viewer Pop-Up Modal */}
            {imageViewer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '90%', maxHeight: '90%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                        <button onClick={() => setImageViewer(null)} className="icon-btn btn-danger" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1rem' }}>
                            <XCircle size={18} /> Close Window
                        </button>
                        <div style={{ overflow: 'auto', flex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
                            {imageViewer.startsWith('http') ? (
                                <img src={imageViewer} alt="Uploaded Item" style={{ maxWidth: '100%', objectFit: 'contain', borderRadius: '0.5rem' }} />
                            ) : (
                                <img src={imageViewer} alt="Attached Base64 Item" style={{ maxWidth: '100%', objectFit: 'contain', borderRadius: '0.5rem' }} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEventRegistrations;
