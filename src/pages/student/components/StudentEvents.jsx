import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import './StudentEvents.css';

const StudentEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const eventsSnapshot = await getDocs(collection(db, "events"));
                const eventsList = eventsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                eventsList.sort((a, b) => new Date(a.date) - new Date(b.date));
                setEvents(eventsList);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Helper formatting
    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="student-events-page">
            <div className="page-header">
                <div>
                    <h2>Upcoming Events</h2>
                    <p>View upcoming workshops, hackathons, and symposiums.</p>
                </div>
            </div>

            <div className="student-events-container">
                {loading ? (
                    <div className="loading-state glass-panel">
                        <Loader2 className="spinner" size={24} />
                        <p>Loading Events...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="empty-state glass-panel">
                        <p>No events currently scheduled. Check back later!</p>
                    </div>
                ) : (
                    <div className="student-event-list">
                        {events.map((evt) => (
                            <div key={evt.id} className="glass-panel student-event-card">
                                <div className="event-card-header">
                                    <h3>{evt.title}</h3>
                                </div>
                                <div className="event-card-body">
                                    <p className="event-description">{evt.description}</p>
                                    <div className="event-card-meta">
                                        <span><Calendar size={16} className="text-muted" /> {formatDate(evt.date)}</span>
                                        {evt.location && <span><MapPin size={16} className="text-muted" /> {evt.location}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentEvents;
