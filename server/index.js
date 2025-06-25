const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/public')));

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve different HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

app.get('/nav', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/nav.html'));
});

app.get('/nav-v1', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/nav-v1.html'));
});

app.get('/nav-2', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/nav-2.html'));
});

app.get('/v3', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/v3.html'));
});

app.get('/simulation', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/simulation.html'));
});

// API endpoint to serve company data from Excel
app.get('/api/companies', (req, res) => {
    const workbook = XLSX.readFile(path.join(__dirname, '../2025_Mieterliste_Straße.xlsx'));
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    // Each row should have at least: company, house_number, logo_filename
    res.json(data);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Available routes:`);
    console.log(`- http://localhost:${PORT}/ (index.html)`);
    console.log(`- http://localhost:${PORT}/nav (nav.html)`);
    console.log(`- http://localhost:${PORT}/nav-v1 (nav-v1.html)`);
    console.log(`- http://localhost:${PORT}/nav-2 (nav-2.html)`);
    console.log(`- http://localhost:${PORT}/v3 (v3.html)`);
    console.log(`- http://localhost:${PORT}/simulation (simulation.html)`);
}); 