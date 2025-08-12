const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const streamToBuffer = require('stream-to-buffer'); // Ganti ini

const app = express();

const CATBOX_API_URL = 'https://catbox.moe/user/api.php';
const TIKWM_API_URL = 'https://www.tikwm.com/api/';

// --- API Keys yang sudah disatukan langsung ke dalam kode ---
const PINTEREST_API_KEY = 'd93b272186msh016340c8394fe2bp13b931jsn036c723d1c0c';
const PINTEREST_API_HOST = 'pinterest-video-and-image-downloader.p.rapidapi.com';
const PINTEREST_API_URL = 'https://pinterest-video-and-image-downloader.p.rapidapi.com/pinterest';

const ALL_SOSMED_API_KEY = 'd93b272186msh016340c8394fe2bp13b931jsn036c723d1c0c';
const ALL_SOSMED_API_HOST = 'instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com';
const ALL_SOSMED_API_URL = 'https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/';
// --- Akhir dari API Keys yang disatukan ---

const PRESETS_FILE = path.join(__dirname, 'presets.json');

// Middleware
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: storage });

const readPresets = () => {
    try {
        const data = fs.readFileSync(PRESETS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('Error reading presets.json:', error);
        return [];
    }
};

const writePresets = (presets) => {
    try {
        fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 4), 'utf8');
    } catch (error) {
        console.error('Error writing presets.json:', error);
    }
};

async function downloadTiktok(url) {
    try {
        const response = await axios.post(TIKWM_API_URL, null, {
            params: { url: url, count: 12, cursor: 0, web: 1, hd: 1 }
        });
        if (response.data && response.data.msg === 'success') {
            return { status: 'success', data: response.data.data };
        } else {
            const errorMessage = response.data && response.data.msg ? response.data.msg : 'Failed to get video data from API';
            return { status: 'error', message: errorMessage };
        }
    } catch (error) {
        console.error('Error saat download TikTok:', error.message);
        const errorMessage = error.response?.data?.msg || error.message || 'Terjadi kesalahan saat menghubungi API TikTok.';
        return { status: 'error', message: errorMessage };
    }
}

async function uploadBufferToCatbox(buffer, filename) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: filename });

    try {
        const response = await axios.post(CATBOX_API_URL, form, {
            headers: form.getHeaders(),
        });
        const catboxUrl = response.data.trim();
        if (catboxUrl.startsWith('http')) {
            return catboxUrl;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error saat upload ke Catbox:', error.message);
        return null;
    }
}

app.get('/api', (req, res) => {
    res.send('Server API is running');
});

app.get('/api/presets', (req, res) => {
    const presets = readPresets();
    res.status(200).json(presets);
});

app.post('/api/presets', (req, res) => {
    const newPreset = req.body;
    const presets = readPresets();
    newPreset.id = Date.now();
    presets.push(newPreset);
    writePresets(presets);
    res.status(201).json({ message: 'Preset added successfully', preset: newPreset });
});

app.put('/api/presets/:id', (req, res) => {
    const presetId = parseInt(req.params.id);
    const updatedPreset = req.body;
    let presets = readPresets();
    const index = presets.findIndex(p => p.id === presetId);
    if (index === -1) {
        return res.status(404).json({ message: 'Preset not found' });
    }
    presets[index] = { ...presets[index], ...updatedPreset };
    writePresets(presets);
    res.status(200).json({ message: 'Preset updated successfully', preset: presets[index] });
});

app.delete('/api/presets/:id', (req, res) => {
    const presetId = parseInt(req.params.id);
    let presets = readPresets();
    const newPresets = presets.filter(p => p.id !== presetId);
    if (presets.length === newPresets.length) {
        return res.status(404).json({ message: 'Preset not found' });
    }
    writePresets(newPresets);
    res.status(200).json({ message: 'Preset deleted successfully' });
});

app.get('/api/download-tiktok', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ status: 'error', message: 'URL is required' });
    }
    
    const result = await downloadTiktok(url);
    
    if (result.status === 'success') {
        res.status(200).json(result);
    } else {
        res.status(500).json(result);
    }
});

app.post('/api/upload-media', uploadMiddleware.single('media'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    
    const catboxUrl = await uploadBufferToCatbox(req.file.buffer, req.file.originalname);

    if (catboxUrl) {
        res.status(200).send(catboxUrl);
    } else {
        res.status(500).send('Failed to upload media to Catbox.');
    }
});

app.get('/api/upload-url-to-catbox', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ status: 'error', message: 'URL is required' });
    }

    try {
        const videoResponse = await axios.get(url, { responseType: 'stream' });
        const videoBuffer = await streamToBuffer(videoResponse.data);

        if (!videoBuffer) {
            return res.status(500).json({ status: 'error', message: 'Gagal mendownload video dari URL yang diberikan.' });
        }

        const filename = `video-${Date.now()}.mp4`;
        const catboxUrl = await uploadBufferToCatbox(videoBuffer, filename);

        if (catboxUrl) {
            res.status(200).json({ status: 'success', message: 'Video berhasil diunggah ke Catbox!', catboxUrl: catboxUrl });
        } else {
            res.status(500).json({ status: 'error', message: 'Gagal mengunggah video ke Catbox.' });
        }
    } catch (error) {
        console.error('Error saat mengunggah URL ke Catbox:', error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server saat memproses permintaan.' });
    }
});

app.get('/api/download-pinterest', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
    }

    try {
        const response = await axios.request({
            method: 'GET',
            url: PINTEREST_API_URL,
            params: { url: url },
            headers: {
                'x-rapidapi-key': PINTEREST_API_KEY,
                'x-rapidapi-host': PINTEREST_API_HOST
            }
        });

        if (response.data && response.data.success) {
            res.status(200).json(response.data);
        } else {
            res.status(404).json({ success: false, message: 'Gagal menemukan konten Pinterest. Pastikan URL valid.' });
        }
    } catch (error) {
        console.error('Pinterest download error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat memproses permintaan Pinterest.' });
    }
});

app.get('/api/download-all-sosmed', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ status: 'error', message: 'URL is required' });
    }

    try {
        const response = await axios.request({
            method: 'GET',
            url: ALL_SOSMED_API_URL,
            params: { url: url },
            headers: {
                'x-rapidapi-key': ALL_SOSMED_API_KEY,
                'x-rapidapi-host': ALL_SOSMED_API_HOST
            }
        });
        
        if (response.data && response.data.medias && response.data.medias.length > 0) {
            const mediaData = response.data.medias.map(media => ({
                type: media.type,
                url: media.src,
                thumbnail: media.thumb
            }));
            return res.status(200).json({ status: 'success', data: mediaData });
        } else {
            return res.status(404).json({ status: 'error', message: 'Tidak ada media yang ditemukan untuk URL ini.' });
        }
    } catch (error) {
        console.error('All Sosmed download error:', error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: `Terjadi kesalahan server: ${error.message}` });
    }
});

module.exports = app;
