import React, { useState } from 'react';
import { Mail, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import './StudentContact.css';

const StudentContact = () => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!subject || !message) return;
        setSending(true);

        try {
            await addDoc(collection(db, "contacts"), {
                studentEmail: auth.currentUser ? auth.currentUser.email : 'Unknown',
                uid: auth.currentUser ? auth.currentUser.uid : 'Unknown',
                subject,
                message,
                status: 'Unread',
                createdAt: new Date().toISOString()
            });

            setSubject('');
            setMessage('');
            setSent(true);
            setTimeout(() => setSent(false), 5000); // Hide success after 5s
        } catch (error) {
            console.error("Error sending message", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="student-contact-page">
            <div className="page-header">
                <div>
                    <h2>Contact Administrator</h2>
                    <p>Have a question or need help? Send a direct message to the club admin.</p>
                </div>
            </div>

            <div className="contact-layout">
                <div className="glass-panel contact-form-card">
                    {sent ? (
                        <div className="contact-success-state">
                            <CheckCircle2 size={64} className="icon-green" />
                            <h3>Message Sent!</h3>
                            <p>The admin team has received your query and will reply via email shortly.</p>
                            <button className="btn-secondary mt-4" onClick={() => setSent(false)}>Send Another Message</button>
                        </div>
                    ) : (
                        <form className="contact-form" onSubmit={handleSend}>
                            <div className="input-group">
                                <label className="input-label">Subject</label>
                                <input
                                    type="text"
                                    className="input-base"
                                    placeholder="e.g. Issue with event registration"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Message Details</label>
                                <textarea
                                    className="input-base textarea-base contact-textarea"
                                    placeholder="Explain your issue or question in detail..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            <div className="contact-actions">
                                <p className="text-muted text-sm">Replies will be sent to your registered email address.</p>
                                <button type="submit" className="btn-primary" disabled={sending}>
                                    {sending ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
                                    {sending ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="glass-panel contact-info-card">
                    <h3>Direct Contact Info</h3>
                    <p>If you need immediate assistance, you can also reach out to us here:</p>

                    <div className="info-item">
                        <Mail size={20} className="icon-purple" />
                        <div>
                            <h4>Email Support</h4>
                            <p>admin@aihive.edu</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentContact;
