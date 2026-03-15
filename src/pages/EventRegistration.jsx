import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, User, Mail, Phone, ArrowRight, Loader2, CheckCircle, UploadCloud, IndianRupee } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
import { QRCodeCanvas } from 'qrcode.react';
import { db } from '../firebase';
import './EventRegistration.css';

const EventRegistration = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loadingEvent, setLoadingEvent] = useState(true);

    // Step tracking
    const [step, setStep] = useState(1); // 1 = Email, 2 = Details, 3 = Payment/Proof, 4 = Success

    // User Form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [extraDetails, setExtraDetails] = useState({}); // Stores answers to custom fields
    const [isChecking, setIsChecking] = useState(false);

    // Payment specific
    const [isMember, setIsMember] = useState(false);
    const [proofFile, setProofFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [registeredTicketId, setRegisteredTicketId] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const docRef = doc(db, "events", eventId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setEvent({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (err) {
                console.error("Error fetching event:", err);
            } finally {
                setLoadingEvent(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        setError('');
        setIsChecking(true);
        try {
            // Check if email matches existing student database
            const q = query(collection(db, "students"), where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setIsMember(true);
                const data = querySnapshot.docs[0].data();
                setName(data.name || '');
                setPhone(data.phone || '');
            } else {
                setIsMember(false);
            }
            // Move to Details block
            setStep(2);
        } catch (err) {
            setError(err.message.replace('Firebase:', ''));
        } finally {
            setIsChecking(false);
        }
    };

    const handleDetailsSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!name || !phone) {
            setError('Please fill all standard fields.');
            return;
        }

        if (event.customFields) {
            for (let field of event.customFields) {
                const fieldLabel = typeof field === 'string' ? field : field.label;
                const fieldRequired = typeof field === 'string' ? true : field.required;

                if (fieldRequired && (!extraDetails[fieldLabel] || (typeof extraDetails[fieldLabel] === 'string' && extraDetails[fieldLabel].trim() === ''))) {
                    setError(`Please provide your ${fieldLabel}`);
                    return;
                }
            }
        }

        setStep(3);
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleSubmitRegistration = async () => {
        if (!proofFile) {
            setError("Please upload a screenshot of your payment.");
            return;
        }

        setError('');
        setUploading(true);

        try {
            // Helper function to compress and convert to base64
            const processImage = async (fileObj) => {
                const options = {
                    maxSizeMB: 0.15, // Aggressively shrink to bypass Firestore 1MB limits
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                    fileType: 'image/jpeg'
                };
                const compressedFile = await imageCompression(fileObj, options);
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(compressedFile);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
            };

            // 1. Process Main Payment Screenshot
            const downloadURL = await processImage(proofFile);

            // 2. Process dynamic image file type custom fields if any exist
            let processedExtraDetails = { ...extraDetails };

            for (let key in processedExtraDetails) {
                if (processedExtraDetails[key] instanceof File) {
                    processedExtraDetails[key] = await processImage(processedExtraDetails[key]);
                }
            }

            // 3. Generate Unique Ticket ID
            const ticketId = `AIH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            // Create Registration Record
            await addDoc(collection(db, "event_registrations"), {
                eventId,
                eventTitle: event.title,
                name,
                email,
                phone,
                extraDetails: processedExtraDetails, // Custom field answers
                isMember,
                proofUrl: downloadURL,
                status: 'Pending',
                ticketId,
                checkedIn: false,
                createdAt: new Date().toISOString()
            });

            setRegisteredTicketId(ticketId);
            setStep(4); // Go to Success Screen

        } catch (err) {
            console.error("Upload error", err);
            setError("Failed to upload. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    if (loadingEvent) {
        return <div className="loading-screen"><Loader2 className="spinner" size={40} /></div>;
    }

    if (!event) {
        return (
            <div className="event-registration-page">
                <div className="glass-panel registration-box" style={{ textAlign: 'center' }}>
                    <h2>Event Not Found</h2>
                    <p>The event you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const memberPrice = event.memberPrice ? (event.memberPrice.toString().startsWith('₹') ? event.memberPrice : `₹${event.memberPrice}`) : '₹0';
    const guestPrice = event.guestPrice ? (event.guestPrice.toString().startsWith('₹') ? event.guestPrice : `₹${event.guestPrice}`) : '₹0';

    return (
        <div className="event-registration-page">
            <div className="bg-glow blur-1"></div>
            <div className="bg-glow blur-2"></div>

            <motion.div
                className="glass-panel registration-box"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {step === 1 && (
                    <>
                        <div className="event-hero">
                            <h2>{event.title}</h2>
                            <div className="event-meta-info">
                                <span><Calendar size={14} /> {event.date}</span>
                                {event.location && <span><MapPin size={14} /> {event.location}</span>}
                            </div>
                            <p style={{ color: 'var(--text-secondary)' }}>{event.description}</p>
                        </div>

                        <div className="divider" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>

                        <form className="login-form" onSubmit={handleVerifyEmail}>
                            <h3>Start Registration</h3>

                            <div className="input-group">
                                <label className="input-label">Email Address</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input type="email" className="input-base with-icon" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@college.edu" />
                                </div>
                                <span className="input-hint" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>We will verify if you are a club member.</span>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <button type="submit" className="btn-primary" disabled={isChecking}>
                                {isChecking ? <Loader2 className="spinner" size={20} /> : 'Continue'}
                                {!isChecking && <ArrowRight size={18} />}
                            </button>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="event-hero">
                            <h2>{event.title}</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Attendee Details</p>
                        </div>

                        <div className="divider" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>

                        <form className="login-form" onSubmit={handleDetailsSubmit}>
                            <div className="input-group">
                                <label className="input-label">Email Address</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input type="email" className="input-base with-icon locked-input" value={email} readOnly />
                                </div>
                                {isMember && <span className="input-hint" style={{ color: 'var(--pk-primary)', fontSize: '0.8rem' }}>✓ Verified Club Member</span>}
                            </div>

                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input type="text" className="input-base with-icon" required value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Phone</label>
                                <div className="input-wrapper">
                                    <Phone size={18} className="input-icon" />
                                    <input type="tel" className="input-base with-icon" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 " />
                                </div>
                            </div>

                            {/* Render Custom Fields dynamically */}
                            {event.customFields && event.customFields.length > 0 && (
                                <>
                                    <div className="divider" style={{ margin: '1.5rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
                                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Additional Information</h4>

                                    {event.customFields.map((field, idx) => {
                                        const fieldLabel = typeof field === 'string' ? field : field.label;
                                        const fieldRequired = typeof field === 'string' ? true : field.required;
                                        const fieldType = typeof field === 'string' ? 'text' : field.type || 'text';

                                        return (
                                            <div className="input-group" key={idx}>
                                                <label className="input-label">
                                                    {fieldLabel} {fieldRequired && <span style={{ color: 'var(--pk-danger)' }}>*</span>}
                                                </label>
                                                {fieldType === 'image' ? (
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="input-base"
                                                        required={fieldRequired && !extraDetails[fieldLabel]}
                                                        onChange={e => {
                                                            if (e.target.files[0]) {
                                                                setExtraDetails({ ...extraDetails, [fieldLabel]: e.target.files[0] });
                                                            }
                                                        }}
                                                    />
                                                ) : fieldType === 'date' ? (
                                                    <input
                                                        type="date"
                                                        className="input-base"
                                                        required={fieldRequired}
                                                        value={extraDetails[fieldLabel] || ''}
                                                        onChange={e => setExtraDetails({ ...extraDetails, [fieldLabel]: e.target.value })}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="input-base"
                                                        required={fieldRequired}
                                                        value={extraDetails[fieldLabel] || ''}
                                                        onChange={e => setExtraDetails({ ...extraDetails, [fieldLabel]: e.target.value })}
                                                        placeholder={`Enter ${fieldLabel}`}
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </>
                            )}

                            {error && <div className="error-message">{error}</div>}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: 'center' }}>Back</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                    Proceed to Payment <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h2 style={{ textAlign: 'center', margin: 0 }}>Complete Registration</h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>{event.title}</p>

                        <div className="price-banner">
                            <p>{isMember ? 'AI-Hive Member Price' : 'Guest / Non-Member Price'}</p>
                            <h3>{isMember ? memberPrice : guestPrice}</h3>
                            <p style={{ color: 'var(--pk-accent)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{isMember ? '✓ Verified Membership Status' : 'Not an official club member.'}</p>
                        </div>

                        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                            <p><strong>Scan QR Code to Pay</strong></p>
                            {event.qrCodeUrl ? (
                                <img
                                    src={event.qrCodeUrl}
                                    alt="Payment QR Code"
                                    style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '1rem', margin: '1rem auto' }}
                                />
                            ) : (
                                <div className="qr-code-placeholder">
                                    <IndianRupee size={48} />
                                    <span>UPI QR CODE HERE</span>
                                </div>
                            )}
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>UPI ID: aihiveclub@okicici</p>
                        </div>

                        <div className="divider" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0' }}></div>

                        <div style={{ textAlign: 'center' }}>
                            <p style={{ marginBottom: '0.5rem' }}>Upload Payment Screenshot <span style={{ color: 'var(--pk-danger)' }}>*</span></p>
                            <div className="upload-button-wrapper">
                                <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                    <UploadCloud size={18} style={{ marginRight: '0.5rem' }} />
                                    Choose Screenshot Image
                                </button>
                                <input type="file" accept="image/*" onChange={handleFileChange} />
                            </div>
                            {proofFile && <div className="file-name-display">{proofFile.name}</div>}
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button className="btn-secondary" onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center' }} disabled={uploading}>Back</button>
                            <button className="btn-primary" onClick={handleSubmitRegistration} style={{ flex: 1, justifyContent: 'center' }} disabled={uploading}>
                                {uploading ? <Loader2 className="spinner" size={20} /> : 'Submit Proof'}
                            </button>
                        </div>
                    </>
                )}

                {step === 4 && (
                    <div className="success-container" style={{ textAlign: 'center' }}>
                        <div className="success-icon" style={{ margin: '0 auto 1.5rem auto' }}>
                            <CheckCircle size={50} color="var(--pk-success)" />
                        </div>
                        <h2 style={{ marginBottom: '0.5rem' }}>Registration Received!</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Thank you, <strong>{name}</strong>! Your ticket is generated below.
                            <br />Status: <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>Pending Admin Approval</span>
                        </p>

                        <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px dashed #38bdf8', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1.5rem', color: '#38bdf8', fontSize: '0.85rem' }}>
                            📸 <strong>Take a screenshot of this page now!</strong> This is your digital entry ticket for the event.
                        </div>

                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', marginBottom: '1.5rem' }}>
                            <QRCodeCanvas value={registeredTicketId} size={150} />
                            <p style={{ color: '#000', margin: '0.5rem 0 0 0', fontWeight: 'bold', fontSize: '0.8rem' }}>{registeredTicketId}</p>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>💡 Note:</strong> Your ticket is currently <strong>Inactive</strong>. Once the Admin verifies your payment screenshot, it will be activated for the event entry.</p>
                        </div>

                        {isMember && (
                            <button className="btn-primary" onClick={() => navigate('/')} style={{ width: '100%', justifyContent: 'center' }}>Return to Homepage</button>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default EventRegistration;
