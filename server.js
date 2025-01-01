// server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication credentials
const username = process.env.ONET_USERNAME;
const password = process.env.ONET_PASSWORD;
const token = Buffer.from(`${username}:${password}`).toString('base64');
const authHeader = `Basic ${token}`;

// O*NET API Base URL
const BASE_URL = 'https://services.onetcenter.org/ws/veterans/';

// Helper function for O*NET API requests
const fetchFromONET = async (endpoint) => {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching from O*NET at endpoint "${endpoint}": ${error.message}`);
    throw error;
  }
};

// 1. Military Search API
app.get('/api/military/search', async (req, res) => {
  const { keyword } = req.query;
  
  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    const data = await fetchFromONET(`military?keyword=${encodeURIComponent(keyword)}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data from O*NET' });
  }
});

// 2. Industry List API
app.get('/api/industries', async (req, res) => {
  try {
    const data = await fetchFromONET('browse/');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch industries from O*NET' });
  }
});

// 3. Industry Careers API
app.get('/api/industries/:code/careers', async (req, res) => {
  const { code } = req.params;
  const { category = 'all', sort = 'category', start = 1, end = 20 } = req.query;

  try {
    const data = await fetchFromONET(
      `browse/${code}?category=${category}&sort=${sort}&start=${start}&end=${end}`
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch careers from O*NET' });
  }
});

// 4. Keyword Search API
app.get('/api/careers/search', async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    const data = await fetchFromONET(`search?keyword=${encodeURIComponent(keyword)}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch careers from O*NET' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});