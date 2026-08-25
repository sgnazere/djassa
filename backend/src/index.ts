import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('API backend en ligne');
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});