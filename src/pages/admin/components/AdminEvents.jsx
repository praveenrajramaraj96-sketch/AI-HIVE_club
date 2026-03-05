import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Loader2 } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import './AdminEvents.css';

const AdminEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');

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
        try {
            await addDoc(collection(db, "events"), {
                title,
                description,
                date,
                location,
                createdAt: new Date().toISOString()
            });
            setTitle('');
            setDescription('');
            setDate('');
            setLocation('');
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
                        <button type="submit" className="btn-primary" disabled={submitting}>
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
                                        </div>
                                    </div>
                                    <button
                                        className="icon-btn btn-danger"
                                        onClick={() => handleDeleteEvent(event.id)}
                                        title="Delete Event"
                                    >
                                        <Trash2 size={18} />
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

export default AdminEvents;
