const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware pour gérer CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Endpoint pour télécharger un livre depuis Gutenberg
app.get('/download/:id', async (req, res) => {
  const bookId = req.params.id;
  const url = `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt`;

  try {
    const response = await axios.get(url, { responseType: 'blob' });
    
    // Définir les en-têtes de téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="pg${bookId}.txt"`);
    res.send(response.data);
  } catch (error) {
    console.error("Erreur lors du téléchargement du livre:", error);
    res.status(500).send('Erreur lors du téléchargement du livre');
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});

