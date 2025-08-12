const axios = require('axios');
const path = require('path');

const GITHUB_USERNAME = 'GanzJbganteng';
const GITHUB_REPO = 'abcdp';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Ambil token dari Environment Variables
const FILE_PATH = 'presets.json';

async function getFileFromGitHub() {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${FILE_PATH}`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(`Gagal mendapatkan file dari GitHub: ${error.message}`);
    }
}

async function updateFileOnGitHub(content, sha, commitMessage) {
    const newContent = Buffer.from(content).toString('base64');
    try {
        const response = await axios.put(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${FILE_PATH}`,
            {
                message: commitMessage,
                content: newContent,
                sha: sha,
            },
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(`Gagal mengupdate file di GitHub: ${error.message}`);
    }
}

module.exports = async (req, res) => {
    if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
        return res.status(405).send('Method Not Allowed');
    }

    if (!GITHUB_TOKEN) {
        return res.status(500).json({ message: 'Token GitHub tidak ditemukan. Silakan tambahkan sebagai Environment Variable.' });
    }

    try {
        const fileData = await getFileFromGitHub();
        const existingContentBase64 = fileData.content;
        const existingContent = Buffer.from(existingContentBase64, 'base64').toString('utf8');
        let presets = JSON.parse(existingContent);
        
        let updatedPresets = [...presets];
        let commitMessage = '';

        if (req.method === 'POST') {
            const newPreset = req.body;
            newPreset.id = Date.now();
            updatedPresets.push(newPreset);
            commitMessage = `Menambah preset: ${newPreset.title}`;
        } else if (req.method === 'PUT') {
            const presetId = parseInt(req.query.id);
            const updatedPreset = req.body;
            const index = updatedPresets.findIndex(p => p.id === presetId);
            if (index !== -1) {
                updatedPresets[index] = { ...updatedPresets[index], ...updatedPreset };
            }
            commitMessage = `Mengedit preset dengan ID: ${presetId}`;
        } else if (req.method === 'DELETE') {
            const presetId = parseInt(req.query.id);
            updatedPresets = updatedPresets.filter(p => p.id !== presetId);
            commitMessage = `Menghapus preset dengan ID: ${presetId}`;
        }
        
        await updateFileOnGitHub(JSON.stringify(updatedPresets, null, 4), fileData.sha, commitMessage);
        
        res.status(200).json({ message: 'Preset berhasil diperbarui di GitHub!' });

    } catch (error) {
        console.error('Error saat memproses permintaan:', error.message);
        res.status(500).json({ message: `Terjadi kesalahan pada server: ${error.message}` });
    }
};
