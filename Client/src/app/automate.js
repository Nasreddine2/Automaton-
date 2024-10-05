import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import ResultsTable from "./tableau";
import SyntaxTree from "./arbre";
import AutomateVisualizer from "./visualiser";

// Compteur d'état global pour assurer des identifiants uniques
let stateCounter = 0;

// Classe Automate pour stocker les états et transitions
class Automate {
  constructor() {
    this.states = [];
    this.transitions = [];
    this.startState = null;
    this.endStates = new Set(); // Utilisation d'un ensemble pour gérer plusieurs états finaux
  }

  // Fonction pour ajouter un état avec un identifiant unique
  addState() {
    const newState = stateCounter++;
    this.states.push(newState);
    return newState;
  }

  addTransition(from, to, symbol) {
    this.transitions.push({ from, to, symbol });
  }

  setStartState(state) {
    this.startState = state;
  }

  setEndState(state) {
    this.endStates.add(state); // Ajouter à l'ensemble des états finaux
  }

  getAutomate() {
    return {
      states: this.states,
      transitions: this.transitions,
      startState: this.startState,
      endStates: this.endStates, // Retourner les états finaux sous forme d'ensemble
    };
  }
}

// Fonction pour créer un automate pour un symbole
const createBaseAutomate = (symbol) => {
  const automate = new Automate();
  const start = automate.addState();
  const end = automate.addState();
  automate.addTransition(start, end, symbol);
  automate.setStartState(start);
  automate.setEndState(end);
  return automate;
};

// Fonction pour concaténer deux automates
const concatenateAutomates = (automate1, automate2) => {
  const automate = new Automate();

  // Copier les états et transitions des deux automates
  automate.states = [...automate1.states, ...automate2.states];
  automate.transitions = [...automate1.transitions, ...automate2.transitions];

  // Ajouter une transition epsilon entre la fin du premier automate et le début du second
  automate.addTransition(
    automate1.endStates.values().next().value,
    automate2.startState,
    "ε"
  );

  // Définir les nouveaux états de départ et de fin
  automate.setStartState(automate1.startState);
  automate.setEndState(automate2.endStates.values().next().value);

  return automate;
};

// Fonction pour gérer l'union de deux automates (opérateur |)
const unionAutomates = (automate1, automate2) => {
  const automate = new Automate();
  const start = automate.addState(); // Nouvel état de départ
  const end = automate.addState(); // Nouvel état de fin

  // Copier les états et transitions des deux automates
  automate.states = [...automate1.states, ...automate2.states, start, end];
  automate.transitions = [...automate1.transitions, ...automate2.transitions];

  // Ajouter des transitions epsilon du nouvel état initial vers les deux sous-automates
  automate.addTransition(start, automate1.startState, "ε");
  automate.addTransition(start, automate2.startState, "ε");

  // Ajouter des transitions epsilon des états finaux des sous-automates vers le nouvel état final
  automate1.endStates.forEach((state) => {
    automate.addTransition(state, end, "ε");
  });
  automate2.endStates.forEach((state) => {
    automate.addTransition(state, end, "ε");
  });

  // Définir les nouveaux états de départ et de fin
  automate.setStartState(start);
  automate.setEndState(end);

  return automate;
};

// Fonction pour gérer la fermeture de Kleene (opérateur *)
const kleeneAutomate = (automate1) => {
  const automate = new Automate();
  const start = automate.addState(); // Nouvel état de départ
  const end = automate.addState(); // Nouvel état de fin

  // Copier les états et transitions du premier automate
  automate.states = [...automate1.states, start, end];
  automate.transitions = [...automate1.transitions];

  // Ajouter des transitions epsilon pour la fermeture de Kleene
  automate.addTransition(start, automate1.startState, "ε");
  automate.addTransition(automate1.endStates.values().next().value, end, "ε");
  automate.addTransition(
    automate1.endStates.values().next().value,
    automate1.startState,
    "ε"
  ); // Boucle
  automate.addTransition(start, end, "ε"); // Transition directe

  // Définir les nouveaux états de départ et de fin
  automate.setStartState(start);
  automate.setEndState(end);

  return automate;
};

// Fonction pour gérer l'opérateur +
const plusAutomate = (automate1) => {
  const automate = new Automate();
  const start = automate.addState(); // Nouvel état de départ
  const end = automate.addState(); // Nouvel état de fin

  // Copier les états et transitions du premier automate
  automate.states = [...automate1.states, start, end];
  automate.transitions = [...automate1.transitions];

  // Ajouter des transitions epsilon pour l'opérateur +
  automate.addTransition(start, automate1.startState, "ε");
  automate.addTransition(automate1.endStates.values().next().value, end, "ε");
  automate.addTransition(
    automate1.endStates.values().next().value,
    automate1.startState,
    "ε"
  ); // Boucle

  // Définir les nouveaux états de départ et de fin
  automate.setStartState(start);
  automate.setEndState(end);

  return automate;
};

