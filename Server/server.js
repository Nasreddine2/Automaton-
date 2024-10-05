const express = require("express");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs").promises;
const { exec, spawn } = require("child_process");

const path = require("path");

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

// Configuration de multer pour stocker temporairement les fichiers dans le dossier 'uploads'
const upload = multer({ dest: "uploads/" });

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

// Fonction pour convertir un chemin Windows en format compatible bash
const convertToBashPath = (winPath) => {
  return winPath.replace(/\\/g, "/");
};

// Endpoint pour exécuter la commande 'egrep'
app.post("/run-egrep", upload.single("file"), async (req, res) => {
  const { pattern, iterations } = req.body;

  const filePath = path.resolve(req.file.path); // Utiliser le chemin complet du fichier
  const bashFilePath = convertToBashPath(filePath); // Convertir le chemin pour bash

  try {
    // Vérifier si le fichier existe
    await fs.access(filePath);

    const results = [];

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime(); // Commencer à chronométrer

      // Force l'utilisation de bash pour exécuter egrep
      const egrepCommand = `egrep '${pattern}' '${bashFilePath}'`;

      const egrep = spawn("bash", ["-c", egrepCommand]);

      let stdoutData = "";
      let stderrData = "";

      // Capturer la sortie standard
      egrep.stdout.on("data", (data) => {
        stdoutData += data;
      });

      // Capturer la sortie d'erreur
      egrep.stderr.on("data", (data) => {
        stderrData += data;
      });

      // Lorsque le processus se termine
      await new Promise((resolve, reject) => {
        egrep.on("close", (code) => {
          const elapsed = process.hrtime(start);
          const elapsedTimeInMs = elapsed[0] * 1000 + elapsed[1] / 1000000;

          if (code !== 0 && code !== 1) {
            console.error(`Erreur d'exécution: ${stderrData}`);
            return reject(new Error("Erreur d'exécution du processus egrep"));
          }

          results.push({
            iteration: i + 1,
            executionTimeMs: parseFloat(elapsedTimeInMs.toFixed(2)), // Arrondir à 2 décimales
            output: stdoutData.trim() || "Aucun résultat trouvé.",
          });

          resolve();
        });
      });
    }

    // Supprimer le fichier temporaire après toutes les itérations
    await fs.unlink(filePath);

    // Retourner les résultats
    res.json({
      message: "Commande egrep exécutée avec succès.",
      iterations: results.length,
      details: { results },
    });
  } catch (error) {
    console.error("Erreur lors de l'exécution de la commande:", error);
    res
      .status(500)
      .send(`Erreur lors de l'exécution du processus egrep: ${error.message}`);
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
