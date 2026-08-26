import express from 'express';
import dotenv from 'dotenv';
import categorieRoutes from './routes/categorie.routes';
import prestataireRoutes from './routes/prestataire.routes';


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', categorieRoutes);
app.use('/api', prestataireRoutes);

app.get('/', (req, res) => {
  res.send('API backend en ligne');

});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});