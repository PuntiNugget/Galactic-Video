const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// --- CONFIGURATION ---

// 1. Ensure 'public/uploads' folder exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Multer (File Upload System)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save to public/uploads
    },
    filename: (req, file, cb) => {
        // Name file: timestamp-originalName.mp4 (prevents duplicates)
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Only allow MP4 files
        if (file.mimetype === 'video/mp4') {
            cb(null, true);
        } else {
            cb(new Error('Only .mp4 files are allowed!'));
        }
    }
});

// --- MIDDLEWARE ---

// Serve static files from the 'public' directory
app.use(express.static('public'));

// --- ROUTES ---

// 1. Upload Route
app.post('/upload', upload.single('videoFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded or invalid format.' });
    }
    res.json({ success: true, message: 'File uploaded successfully!' });
});

// 2. List Videos Route
app.get('/videos', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json([]);
        }
        // Filter for .mp4 files and reverse so newest show first
        const videos = files.filter(file => file.endsWith('.mp4')).reverse();
        res.json(videos);
    });
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Videos are stored in: ${uploadDir}`);
});
