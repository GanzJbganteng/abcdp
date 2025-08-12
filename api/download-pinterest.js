const axios = require('axios');

const PINTEREST_API_KEY = 'd93b272186msh016340c8394fe2bp13b931jsn036c723d1c0c';
const PINTEREST_API_HOST = 'pinterest-video-and-image-downloader.p.rapidapi.com';
const PINTEREST_API_URL = 'https://pinterest-video-and-image-downloader.p.rapidapi.com/pinterest';

module.exports = async (req, res) => {
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
};
