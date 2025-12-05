const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---

// 1. Ensure 'public/uploads' folder exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Multer (File Upload System)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        // Name file: timestamp-originalName.mp4
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'video/mp4') {
            cb(null, true);
        } else {
            cb(new Error('Only .mp4 files are allowed!'));
        }
    }
});

// --- MIDDLEWARE ---

app.use(express.static('public'));
// Also serve uploads if they ended up in a root uploads folder by mistake
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- ROUTES ---

// Homepage
app.get('/', (req, res) => {
    const publicIndex = path.join(__dirname, 'public', 'index.html');
    const rootIndex = path.join(__dirname, 'index.html');

    if (fs.existsSync(publicIndex)) {
        res.sendFile(publicIndex);
    } else if (fs.existsSync(rootIndex)) {
        res.sendFile(rootIndex);
    } else {
        res.send('SYSTEM ERROR: index.html not found.');
    }
});

// 1. Upload Route
app.post('/upload', upload.single('videoFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'ERROR: No file detected or invalid format.' });
    }
    res.json({ success: true, message: 'UPLOAD SEQUENCE COMPLETE.' });
});

// 2. List Videos Route
app.get('/videos', (req, res) => {
    if (fs.existsSync(uploadDir)) {
        fs.readdir(uploadDir, (err, files) => {
            if (err) return res.json([]);
            const videos = files.filter(file => file.endsWith('.mp4')).reverse();
            res.json(videos);
        });
    } else {
        res.json([]);
    }
});

// 3. DELETE Video Route (NEW)
app.delete('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    // Security: path.basename ensures someone can't type "../../file" to hack the system
    const safeFilename = path.basename(filename);
    const filepath = path.join(uploadDir, safeFilename);

    if (fs.existsSync(filepath)) {
        fs.unlink(filepath, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'ERROR: DELETION FAILED' });
            }
            res.json({ success: true, message: 'FILE DELETED.' });
        });
    } else {
        res.status(404).json({ success: false, message: 'ERROR: FILE NOT FOUND' });
    }
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`>> SYSTEM ONLINE. PORT: ${PORT}`);
});
