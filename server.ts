import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const API_KEY = process.env.JASAOTP_API_KEY || '922a0af8d090b32ee2e6114a6e572799'; // Default from user prompt for convenience, but env is preferred

  app.use(express.json());

  // Proxy Routes for JasaOTP
  const BASE_URL = 'https://api.jasaotp.id/v1';

  app.get('/api/balance', async (req, res) => {
    try {
      const response = await fetch(`${BASE_URL}/balance.php?api_key=${API_KEY}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch balance' });
    }
  });

  app.get('/api/countries', async (req, res) => {
    try {
      const response = await fetch(`${BASE_URL}/negara.php`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch countries' });
    }
  });

  app.get('/api/operators', async (req, res) => {
    const { negara } = req.query;
    try {
      const response = await fetch(`${BASE_URL}/operator.php?negara=${negara}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch operators' });
    }
  });

  app.get('/api/services', async (req, res) => {
    const { negara } = req.query;
    try {
      const response = await fetch(`${BASE_URL}/layanan.php?negara=${negara}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      // Apply 3000 IDR markup to all prices for profit
      const PROFIT_MARGIN = 3000;
      
      const applyMarkup = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        
        for (const key in obj) {
          const item = obj[key];
          if (item && typeof item === 'object') {
            if ('harga' in item) {
              const originalPrice = Number(item.harga) || 0;
              item.harga = originalPrice + PROFIT_MARGIN;
            } else {
              applyMarkup(item);
            }
          }
        }
      };

      applyMarkup(data);
      res.json(data);
    } catch (error) {
      console.error('API Error /api/services:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch services from provider' });
    }
  });

  app.post('/api/order', async (req, res) => {
    const { negara, layanan, operator } = req.body;
    try {
      const url = `${BASE_URL}/order.php?api_key=${API_KEY}&negara=${negara}&layanan=${layanan}&operator=${operator}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('API Error /api/order:', error);
      res.status(500).json({ success: false, message: 'Failed to place order with provider' });
    }
  });

  app.get('/api/sms', async (req, res) => {
    const { order_id } = req.query;
    try {
      const response = await fetch(`${BASE_URL}/sms.php?api_key=${API_KEY}&id=${order_id}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch SMS' });
    }
  });

  app.post('/api/cancel', async (req, res) => {
    const { order_id } = req.body;
    try {
      const response = await fetch(`${BASE_URL}/cancel.php?api_key=${API_KEY}&id=${order_id}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
