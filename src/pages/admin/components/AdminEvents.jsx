import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Trash2, Loader2, Link2, Check, X, Users } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
import { db } from '../../../firebase';
import './AdminEvents.css';

const AdminEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [memberPrice, setMemberPrice] = useState('');
    const [guestPrice, setGuestPrice] = useState('');

    // Custom Fields ("Google Forms" style)
    const [customFields, setCustomFields] = useState([]);
    const [newField, setNewField] = useState('');
    const [isNewFieldRequired, setIsNewFieldRequired] = useState(false);
    const [newFieldType, setNewFieldType] = useState('text');

    // QR Code for payment
    const [qrCodeFile, setQrCodeFile] = useState(null);

    const handleAddField = () => {
        if (newField.trim() !== '' && !customFields.find(f => (f.label ? f.label : f) === newField.trim())) {
            setCustomFields([...customFields, { label: newField.trim(), required: isNewFieldRequired, type: newFieldType }]);
            setNewField('');
            setIsNewFieldRequired(false);
            setNewFieldType('text');
        }
    };

    const handleRemoveField = (fieldLabelToRemove) => {
        setCustomFields(customFields.filter(f => (f.label ? f.label : f) !== fieldLabelToRemove));
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "events"));
            const eventsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by date descending (simple string sort for YYYY-MM-DD)
            eventsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setEvents(eventsData);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!title || !date) return;
        setSubmitting(true);
        console.log("Starting event creation...");

        try {
            let qrCodeUrl = null;
            if (qrCodeFile) {
                try {
                    console.log("Compressing QR code...");

                    const options = {
                        maxSizeMB: 0.1, // extremely aggressive compression for text encoding to avoid 1MB Firestore limit
                        maxWidthOrHeight: 400, // Small dimensions are fine for QR codes
                        useWebWorker: true
                    };

                    const compressedFile = await imageCompression(qrCodeFile, options);

                    // Convert the compressed File into a Base64 string
                    const base64String = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(compressedFile);
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = error => reject(error);
                    });

                    qrCodeUrl = base64String;
                    console.log("QR Code compressed & encoded to Base64!");

                } catch (uploadErr) {
                    console.error("Failed to compress/encode QR Code:", uploadErr);
                    alert("Error processing QR code. Please check file size.");
                    setSubmitting(false);
                    return; // Stop if image processing fails
                }
            }

            console.log("Saving to Firestore...");
            await addDoc(collection(db, "events"), {
                title,
                description,
                date,
                location,
                memberPrice,
                guestPrice,
                customFields, // <-- Dynamic fields added by Admin
                qrCodeUrl, // <-- Custom QR code
                createdAt: new Date().toISOString()
            });
            console.log("Saved to Firestore!");

            setTitle('');
            setDescription('');
            setDate('');
            setLocation('');
            setMemberPrice('');
            setGuestPrice('');
            setCustomFields([]); // reset
            setQrCodeFile(null); // reset qr

            // Explicitly clear the file input DOM node
            const fileInput = document.getElementById('qrFileInput');
            if (fileInput) fileInput.value = '';

            await fetchEvents();
            console.log("Event created and list refreshed.");
        } catch (error) {
            console.error("Error adding event:", error);
            alert("Error creating event: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await deleteDoc(doc(db, "events", id));
            fetchEvents();
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const copyEventLink = (id) => {
        const link = `${window.location.origin}/event/${id}`;
        navigator.clipboard.writeText(link);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="admin-events-page">
            <div className="page-header">
                <div>
                    <h2>Event Management</h2>
                    <p>Create and manage club events.</p>
                </div>
            </div>

            <div className="events-content-grid">
                {/* Create Event Form */}
                <div className="glass-panel form-card">
                    <h3>Create New Event</h3>
                    <form className="event-form" onSubmit={handleCreateEvent}>
                        <div className="input-group">
                            <label className="input-label">Event Title</label>
                            <input
                                type="text"
                                className="input-base"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. AI Hackathon"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Date</label>
                            <input
                                type="date"
                                className="input-base"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Location (Optional)</label>
                            <input
                                type="text"
                                className="input-base"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g. Main Auditorium"
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Member Price (₹)</label>
                                <input
                                    type="text"
                                    className="input-base"
                                    value={memberPrice}
                                    onChange={e => setMemberPrice(e.target.value)}
                                    placeholder="e.g. 99"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Guest Price (₹)</label>
                                <input
                                    type="text"
                                    className="input-base"
                                    value={guestPrice}
                                    onChange={e => setGuestPrice(e.target.value)}
                                    placeholder="e.g. 199"
                                    required
                                />
                            </div>
                            {memberPrice && guestPrice && !isNaN(memberPrice) && !isNaN(guestPrice) && (
                                <p style={{ gridColumn: 'span 2', fontSize: '0.8rem', color: 'var(--pk-accent)', marginTop: '-0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Check size={14} /> Member Discount Applied: ₹{Math.max(0, parseFloat(guestPrice) - parseFloat(memberPrice))} discount
                                </p>
                            )}
                        </div>
                        <div className="input-group">
                            <label className="input-label">Description</label>
                            <textarea
                                className="input-base textarea-base"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Event details..."
                                rows="3"
                            ></textarea>
                        </div>

                        <div className="divider" style={{ margin: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>

                        <div className="input-group">
                            <label className="input-label">Custom Questions (Optional)</label>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ask attendees for specific details like "Department", "Roll Number", or "T-Shirt Size".</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    className="input-base"
                                    value={newField}
                                    onChange={e => setNewField(e.target.value)}
                                    placeholder="e.g. Current Year of Study"
                                    style={{ width: '100%' }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddField(); } }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <select
                                        className="input-base"
                                        value={newFieldType}
                                        onChange={e => setNewFieldType(e.target.value)}
                                        style={{ padding: '0 0.5rem', width: 'auto' }}
                                    >
                                        <option value="text">Text Entry</option>
                                        <option value="date">Date picker</option>
                                        <option value="image">Image Upload</option>
                                    </select>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={isNewFieldRequired} onChange={e => setIsNewFieldRequired(e.target.checked)} />
                                        Required
                                    </label>
                                    <button type="button" className="btn-secondary" onClick={handleAddField} style={{ padding: '0 1rem', marginLeft: 'auto' }}>Add</button>
                                </div>
                            </div>

                            {customFields.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {customFields.map((field, idx) => {
                                        const fieldLabel = field.label ? field.label : field;
                                        const fieldRequired = field.label ? field.required : true;
                                        const fieldType = field.type ? field.type : 'text';
                                        return (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', background: 'rgba(139, 92, 246, 0.2)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                                {fieldLabel} <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>[{fieldType}]</span> {fieldRequired && <span style={{ color: 'var(--pk-danger)', marginLeft: '0.2rem' }}>*</span>}
                                                <button type="button" onClick={() => handleRemoveField(fieldLabel)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="divider" style={{ margin: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>

                        <div className="input-group">
                            <label className="input-label">Payment QR Code (Optional)</label>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Upload a specific QR Code that attendees should scan to pay for this event. Provide UPI as backup above.</p>
                            <input
                                id="qrFileInput"
                                type="file"
                                accept="image/*"
                                className="input-base"
                                onChange={e => {
                                    if (e.target.files[0]) {
                                        setQrCodeFile(e.target.files[0]);
                                    } else {
                                        setQrCodeFile(null);
                                    }
                                }}
                            />
                            {qrCodeFile && <p style={{ fontSize: '0.8rem', color: 'var(--pk-primary)', marginTop: '0.5rem' }}>Selected: {qrCodeFile.name}</p>}
                        </div>

                        <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '1rem' }}>
                            {submitting ? <Loader2 size={18} className="spinner" /> : <Plus size={18} />}
                            {submitting ? 'Creating...' : 'Create Event'}
                        </button>
                    </form>
                </div>

                {/* Event List */}
                <div className="glass-panel list-card">
                    <h3>All Events</h3>
                    {loading ? (
                        <div className="loading-state"><Loader2 size={24} className="spinner" /> Loading events...</div>
                    ) : events.length === 0 ? (
                        <div className="empty-state">No events found. Create one!</div>
                    ) : (
                        <div className="event-items">
                            {events.map(event => (
                                <div key={event.id} className="admin-event-item">
                                    <div className="event-info">
                                        <h4>{event.title}</h4>
                                        <div className="event-meta">
                                            <span className="event-date-badge"><Calendar size={14} /> {event.date}</span>
                                            {event.location && <span className="event-location-badge">{event.location}</span>}
                                            <span style={{
                                                fontSize: '0.75rem',
                                                opacity: 0.8,
                                                background: 'rgba(255,255,255,0.05)',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '1rem',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                color: 'var(--pk-primary)'
                                            }}>
                                                M: ₹{event.memberPrice || 0} | G: ₹{event.guestPrice || 0}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="icon-btn btn-secondary"
                                            onClick={() => navigate(`/admin/events/${event.id}/registrations`)}
                                            title="View Registrations"
                                        >
                                            <Users size={18} />
                                        </button>
                                        <button
                                            className="icon-btn btn-secondary"
                                            onClick={() => copyEventLink(event.id)}
                                            title="Copy Share Link"
                                        >
                                            {copiedId === event.id ? <Check size={18} color="var(--pk-success)" /> : <Link2 size={18} />}
                                        </button>
                                        <button
                                            className="icon-btn btn-danger"
                                            onClick={() => handleDeleteEvent(event.id)}
                                            title="Delete Event"
                                        >
                                            <Trash2 size={18} />
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

export default AdminEvents;