// Fonction pour insérer les concaténations implicites dans une regex
const ajouterConcatImpl = (regex) => {
  let resultat = "";

  for (let i = 0; i < regex.length; i++) {
    const char = regex[i];
    resultat += char;

    // Ajouter une concaténation implicite si nécessaire
    if (i + 1 < regex.length) {
      const nextChar = regex[i + 1];

      // Condition pour ajouter une concaténation implicite
      if (
        char !== "(" &&
        char !== "|" &&
        char !== "." && // Si le caractère actuel n'est pas un opérateur
        nextChar !== ")" &&
        nextChar !== "|" &&
        nextChar !== "*" &&
        nextChar !== "+" &&
        nextChar !== "." // Si le prochain caractère n'est pas un opérateur
      ) {
        resultat += "."; // Ajouter une concaténation explicite
      }
    }
  }

  return resultat;
};

// Fonction pour parser une expression régulière en respectant les priorités et les parenthèses
const parseRegex = (regex) => {
  // Ajouter les concaténations implicites avant de parser
  regex = ajouterConcatImpl(regex);

  const precedence = { "|": 1, ".": 2, "*": 3, "+": 3 };
  const operators = [];
  const output = [];

  const isOperator = (char) => ["|", ".", "*", "+"].includes(char);

  const applyOperator = () => {
    const operator = operators.pop();
    if (operator === ".") {
      const b = output.pop();
      const a = output.pop();
      output.push([".", a, b]);
    } else if (operator === "|") {
      const b = output.pop();
      const a = output.pop();
      output.push(["|", a, b]);
    } else if (operator === "*") {
      const a = output.pop();
      output.push(["*", a]);
    } else if (operator === "+") {
      const a = output.pop();
      output.push(["+", a]);
    }
  };

  let i = 0;
  while (i < regex.length) {
    const char = regex[i];

    if (char === "(") {
      // Trouver la sous-expression entre parenthèses
      let j = i;
      let openParentheses = 1;
      while (openParentheses > 0 && ++j < regex.length) {
        if (regex[j] === "(") openParentheses++;
        if (regex[j] === ")") openParentheses--;
      }

      // Appeler récursivement `parseRegex` sur la sous-expression
      const subexpression = regex.slice(i + 1, j);
      output.push(parseRegex(subexpression));
      i = j; // Avancer jusqu'à la parenthèse fermante
    } else if (!isOperator(char)) {
      output.push(char); // Ajouter les symboles au output
    } else {
      while (
        operators.length > 0 &&
        operators[operators.length - 1] !== "(" &&
        precedence[operators[operators.length - 1]] >= precedence[char]
      ) {
        applyOperator();
      }
      operators.push(char);
    }
    i++;
  }

  // Appliquer les opérateurs restants
  while (operators.length > 0) {
    applyOperator();
  }

  return output[0];
};

// Fonction pour parcourir l'arbre syntaxique et créer l'automate
const parseArbre = (arbre) => {
  if (typeof arbre === "string") {
    return createBaseAutomate(arbre); // Si c'est un symbole
  }

  const [op, ...args] = arbre;

  switch (op) {
    case ".": {
      // Concaténation
      let result = parseArbre(args[0]);
      for (let i = 1; i < args.length; i++) {
        result = concatenateAutomates(result, parseArbre(args[i]));
      }
      return result;
    }

    case "|": {
      // Union
      let result = parseArbre(args[0]);
      for (let i = 1; i < args.length; i++) {
        result = unionAutomates(result, parseArbre(args[i]));
      }
      return result;
    }

    case "*": {
      // Fermeture de Kleene
      return kleeneAutomate(parseArbre(args[0]));
    }

    case "+": {
      // L'opérateur +
      return plusAutomate(parseArbre(args[0]));
    }

    default:
      throw new Error(`Opérateur non supporté: ${op}`);
  }
};

//

//

