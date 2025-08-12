const axios = require('axios');

const TIKWM_API_URL = 'https://www.tikwm.com/api/';

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

module.exports = async (req, res) => {
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
};
