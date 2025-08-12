const fs = require('fs');
const path = require('path');

const PRESETS_FILE = path.join(__dirname, '..', 'presets.json');


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

module.exports = (req, res) => {
  if (req.method === 'GET') {
    const presets = readPresets();
    res.status(200).json(presets);
  } else if (req.method === 'POST') {
    const newPreset = req.body;
    const presets = readPresets();
    newPreset.id = Date.now();
    presets.push(newPreset);
    writePresets(presets);
    res.status(201).json({ message: 'Preset added successfully', preset: newPreset });
  } else if (req.method === 'PUT') {
    // Di Vercel, parameter rute seperti :id diakses melalui req.query
    const presetId = parseInt(req.query.id); 
    const updatedPreset = req.body;
    let presets = readPresets();
    const index = presets.findIndex(p => p.id === presetId);
    if (index === -1) {
        return res.status(404).json({ message: 'Preset not found' });
    }
    presets[index] = { ...presets[index], ...updatedPreset };
    writePresets(presets);
    res.status(200).json({ message: 'Preset updated successfully', preset: presets[index] });
  } else if (req.method === 'DELETE') {
    // Di Vercel, parameter rute seperti :id diakses melalui req.query
    const presetId = parseInt(req.query.id);
    let presets = readPresets();
    const newPresets = presets.filter(p => p.id !== presetId);
    if (presets.length === newPresets.length) {
        return res.status(404).json({ message: 'Preset not found' });
    }
    writePresets(newPresets);
    res.status(200).json({ message: 'Preset deleted successfully' });
  } else {
    res.status(405).send('Method Not Allowed');
  }
};
