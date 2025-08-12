const axios = require('axios');
const FormData = require('form-data');
const streamToBuffer = require('stream-to-buffer');

const CATBOX_API_URL = 'https://catbox.moe/user/api.php';

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

module.exports = async (req, res) => {
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
};
