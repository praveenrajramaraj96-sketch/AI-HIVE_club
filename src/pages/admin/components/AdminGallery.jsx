import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Trash2, Loader2, UploadCloud } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import './AdminGallery.css';

const AdminGallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');

    const fetchImages = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "gallery"));
            const imagesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by createdAt descending
            imagesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setImages(imagesData);
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        try {
            // Upload to storage
            const fileRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(fileRef);

            // Save info to firestore
            await addDoc(collection(db, "gallery"), {
                url: downloadURL,
                path: fileRef.fullPath,
                title: title || 'Untitled',
                createdAt: new Date().toISOString()
            });

            setTitle('');
            setFile(null);
            fetchImages();
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error uploading. Ensure Firebase Storage is properly configured and access rules allow writes.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (image) => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;
        try {
            if (image.path) {
                // Delete from storage
                const fileRef = ref(storage, image.path);
                await deleteObject(fileRef);
            }
            // Delete from firestore
            await deleteDoc(doc(db, "gallery", image.id));
            fetchImages();
        } catch (error) {
            console.error("Error deleting image:", error);
            // Even if storage deletion fails (e.g. file doesn't exist), maybe force delete the doc
            await deleteDoc(doc(db, "gallery", image.id));
            fetchImages();
        }
    };

    return (
        <div className="admin-gallery-page">
            <div className="page-header">
                <div>
                    <h2>Gallery Management</h2>
                    <p>Upload and organize photos from recent events and activities.</p>
                </div>
            </div>

            <div className="gallery-grid">
                {/* Upload Section */}
                <div className="glass-panel upload-card">
                    <h3><ImageIcon size={18} /> Upload Image</h3>
                    <form className="admin-form" onSubmit={handleUpload}>
                        <div className="input-group">
                            <label className="input-label">Image Title</label>
                            <input
                                type="text"
                                className="input-base"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. AI Symposium 2026"
                                required
                            />
                        </div>
                        <div className="input-group file-drop-area">
                            <label className="file-upload-label">
                                <UploadCloud size={32} className="upload-icon" />
                                <span>{file ? file.name : "Click to select an image"}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="file-input"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    required
                                />
                            </label>
                        </div>
                        <button type="submit" className="btn-primary" disabled={uploading || !file}>
                            {uploading ? <Loader2 size={18} className="spinner" /> : <Plus size={18} />}
                            {uploading ? 'Uploading...' : 'Upload File'}
                        </button>
                    </form>
                </div>

                {/* Display Grid */}
                <div className="glass-panel display-card">
                    <h3>Image Gallery</h3>
                    {loading ? (
                        <div className="loading-state"><Loader2 size={24} className="spinner" /> Loading gallery...</div>
                    ) : images.length === 0 ? (
                        <div className="empty-state">No images found. Upload some!</div>
                    ) : (
                        <div className="gallery-layout">
                            {images.map(image => (
                                <div key={image.id} className="gallery-item-card">
                                    <div className="gallery-img-wrap">
                                        <img src={image.url} alt={image.title} className="gallery-img" />
                                        <div className="img-overlay">
                                            <button
                                                className="img-delete-btn"
                                                onClick={() => handleDelete(image)}
                                                title="Delete Image"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <h4 className="gallery-img-title">{image.title}</h4>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminGallery;
