const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');

const CATBOX_API_URL = 'https://catbox.moe/user/api.php';

const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: storage });

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

module.exports = (req, res) => {
  uploadMiddleware.single('media')(req, res, async (err) => {
    if (err) {
      return res.status(400).send(err.message);
    }
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
};
