// Simple test to check if the main dependencies work
const express = require('express');
const axios = require('axios');

console.log('✅ Dependencies loaded successfully');

const app = express();
app.use(express.json());

app.get('/test', (req, res) => {
    res.json({ status: 'ok', message: 'Test endpoint working' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Test server running on port ${PORT}`);
});