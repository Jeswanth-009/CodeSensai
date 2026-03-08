const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// This server runs in Codespaces and proxies to AWS Lambda
// OR runs standalone if AWS is not deployed yet

const API_URL = process.env.AWS_API_URL || null;

async function callLambda(endpoint, body) {
  if (API_URL) {
    // Forward to AWS
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return response.json();
  } else {
    // Call Bedrock directly if AWS_API_URL not set
    throw new Error('AWS_API_URL not configured in .env');
  }
}

app.post('/explain', async (req, res) => {
  try {
    const result = await callLambda('/explain', req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/followup', async (req, res) => {
  try {
    const result = await callLambda('/followup', req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/complexity', async (req, res) => {
  try {
    const result = await callLambda('/complexity', req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CodeSensei Local Server (Codespaces)',
    awsApiUrl: API_URL || 'not configured',
    timestamp: new Date().toISOString()
  });
});

// Serve web demo
app.use(express.static(path.join(__dirname, '../web-demo')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🥋 CodeSensei server running on port ${PORT}`);
  console.log(`📡 AWS API URL: ${API_URL || 'NOT SET — add AWS_API_URL to .env'}`);
});
