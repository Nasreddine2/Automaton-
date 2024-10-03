const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware pour gérer CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Middleware pour parser le JSON
app.use(express.json());

// Endpoint pour télécharger un livre depuis Gutenberg
app.get("/download/:id", async (req, res) => {
  const bookId = req.params.id;
  const url = `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt`;

  try {
    const response = await axios.get(url, { responseType: "blob" });

    // Les en-têtes de téléchargement
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="pg${bookId}.txt"`
    );
    res.send(response.data);
  } catch (error) {
    console.error("Erreur lors du téléchargement du livre:", error);
    res.status(500).send("Erreur lors du téléchargement du livre");
  }
});

// Endpoint pour exécuter le test egrep
app.post("/run-egrep", (req, res) => {
  const { pattern, file, iterations } = req.body;

  // Commande egrep à exécuter
  const command = `bash -c 'for i in $(seq 1 ${iterations}); do start=$(date +%s%N); egrep "${pattern}" "${file}" > /dev/null; end=$(date +%s%N); echo $((end - start)); done'`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur d'exécution: ${error.message}`);
      return res.status(500).send(`Erreur: ${error.message}`);
    }
    if (stderr) {
      console.error(`Erreur stderr: ${stderr}`);
      return res.status(500).send(`Erreur: ${stderr}`);
    }

    // Transformer le résultat en tableau de temps
    const times = stdout.split('\n').filter(Boolean).map(Number);
    const median = calculateMedian(times);

    res.json({ times, median });
  });
});

// Fonction pour calculer la médiane
function calculateMedian(numbers) {
  const sorted = numbers.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
