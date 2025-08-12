const axios = require('axios');

const ALL_SOSMED_API_KEY = 'd93b272186msh016340c8394fe2bp13b931jsn036c723d1c0c';
const ALL_SOSMED_API_HOST = 'instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com';
const ALL_SOSMED_API_URL = 'https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/';

module.exports = async (req, res) => {
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
};
