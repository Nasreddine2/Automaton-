# Automaton-

Automaton est un projet combinant un `clone` de egrep en JavaScript avec une interface web. Ce projet permet de filtrer du texte à l'aide d'expressions régulières, de télécharger des livres via une API du site Project Gutenberg, et de comparer les performances entre une implémentation personnalisée de recherche de texte (via KMP ou un automate fini) et la commande `egrep` d'un terminal Unix.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Conditions pour tester la performance de `egrep`](#conditions-pour-tester-la-performance-de-egrep)
- [Fonctionnement du projet](#fonctionnement-du-projet)

## Fonctionnalités

- Filtrage de texte à l'aide d'expressions régulières
- Support des expressions régulières complexes
- Interface utilisateur simple et intuitive
- Comparaison des performances entre l'implémentation et la commande `egrep`
- Téléchargement de livres depuis Project Gutenberg via un backend Node.js

## Technologies utilisées

- **Front-end** : React.js, Axios
- **Back-end** : Node.js, Express
- **Base de données** : Fichier `database.json` contenant les liens des livres de Project Gutenberg

## Installation

Pour cloner et exécuter ce projet, vous aurez besoin de Git et de Node.js (qui inclut npm) installés sur votre machine.

```bash
# Clonez le dépôt
git clone https://github.com/Nasreddine2/Automaton-.git

# Accédez au répertoire du projet
cd Automaton-

# Installez les dépendances
npm install
```

## Utilisation
Pour utiliser Automaton, exécutez simplement les commandes suivante:

```bash
# Démarrer le serveur backend :
cd Server
node server.js

# Démarrer l'application front-end :
cd Client
npm start
```

Ensuite, ouvrez votre navigateur et accédez à http://localhost:3000 pour voir l'application.

## Conditions pour tester la performance de `egrep`

Pour comparer les performances entre l'implémentation et `egrep`, un terminal Unix (Linux ou macOS) ou Git Bash sous Windows est nécessaire. La commande `egrep` est indispensable pour effectuer ces tests.
Si l'environnement est Windows, il est nécessaire d'utiliser Git Bash pour que la commande `egrep` soit disponible.

## Fonctionnement du projet

Clone egrep et Test de Performance : Implémentation d'un clone de `egrep` avec gestion des expressions régulières simples (KMP) et complexes (automate Aho-Ullman). Un test de performance compare cette implémentation avec la commande `egrep`.

## Licence
Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.
