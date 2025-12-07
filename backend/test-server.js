import express from 'express';

const app = express();
const PORT = 8000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Keep process alive
setInterval(() => {}, 1000);

export default app;