// Fonction pour calculer le tableau LPS (Longest Prefix Suffix)
const computeLPSArray = (pat, M, lps) => {
  let len = 0;
  let i = 1;
  lps[0] = 0;

  while (i < M) {
    if (pat[i] === pat[len]) {
      len++;
      lps[i] = len;
      i++;
    } else {
      if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }
};

// Algorithme KMP
const KMPSearch = (txt, pat) => {
  const M = pat.length;
  const N = txt.length;

  const lpsTable = new Array(M).fill(0);
  computeLPSArray(pat, M, lpsTable);

  let i = 0; // Index pour txt[]
  let j = 0; // Index pour pat[]
  const positions = [];

  while (i < N) {
    if (pat[j] === txt[i]) {
      i++;
      j++;
    }

    if (j === M) {
      positions.push(i - j);
      j = lpsTable[j - 1];
    } else if (i < N && pat[j] !== txt[i]) {
      if (j !== 0) {
        j = lpsTable[j - 1];
      } else {
        i++;
      }
    }
  }

  return { positions, lpsTable };
};

//

//

//

// Fonction pour générer l'automate à partir d'une expression régulière
const construireAutomate = (regex) => {
  const arbre = parseRegex(regex); // Construire l'arbre syntaxique à partir du regex

  return parseArbre(arbre); // Construire l'automate à partir de l'arbre syntaxique
};

// Fonction pour tester si une sous-chaîne est acceptée par l'automate
const estAccepte = (
  automate,
  chaine,
  index = 0,
  etatCourant = automate.startState
) => {
  if (index === chaine.length) {
    return automate.endStates.has(etatCourant); // Vérifier si l'état courant est un état final
  }

  const symbol = chaine[index];
  let transitions = automate.transitions.filter((t) => t.from === etatCourant);

  // Parcourir les transitions epsilon
  for (let trans of transitions) {
    if (trans.symbol === "ε") {
      if (estAccepte(automate, chaine, index, trans.to)) {
        return true;
      }
    }
  }

  // Parcourir les transitions pour le symbole courant
  for (let trans of transitions) {
    if (trans.symbol === symbol) {
      if (estAccepte(automate, chaine, index + 1, trans.to)) {
        return true;
      }
    }
  }

  return false;
};

// Fonction pour tester si une sous-chaîne (motif) est présente dans un mot
const testMotifDansMot = (automate, mot) => {
  // Essayer toutes les sous-chaînes du mot pour trouver le motif
  for (let i = 0; i < mot.length; i++) {
    for (let j = i; j <= mot.length; j++) {
      const sousChaine = mot.slice(i, j);
      if (estAccepte(automate, sousChaine)) {
        return true; // Si une sous-chaîne correspond au motif, retourner vrai
      }
    }
  }
  return false;
};

// Fonction pour tester toutes les sous-chaînes acceptées dans une ligne de texte
const TestTxt = (automate, line) => {
  const mots = line.split(" "); // Diviser la ligne en mots
  for (let mot of mots) {
    if (testMotifDansMot(automate, mot)) {
      return true; // Si un mot contient le motif, retourner vrai
    }
  }
  return false; // Si aucun mot ne contient le motif, retourner faux
};

// Fonction pour calculer la fermeture epsilon d'un état donné
const epsilonClosure = (automate, state) => {
  const closure = new Set([state]);
  const stack = [state];

  while (stack.length > 0) {
    const currentState = stack.pop();
    const epsilonTransitions = automate.transitions.filter(
      (t) => t.from === currentState && t.symbol === "ε"
    );

    for (const transition of epsilonTransitions) {
      if (!closure.has(transition.to)) {
        closure.add(transition.to);
        stack.push(transition.to);
      }
    }
  }

  return closure;
};

// Fonction pour calculer la fermeture epsilon d'un ensemble d'états
const epsilonClosureSet = (automate, states) => {
  let closure = new Set();
  for (const state of states) {
    closure = new Set([...closure, ...epsilonClosure(automate, state)]);
  }
  return closure;
};

// Fonction pour calculer la transition d'un ensemble d'états sur un symbole donné
const move = (automate, states, symbol) => {
  const nextStates = new Set();
  for (const state of states) {
    const transitions = automate.transitions.filter(
      (t) => t.from === state && t.symbol === symbol
    );
    for (const transition of transitions) {
      nextStates.add(transition.to);
    }
  }
  return nextStates;
};

// Fonction pour déterminiser un automate non déterministe avec epsilon transitions
const determinizeAutomate = (nfa) => {
  const dfa = new Automate();
  const alphabet = Array.from(
    new Set(nfa.transitions.map((t) => t.symbol).filter((s) => s !== "ε"))
  );

  const initialClosure = epsilonClosure(nfa, nfa.startState);
  const dfaStatesMap = new Map();
  dfaStatesMap.set(JSON.stringify([...initialClosure]), dfa.addState());
  dfa.setStartState(dfaStatesMap.get(JSON.stringify([...initialClosure])));

  const unprocessedStates = [initialClosure];

  while (unprocessedStates.length > 0) {
    const currentSet = unprocessedStates.pop();
    const currentStateId = dfaStatesMap.get(JSON.stringify([...currentSet]));

    // Vérifier si l'un des états de l'ensemble est un état final du NFA
    if ([...currentSet].some((state) => nfa.endStates.has(state))) {
      dfa.setEndState(currentStateId); // Marquer cet état comme final dans le DFA
    }

    for (const symbol of alphabet) {
      const nextSet = epsilonClosureSet(nfa, move(nfa, currentSet, symbol));

      if (nextSet.size === 0) continue; // Ignorer les ensembles vides

      const nextSetKey = JSON.stringify([...nextSet]);

      if (!dfaStatesMap.has(nextSetKey)) {
        const newState = dfa.addState();
        dfaStatesMap.set(nextSetKey, newState);
        unprocessedStates.push(nextSet);
      }

      dfa.addTransition(currentStateId, dfaStatesMap.get(nextSetKey), symbol);
    }
  }

  return dfa;
};

const removeInaccessibleStates = (automate) => {
  const reachableStates = new Set([automate.startState]);
  const stack = [automate.startState];

  while (stack.length > 0) {
    const currentState = stack.pop();
    const transitions = automate.transitions.filter(
      (t) => t.from === currentState
    );

    for (const transition of transitions) {
      if (!reachableStates.has(transition.to)) {
        reachableStates.add(transition.to);
        stack.push(transition.to);
      }
    }
  }

  // Filtrer les états et les transitions pour ne conserver que les états accessibles
  automate.states = automate.states.filter((state) =>
    reachableStates.has(state)
  );
  automate.transitions = automate.transitions.filter(
    (t) => reachableStates.has(t.from) && reachableStates.has(t.to)
  );

  return automate;
};

// Fonction pour effectuer la minimisation avec l'algorithme de Moore
const minimizeAutomate = (dfa) => {
  // Étape 1: Supprimer les états inaccessibles
  removeInaccessibleStates(dfa);

  // Étape 2: Partitionner les états en deux ensembles: états finaux et non finaux
  let partitions = [new Set(), new Set()];
  dfa.states.forEach((state) => {
    if (dfa.endStates.has(state)) {
      partitions[0].add(state); // États finaux
    } else {
      partitions[1].add(state); // États non finaux
    }
  });

  let stable = false;
  const alphabet = Array.from(new Set(dfa.transitions.map((t) => t.symbol)));

  // Étape 3: Raffiner les partitions
  while (!stable) {
    stable = true;
    const newPartitions = [];

    const partitionsCopy = partitions.slice();

    for (const partition of partitionsCopy) {
      const partitionMap = new Map();

      for (const state of partition) {
        const signature = alphabet
          .map((symbol) => {
            const transition = dfa.transitions.find(
              (t) => t.from === state && t.symbol === symbol
            );
            const targetState = transition ? transition.to : null;

            // Trouver la partition contenant l'état cible
            const partitionIndex = partitionsCopy.findIndex((p) =>
              p.has(targetState)
            );
            return partitionIndex;
          })
          .join("-");

        if (!partitionMap.has(signature)) {
          partitionMap.set(signature, new Set());
        }
        partitionMap.get(signature).add(state);
      }

      // Ajouter les nouvelles partitions
      newPartitions.push(...partitionMap.values());
    }

    // Si les partitions ont changé, on continue la boucle
    if (newPartitions.length !== partitions.length) {
      stable = false;
    }

    partitions = newPartitions;
  }

  // Étape 4: Construire le nouvel automate minimisé
  const minimizedAutomate = new Automate();
  const stateMap = new Map(); // Map pour relier les anciens états aux nouveaux états

  partitions.forEach((partition, index) => {
    const newState = minimizedAutomate.addState();
    partition.forEach((state) => stateMap.set(state, newState));

    // Marquer l'état comme final s'il contient un ancien état final
    if ([...partition].some((state) => dfa.endStates.has(state))) {
      minimizedAutomate.setEndState(newState);
    }
  });

  // Recréer les transitions dans l'automate minimisé sans duplicata
  dfa.transitions.forEach((t) => {
    const fromState = stateMap.get(t.from);
    const toState = stateMap.get(t.to);

    // Vérifier si la transition existe déjà
    if (
      !minimizedAutomate.transitions.some(
        (trans) =>
          trans.from === fromState &&
          trans.to === toState &&
          trans.symbol === t.symbol
      )
    ) {
      minimizedAutomate.addTransition(fromState, toState, t.symbol);
    }
  });

  // Définir l'état initial
  minimizedAutomate.setStartState(stateMap.get(dfa.startState));

  return minimizedAutomate;
};

//

//

// Fonction pour mesurer le temps moyen d'exécution sur plusieurs itérations KMP
const measureExecutionTime = (txt, pat, numIterations) => {
  const res = [];
  for (let i = 0; i < numIterations; i++) {
    const startTime = performance.now();
    KMPSearch(txt, pat);
    const endTime = performance.now();

    const iterationTime = parseFloat((endTime - startTime).toFixed(2)); // Arrondir à 2 décimales
    if (iterationTime > 0.01) {
      // Filtre les valeurs proches de 0
      res.push({
        iteration: i + 1,
        time: iterationTime,
      });
    }
  }
  return res;
};

// Fonction pour mesurer le temps moyen d'exécution sur plusieurs itérations AUTOMATE
const measureExecutionTimeAutomate = (txt, pat, numIterations) => {
  const res = [];

  for (let i = 0; i < numIterations; i++) {
    const startTime = performance.now();

    const automate = construireAutomate(pat); // Générer l'automate à partir du regex
    const dfa = determinizeAutomate(automate); // Déterminiser l'automate
    const minDfa = minimizeAutomate(dfa); // Minimiser l'automate déterminisé

    TestTxt(minDfa, txt);

    const endTime = performance.now();

    const iterationTime = parseFloat((endTime - startTime).toFixed(2)); // Arrondir à 2 décimales
    if (iterationTime > 0.01) {
      // Filtre les valeurs proches de 0
      res.push({
        iteration: i + 1,
        time: iterationTime,
      });
    }
  }

  return res;
};

//

//

// Composant principal de l'application
const Automaton = () => {
  const [arbre, setArbre] = useState(null); // Arbre syntaxique
  const [automate, setAutomate] = useState(null); // Automate (NFA ou DFA)
  const [detAutomate, setDetAutomate] = useState(null); // Automate déterminisé (DFA)
  const [MinAutomate, setMinAutomate] = useState(null); // Automate Min (Min)
  const [regex, setRegex] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileTextContent, setFileTextContent] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchkmp, setSearchKmp] = useState(false);
  const [searchAutomate, setSearchAutomate] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [iterations, setIterations] = useState(1);
  const [executionTime, setExecutionTime] = useState(null); // Temps moyen d'exécution
  const [medianTime, setMedianTime] = useState(null); // Temps d'exécution médian
  const [executionTimeEgrep, setExecutionTimeEgrep] = useState(null); // Temps moyen d'exécution
  const [medianTimeEgrep, setMedianTimeEgrep] = useState(null); // Temps d'exécution médian
  const [selectedFile, setSelectedFile] = useState(null);
  const [showTime, setShowTime] = useState(false);
  const [textTime, setTextTime] = useState("Test Performance");
  const [nbiteration, setNbiteration] = useState(1);
  //
  const [timesearch, setTimesearch] = useState(null);
  const [resegrep, setResegrep] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  //

  const isKmp = () => {
    if (regex.length > 0) {
      if (
        regex.includes("|") ||
        regex.includes("*") ||
        regex.includes("+") ||
        regex.includes(".") ||
        regex.includes("(") ||
        regex.includes(")") ||
        regex.includes("ε")
      ) {
        return false;
      } else {
        return true;
      }
    }
  };
  // Fonction pour générer l'arbre syntaxique à partir de l'expression régulière
  const handleGenerateArbre = async () => {
    return new Promise((resolve) => {
      stateCounter = 0; // Réinitialiser le compteur d'état
      const arbre = parseRegex(regex); // Générer l'arbre à partir du regex
      setArbre(arbre); // Stocker l'arbre
      setAutomate(null); // Réinitialiser l'automate
      setDetAutomate(null); // Réinitialiser l'automate déterminisé
      setMinAutomate(null); // Réinitialiser l'automate minimisé
      resolve(); // Marquer la fonction comme terminée
    });
  };

  // Fonction pour générer l'automate (NFA)
  const handleGenerateAutomate = async () => {
    return new Promise((resolve) => {
      stateCounter = 0; // Réinitialiser le compteur d'état
      const automate = construireAutomate(regex); // Générer l'automate à partir du regex
      setAutomate(automate); // Stocker l'automate NFA

      setDetAutomate(null); // Réinitialiser l'automate déterminisé
      setMinAutomate(null); // Réinitialiser l'automate minimisé
      resolve(); // Marquer la fonction comme terminée
    });
  };

  // Fonction pour déterminiser l'automate (NFA -> DFA)
  const handleDeterminizeAutomate = async () => {
    return new Promise((resolve) => {
      if (automate) {
        const dfa = determinizeAutomate(automate); // Déterminiser l'automate
        setDetAutomate(dfa); // Stocker l'automate déterminisé
        setMinAutomate(null); // Réinitialiser l'automate minimisé
      }
      resolve(); // Marquer la fonction comme terminée
    });
  };

  // Fonction pour minimiser l'automate déterminisé (DFA)
  const handleMinimizeAutomate = async () => {
    return new Promise((resolve) => {
      if (detAutomate) {
        const minDfa = minimizeAutomate(detAutomate); // Minimiser l'automate déterminisé
        setMinAutomate(minDfa); // Stocker l'automate minimisé
      }
      resolve(); // Marquer la fonction comme terminée
    });
  };

  // Fonction de recherche utilisant l'automate
  const handleSearch = async () => {
    if (!MinAutomate) return; // Si l'automate minimisé est null, arrêter

    const lines = fileTextContent.split("\n"); // Diviser le contenu du fichier par ligne
    const results = lines.filter((line) => TestTxt(MinAutomate, line)); // Tester chaque ligne

    setSearchResults(results); // Stocker les résultats
  };

  // Fonction pour charger le fichier

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    if (file) {
      setFileContent(file);

      const reader = new FileReader();
      reader.onload = () => {
        setFileTextContent(reader.result);
      };
      reader.readAsText(file);
    }
  };

  //

  // Fonction de recherche utilisant KMP
  // Fonction pour tester chaque ligne du fichier avec le pattern
  const handleSearchKMP = () => {
    const lines = fileTextContent.split("\n");
    const res = [];
    lines.forEach((line, index) => {
      const { positions, lpsTable } = KMPSearch(line, regex);
      if (positions.length > 0) {
        res.push({
          lineNumber: index + 1,
          lineText: line,
          positions,
          lpsTable,
        });
      }
    });
    setSearchResults(res); // Stocker les résultats de la recherche
  };

  const handleAll = async () => {
    if (!regex || !fileTextContent)
      return alert("Veuillez sélectionner un fichier et entrer un motif !");
    setSearchResults([]); // Réinitialiser les résultats de la recherche

    // Vérifier si on utilise KMP ou l'automate
    if (isKmp()) {
      setSearchKmp(true);
      setSearchAutomate(false);
      handleSearchKMP(); // Exécuter la recherche avec KMP
    } else {
      setSearchKmp(false);
      setSearchAutomate(true);

      try {
        // Générer l'arbre
        await handleGenerateArbre();

        // Générer l'automate
        await handleGenerateAutomate();

        // Déterminiser l'automate
        await handleDeterminizeAutomate();

        // Minimiser l'automate déterminisé
        await handleMinimizeAutomate();
      } catch (error) {
        console.error("Erreur lors du traitement de l'automate :", error);
      }
    }
  };

  //

  //

  const handleEgrep = async () => {
    if (!fileContent || !regex) {
      alert("Veuillez sélectionner un fichier et entrer un motif !");
      return null; // Retourner null si une erreur se produit
    }

    const formData = new FormData();
    formData.append("file", fileContent);
    formData.append("pattern", regex);
    formData.append("iterations", iterations);

    try {
      const response = await axios.post(
        "http://localhost:3001/run-egrep",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const results = response.data.details.results;
      setResegrep(results); // Mettez à jour l'état avec les résultats
      console.log(results);
      return results; // Retourner les résultats pour les utiliser dans handleAllTime
    } catch (error) {
      console.error("Erreur lors de l'exécution egrep:", error);
      alert("Une erreur est survenue lors de l'exécution egrep");
      return null; // Retourner null en cas d'erreur
    }
  };

  const handleAllTime = async () => {
    // Ajouter async ici
    if (!regex || !fileTextContent) {
      return alert("Veuillez sélectionner un fichier et entrer un motif !");
    }

    setSearchResults([]); // Réinitialiser les résultats de la recherche

    // Attendre les résultats de handleEgrep
    const egrepResults = await handleEgrep();
    if (!egrepResults) {
      return; // Sortir si handleEgrep a échoué
    }

    let res = [];
    if (isKmp()) {
      setSearchKmp(true);
      setSearchAutomate(false);
      res = measureExecutionTime(fileTextContent, regex, iterations); // Mesurer le temps

      let averageTime = 0;
      let medianTime = 0;

      if (res && res.length > 0) {
        averageTime =
          res.reduce((acc, curr) => acc + curr.time, 0) / res.length;
        medianTime = res[Math.floor(res.length / 2)].time;
      } else {
        console.warn(
          "Aucun résultat n'a été retourné par measureExecutionTime."
        );
      }

      setExecutionTime(averageTime); // Stocker le temps d'exécution moyen
      setMedianTime(medianTime); // Stocker le temps d'exécution médian
      setNbiteration(iterations);
    } else {
      setSearchKmp(false);
      setSearchAutomate(true);

      res = measureExecutionTimeAutomate(fileTextContent, regex, iterations); // Mesurer le temps

      let averageTime = 0;
      let medianTime = 0;

      if (res && res.length > 0) {
        averageTime =
          res.reduce((acc, curr) => acc + curr.time, 0) / res.length;
        medianTime = res[Math.floor(res.length / 2)].time;
      } else {
        console.warn(
          "Aucun résultat n'a été retourné par measureExecutionTimeAutomate."
        );
      }

      setExecutionTime(averageTime); // Stocker le temps d'exécution moyen
      setMedianTime(medianTime); // Stocker le temps d'exécution médian
      setNbiteration(iterations);
    }

    // Mettre à jour timesearch avec les résultats
    setTimesearch({ results: res, egrep: egrepResults });
    console.log("timesearch", { results: res, egrep: egrepResults }); // Afficher les résultats
  };

  //

  const handleReset = () => {
    setRegex("");
    setFileContent("");
    setFileTextContent("");
    setArbre(null);
    setAutomate(null);
    setDetAutomate(null);
    setMinAutomate(null);
    setSearchResults([]);
    setSearchKmp(false);
    setSearchAutomate(false);
    setShowModal(false);
    setExecutionTime(null);
    setMedianTime(null);
    setExecutionTimeEgrep(null);
    setMedianTimeEgrep(null);
    setResegrep([]);
    setNbiteration(1);
    setIterations(1);
    setSelectedFile(null);
    setFileInputKey(Date.now()); // Générer une nouvelle clé
  };

  //

  // Utiliser useEffect pour déclencher les étapes successives
  useEffect(() => {
    if (automate) {
      handleDeterminizeAutomate(); // Déclencher la déterminisation après la génération de l'automate
    }
  }, [automate]);

  useEffect(() => {
    if (detAutomate) {
      handleMinimizeAutomate(); // Déclencher la minimisation après la déterminisation de l'automate
    }
  }, [detAutomate]);

  useEffect(() => {
    if (MinAutomate) {
      handleSearch(); // Déclencher la recherche après la minimisation de l'automate
    }
  }, [MinAutomate]);

  return (
    <div
      className=" vh-100"
      style={{
        backgroundImage: "url('bibliotheque.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        repeat: "non-repeat",
        backgroundColor: "#f8f8f8", // Couleur de fallback
      }}
    >
      <div
        className=" vh-100 d-flex justify-content-center align-items-center"
        style={{
          backdropFilter: "blur(6px)", // Flou appliqué sur l'arrière-plan
        }}
      >
        <div
          className="card container py-3 w-auto shadow-lg rounded"
          style={{
            minHeight: "400px",
            maxHeight: "600px", // Limite la taille maximale
            overflowY: "auto", // Ajoute une barre de défilement si le contenu est trop long
            background: "rgba(255, 255, 255, 0.9)", // Semi-transparente
          }}
        >
          <div className="mb-3 d-flex justify-content-between ">
            <Link to="/" className="text-decoration-none text-dark">
              <FontAwesomeIcon icon={faArrowLeft} /> Retour
            </Link>
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (showTime) {
                  setTextTime("Test Performance");
                } else {
                  setTextTime("Test egrep");
                }
                setShowTime(!showTime);
                handleReset();
              }}
            >
              {textTime}
            </button>
          </div>

          <div className="text-center">
            {showTime ? (
              <h2 className="display-3 font-weight-bold text-primary m-5">
                Test Performance
              </h2>
            ) : (
              <h2 className="display-3 font-weight-bold text-success m-5">
                Clone egrep
              </h2>
            )}
          </div>

          {showTime ? (
            <div>
              <div className="row mb-4">
                <div className="col-md-3 d-flex flex-column justify-content-end">
                  <label className="">
                    Regex:
                    <input
                      value={regex}
                      onChange={(e) => setRegex(e.target.value)}
                      className="form-control shadow-sm"
                    />
                  </label>
                </div>
                <div className="col-md-4 d-flex flex-column justify-content-end">
                  <label className="">
                    Fichier (.txt):{" "}
                    <input
                      key={fileInputKey}
                      type="file"
                      onChange={handleFileUpload}
                      accept=".txt"
                      className="form-control shadow-sm"
                    />{" "}
                  </label>
                </div>
                {/* Input pour le nombre d'itérations */}
                <div className="col-md-2 d-flex flex-column justify-content-end ">
                  <label className="">
                    Iteration:{" "}
                    <input
                      type="number"
                      className="form-control shadow-sm"
                      placeholder="Enter number of iterations"
                      value={iterations}
                      onChange={(e) => setIterations(parseInt(e.target.value))}
                    />{" "}
                  </label>
                </div>
                <div className="col-md-3 d-flex flex-column justify-content-end ">
                  <button
                    onClick={handleAllTime}
                    className="btn btn-primary shadow-sm"
                  >
                    Rechercher
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="row mb-4">
                <div className="col-md-4 d-flex flex-column justify-content-end mb-3 mt-3">
                  <label className="">
                    Regex:
                    <input
                      value={regex}
                      onChange={(e) => setRegex(e.target.value)}
                      className="form-control"
                    />
                  </label>
                </div>
                <div className="col-md-4 d-flex flex-column justify-content-end mb-3 mt-3">
                  <label className="">
                    Fichier (.txt):{" "}
                    <input
                      key={fileInputKey}
                      type="file"
                      onChange={handleFileUpload}
                      accept=".txt"
                      className="form-control shadow-sm"
                    />{" "}
                  </label>
                </div>
                <div className="col-md-4 d-flex flex-column justify-content-end mb-3 mt-3">
                  <button onClick={handleAll} className="btn btn-primary">
                    Rechercher
                  </button>
                </div>
              </div>
            </div>
          )}

          {/*  */}

          {/* Search results */}

          {/*  */}

          {searchkmp ? (
            <div>
              <div className="mt-3 d-flex justify-content-between">
                <button
                  className="btn btn-secondary mb-4"
                  onClick={() => setShowModal(true)}
                >
                  Details
                </button>
                <button className="btn btn-warning mb-4" onClick={handleReset}>
                  Reinitialiser
                </button>
              </div>
              {!showTime ? (
                <h3 className="mb-3">
                  Résultats de la recherche : L'algorithme Knuth-Morris-Pratt
                  (KMP)
                </h3>
              ) : (
                <h3 className="mb-3">
                  Résultats du test de performance : L'algorithme
                  Knuth-Morris-Pratt (KMP)
                </h3>
              )}
              <div>
                {searchResults.length > 0 && (
                  <>
                    <ul className="list-group mb-4">
                      {searchResults.map((res, index) => (
                        <li key={index} className="list-group-item">
                          {res.lineNumber} | {res.lineText} | position(s):{" "}
                          {res.positions.join(", ")}
                        </li>
                      ))}
                    </ul>{" "}
                  </>
                )}

                {/* Affichage du temps d'exécution moyen */}
                {showTime && executionTime !== null && (
                  <div>
                    <h3>
                      Temps d'execution moyen: {executionTime.toFixed(2)} ms
                      pour {nbiteration} iteration{nbiteration > 1 ? "s" : null}
                    </h3>
                    <h3>
                      Temps d'execution (Median): {executionTime.toFixed(2)} ms
                      pour {nbiteration} iteration{nbiteration > 1 ? "s" : null}
                    </h3>
                  </div>
                )}
              </div>
              {/* Modal for showing details */}

              {!showTime ? (
                <Modal
                  show={showModal}
                  onHide={() => setShowModal(false)}
                  size="lg"
                  centered
                >
                  <Modal.Header>
                    <Modal.Title>Details</Modal.Title>
                    {/* Close button in the top right */}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    ></button>
                  </Modal.Header>
                  <Modal.Body>
                    <div className="mb-4">
                      <h2>Carry Over (LPS Table)</h2>
                      {/* Afficher la table LPS ici */}
                      {searchResults.map((result, index) => (
                        <div key={index}>
                          <h3>Ligne {result.lineNumber}</h3>
                          <p>Texte de la ligne : {result.lineText}</p>
                          <p>Positions : {result.positions.join(", ")}</p>
                          <p>LPS Table : {result.lpsTable.join(", ")}</p>
                        </div>
                      ))}
                    </div>
                  </Modal.Body>
                </Modal>
              ) : (
                <Modal
                  show={showModal}
                  onHide={() => setShowModal(false)}
                  size="lg"
                  centered
                >
                  <Modal.Header>
                    <Modal.Title>Details</Modal.Title>
                    {/* Close button in the top right */}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    ></button>
                  </Modal.Header>
                  <Modal.Body>
                    <ResultsTable timesearch={timesearch} isKMP={isKmp} />
                  </Modal.Body>
                </Modal>
              )}
            </div>
          ) : null}
          {searchAutomate ? (
            <div>
              {" "}
              {/* Button to trigger modal */}
              <div className="mt-3 d-flex justify-content-between">
                <button
                  className="btn btn-secondary mb-4"
                  onClick={() => setShowModal(true)} // Open modal
                >
                  Details
                </button>
                <button className="btn btn-warning mb-4" onClick={handleReset}>
                  Reinitialiser
                </button>
              </div>
              <div>
                {!showTime ? (
                  <>
                    <h3 className="mb-3">
                      Résultats de la recherche : Automate
                    </h3>{" "}
                    <hr />
                  </>
                ) : (
                  <>
                    <h3 className="mb-3">
                      Résultats du test de performance :Automate
                    </h3>{" "}
                    <hr />
                  </>
                )}

                {searchResults.length > 0 && (
                  <>
                    <ul className="list-group mb-4">
                      {searchResults.map((result, index) => (
                        <li key={index} className="list-group-item">
                          {result}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {/* Affichage du temps d'exécution moyen */}
                {showTime && executionTime !== null && (
                  <div>
                    <h3>
                      Temps d'execution moyen: {executionTime.toFixed(2)} ms
                      pour {nbiteration} iteration{nbiteration > 1 ? "s" : null}
                    </h3>
                    <h3>
                      Temps d'execution (Median): {executionTime.toFixed(2)} ms
                      pour {nbiteration} iteration{nbiteration > 1 ? "s" : null}
                    </h3>
                  </div>
                )}
              </div>
              {/* Modal for showing details */}
              {!showTime ? (
                <Modal
                  show={showModal}
                  onHide={() => setShowModal(false)}
                  size="lg"
                  centered
                >
                  <Modal.Header>
                    <Modal.Title>Details</Modal.Title>
                    {/* Close button in the top right */}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    ></button>
                  </Modal.Header>
                  <Modal.Body>
                    {arbre && (
                      <div className="mb-4">
                        <h2>Arbre syntaxique</h2>
                        <SyntaxTree node={arbre} />
                        <div>{JSON.stringify(arbre, null, 3)}</div>
                      </div>
                    )}
                    <hr />
                    {automate && (
                      <div className="mb-4">
                        <h2>Automate (NFA)</h2>
                        <AutomateVisualizer automate={automate} />
                      </div>
                    )}
                    <hr />
                    {detAutomate && (
                      <div className="mb-4">
                        <h2>Automate Déterminisé (DFA)</h2>
                        <AutomateVisualizer automate={detAutomate} />
                      </div>
                    )}
                    <hr />
                    {MinAutomate && (
                      <div className="mb-4">
                        <h2>Automate Minimisé (Min)</h2>
                        <AutomateVisualizer automate={MinAutomate} />
                      </div>
                    )}
                  </Modal.Body>
                </Modal>
              ) : (
                <Modal
                  show={showModal}
                  onHide={() => setShowModal(false)}
                  size="lg"
                  centered
                >
                  <Modal.Header>
                    <Modal.Title>Details</Modal.Title>
                    {/* Close button in the top right */}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    ></button>
                  </Modal.Header>
                  <Modal.Body>
                    <ResultsTable timesearch={timesearch} isKMP={searchkmp} />
                  </Modal.Body>
                </Modal>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Automaton;
