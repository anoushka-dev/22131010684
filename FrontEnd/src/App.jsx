import React, { useEffect, useState } from 'react';
import logger from './logger';
import { withLogging } from './loggingMiddleware';
import {
  Container, Typography, Box, TextField, Button, Alert, List, ListItem, ListItemText, Chip, Stack, Paper
} from '@mui/material';
import './App.css';

function isValidShortcode(code) {
  return /^[a-zA-Z0-9]{3,16}$/.test(code);
}

function generateShortUrl(existingShorts) {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 8);
  } while (existingShorts.has(code));
  return code;
}

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [shortened, setShortened] = useState(() => {
    try {
      const saved = localStorage.getItem('shortened-urls');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [error, setError] = useState('');
  const [validity, setValidity] = useState('');
  const [customCode, setCustomCode] = useState('');

  // Persist shortened URLs to localStorage
  useEffect(() => {
    localStorage.setItem('shortened-urls', JSON.stringify(shortened));
    logger('Shortened list updated', shortened);
  }, [shortened]);

  const handleShorten = withLogging((e) => {
    e.preventDefault();
    setError('');
    let code = customCode.trim();
    const existingCodes = new Set(shortened.map(s => s.shortUrl));
    if (!longUrl.trim()) {
      setError('Please enter a URL.');
      logger('Error: empty URL input');
      return;
    }
    try {
      new URL(longUrl);
    } catch {
      setError('Invalid URL format. Please enter a valid URL including http(s)://');
      logger('Error: invalid URL format', longUrl);
      return;
    }
    if (code) {
      if (!isValidShortcode(code)) {
        setError('Shortcode must be 3-16 alphanumeric characters.');
        logger('Error: invalid shortcode', code);
        return;
      }
      if (existingCodes.has(code)) {
        setError('Shortcode already in use. Please choose another.');
        logger('Error: shortcode not unique', code);
        return;
      }
    } else {
      code = generateShortUrl(existingCodes);
    }
    // Validity
    let mins = parseInt(validity, 10);
    if (isNaN(mins) || mins <= 0) mins = 30;
    const expiresAt = Date.now() + mins * 60 * 1000;
    setShortened([{ longUrl, shortUrl: code, expiresAt }, ...shortened]);
    logger('Short URL created', { longUrl, code, expiresAt });
    setLongUrl('');
    setCustomCode('');
    setValidity('');
  }, 'handleShorten');

  // Routing: handle /:shortcode
  useEffect(() => {
    const path = window.location.pathname.slice(1);
    if (path) {
      const found = shortened.find(s => s.shortUrl === path);
      if (found) {
        if (Date.now() > found.expiresAt) {
          logger('Short URL expired', found);
          setError('This short URL has expired.');
        } else {
          logger('Redirecting to long URL', found.longUrl);
          window.location.replace(found.longUrl);
        }
      }
    }
  }, [shortened]);

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 4 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" color="primary" fontWeight={700} gutterBottom align="center">
          <span role="img" aria-label="link" style={{marginRight: 8}}>🔗</span>
          URL Shortener
        </Typography>
        <Box component="form" onSubmit={handleShorten} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
          <TextField
            label="Long URL"
            placeholder="Enter a long URL..."
            value={longUrl}
            onChange={e => setLongUrl(e.target.value)}
            fullWidth
            required
            autoFocus
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Custom Shortcode (optional)"
            placeholder="e.g. mylink123"
            value={customCode}
            onChange={e => setCustomCode(e.target.value)}
            inputProps={{ maxLength: 16 }}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Validity (minutes, default 30)"
            placeholder="30"
            value={validity}
            onChange={e => setValidity(e.target.value)}
            type="number"
            inputProps={{ min: 1 }}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <Button type="submit" variant="contained" size="large" sx={{ mt: 1, fontWeight: 600 }}>
            Shorten
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="h6" color="primary" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
          Shortened URLs
        </Typography>
        <List sx={{ width: '100%' }}>
          {shortened.length === 0 && <ListItem><ListItemText primary="No URLs shortened yet." /></ListItem>}
          {shortened.map(({ longUrl, shortUrl, expiresAt }, idx) => (
            <ListItem key={idx} sx={{ mb: 1, bgcolor: '#f1f5f9', borderRadius: 2, boxShadow: 1 }}>
              <Stack direction="column" spacing={0.5} sx={{ width: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip label={shortUrl} color="primary" size="small" sx={{ fontWeight: 700 }} />
                  <Button
                    href={`/${shortUrl}`}
                    size="small"
                    variant="text"
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    {window.location.origin}/{shortUrl}
                  </Button>
                </Stack>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  <strong>Original:</strong> <a href={longUrl} target="_blank" rel="noopener noreferrer">{longUrl}</a>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <strong>Expires:</strong> {new Date(expiresAt).toLocaleString()}
                </Typography>
              </Stack>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}

export default App;
