import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Modal } from "react-bootstrap";

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

// Fonction pour construire le tableau CarryOver à partir du motif (pattern)
function computeCarryOver(pattern) {
  const n = pattern.length;
  const carryOver = new Array(n).fill(0); // Initialiser le tableau avec des zéros
  let i = 1;
  let j = 0; // Index pour le plus long préfixe suffixe

  carryOver[0] = -1; // Convention KMP, le premier élément est -1

  while (i < n) {
    if (pattern[i] === pattern[j]) {
      j++;
      carryOver[i] = j;
      i++;
    } else {
      if (j !== 0) {
        j = carryOver[j - 1];
      } else {
        carryOver[i] = 0;
        i++;
      }
    }
  }

  return carryOver;
}

// Fonction pour rechercher le motif dans le texte en utilisant le tableau CarryOver
function KMPsearch(text, pattern) {
  const carryOver = computeCarryOver(pattern);
  let i = 0; // Index pour le texte
  let j = 0; // Index pour le motif
  console.log(text.length);
  while (i < text.length) {
    if (pattern[j] === text[i]) {
      i++;
      j++;
      console.log("patterne", pattern[j]);
      console.log("texte", text[i]);
    }

    if (j === pattern.length) {
      // Motif trouvé, retourner vrai
      return true;
    } else if (i < text.length && pattern[j] !== text[i]) {
      if (j !== 0) {
        j = carryOver[j - 1];
      } else {
        i++;
      }
    }
  }
  // Si on sort de la boucle sans correspondance, retourner faux
  return false;
}

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

    const partitionsCopy = partitions.slice(); // Create a copy of partitions

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

// Composant React pour afficher l'automate avec les états initiaux et finaux
const AutomateVisualizer = ({ automate }) => {
  return (
    <div>
      <h3>États</h3>
      <ul>
        {automate.states.map((state) => (
          <li key={state}>
            {state}
            {automate.endStates.has(state) && " (Final)"}{" "}
            {/* Vérifie si l'état est final */}
            {state === automate.startState && " (Initial)"}
          </li>
        ))}
      </ul>
      <h3>Transitions</h3>
      <ul>
        {automate.transitions.map((trans, idx) => (
          <li key={idx}>
            {trans.from} --({trans.symbol})--&gt; {trans.to}
          </li>
        ))}
      </ul>
    </div>
  );
};

const SyntaxTree = ({ node }) => {
  // Si le node est une feuille (une string ou un élément simple), on l'affiche directement
  if (typeof node === "string") {
    return <span>{node}</span>;
  }

  // Si le node est une liste, on affiche l'élément 0 (parent), et les enfants 1 et 2 (fils gauche et droit)
  const [parent, leftChild, rightChild] = node;

  return (
    <div
      style={{ textAlign: "center", margin: "20px", display: "inline-block" }}
    >
      {/* Affichage du parent */}
      <div>{parent}</div>

      {/* Connecteurs entre parent et enfants */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {leftChild && (
          <div style={{ width: "50%", borderBottom: "1px solid black" }}></div>
        )}
        {rightChild && (
          <div style={{ width: "50%", borderBottom: "1px solid black" }}></div>
        )}
      </div>

      {/* Conteneur pour les enfants */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {/* Fils gauche */}
        {leftChild && (
          <div style={{ marginRight: "10px", paddingTop: "10px" }}>
            <SyntaxTree node={leftChild} />
          </div>
        )}
        {/* Fils droit */}
        {rightChild && (
          <div style={{ marginLeft: "10px", paddingTop: "10px" }}>
            <SyntaxTree node={rightChild} />
          </div>
        )}
      </div>
    </div>
  );
};

// Composant principal de l'application
const Automaton = () => {
  const [arbre, setArbre] = useState(null); // Arbre syntaxique
  const [automate, setAutomate] = useState(null); // Automate (NFA ou DFA)
  const [detAutomate, setDetAutomate] = useState(null); // Automate déterminisé (DFA)
  const [MinAutomate, setMinAutomate] = useState(null); // Automate Min (Min)
  const [regex, setRegex] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [kmp, setKmp] = useState([]);
  const [searchkmp, setSearchKmp] = useState(false);
  const [searchAutomate, setSearchAutomate] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
      stateCounter = 0; // Réinitialiser le compteur d'état pour chaque nouveau calcul
      const arbre = parseRegex(regex); // Générer l'automate à partir de l'expression régulière
      setArbre(arbre); // Stocker l'arbre syntaxique
      setAutomate(null); // Réinitialiser l'automate NFA
      setDetAutomate(null); // Réinitialiser l'automate déterminisé (DFA)
      setMinAutomate(null); // Réinitialiser l'automate minimisé
      resolve(); // Marquer la fonction comme terminée
    });
  };
  // Fonction pour générer l'automate (NFA)
  const handleGenerateAutomate = async () => {
    return new Promise((resolve) => {
      stateCounter = 0; // Réinitialiser le compteur d'état pour chaque nouveau calcul
      const automate = construireAutomate(regex); // Générer l'automate à partir de l'expression régulière
      setAutomate(automate); // Stocker l'automate NFA
      setDetAutomate(null); // Réinitialiser l'automate déterminisé (DFA)
      setMinAutomate(null); // Réinitialiser l'automate minimisé
      resolve(); // Marquer la fonction comme terminée
    });
  };

  // Fonction pour déterminiser l'automate (NFA -> DFA)
  const handleDeterminizeAutomate = async () => {
    return new Promise((resolve) => {
      if (automate) {
        const dfa = determinizeAutomate(automate); // Déterminiser l'automate NFA
        setDetAutomate(dfa); // Stocker l'automate déterminisé (DFA)
        setMinAutomate(null); // Réinitialiser l'automate minimisé
      }
      resolve(); // Marquer la fonction comme terminée
    });
  };

  // Fonction pour minimiser l'automate déterminisé (DFA)
  const handleMinimizeAutomate = async () => {
    return new Promise((resolve) => {
      if (detAutomate) {
        const minDfa = minimizeAutomate(detAutomate); // Minimiser l'automate DFA
        setMinAutomate(minDfa); // Stocker l'automate minimisé
      }
      resolve(); // Marquer la fonction comme terminée
    });
  };

  // Lecture du fichier et stockage du contenu dans le state
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result);
    };
    reader.readAsText(file);
  };

  // Fonction de recherche utilisant l'automate
  const handleSearch = () => {
    if (!MinAutomate) return;

    const lines = fileContent.split("\n"); // Diviser le contenu du fichier par ligne
    const results = lines.filter((line) => TestTxt(MinAutomate, line)); // Rechercher les lignes qui correspondent
    setSearchResults(results);
  };

  // Fonction de recherche utilisant KMP
  const handleSearchKMP = () => {
    if (!kmp) return;

    const lines = fileContent.split("\n"); // Diviser le contenu du fichier par ligne
    console.log("test1");
    const results = lines.filter((line) => KMPsearch(line, regex)); // Rechercher les lignes qui correspondent
    console.log("test1");
    setSearchResults(results);
  };

  const handleAll = async () => {
    if (!regex) return;
    await handleGenerateArbre(); // Attendre que l'arbre soit généré
    if (isKmp()) {
      console.log("KMP");
      setSearchKmp(true);
      setSearchAutomate(false);
      handleSearchKMP();
    } else {
      setSearchKmp(false);
      setSearchAutomate(true);
      await handleGenerateAutomate(); // Attendre que l'automate soit généré
      await handleDeterminizeAutomate(); // Attendre que l'automate soit déterminisé
      await handleMinimizeAutomate(); // Attendre que l'automate soit minimisé
      handleSearch(); // Ensuite, rechercher dans le fichier
    }
  };

  // Utiliser useEffect pour Savoir si KMP ou Automate
  useEffect(() => {
    if (regex) {
      if (regex === "") {
        setSearchKmp(false);
        setSearchAutomate(false);
      }
    }
  }, [regex]);

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
    <div className="container py-5">
      {/* Header */}
      <div className="mb-4">
        <Link to="/" className="text-decoration-none text-primary">
          HomePage
        </Link>
      </div>

      <h1 className="mb-4">Automate avec transitions epsilon</h1>

      {/* Input section */}
      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">
            Regex:
            <input
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              className="form-control"
            />
          </label>
        </div>
        <div className="col-md-4">
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".txt"
            className="form-control"
          />
        </div>
        <div className="col-md-4 d-grid">
          <button onClick={handleAll} className="btn btn-primary">
            Rechercher
          </button>
        </div>
      </div>

      {/* Search results */}

      {searchkmp ? (
        <div>
          {" "}
          {/* Button to trigger modal */}
          <button
            className="btn btn-secondary mb-4"
            onClick={() => setShowModal(true)} // Open modal
          >
            Show Details
          </button>
          <h3 className="mb-3">
            Résultats de la recherche : L'algorithme Knuth-Morris-Pratt (KMP)
          </h3>
          <ul className="list-group mb-4">
            {searchResults.map((result, index) => (
              <li key={index} className="list-group-item">
                {result}
              </li>
            ))}
          </ul>
          {/* Modal for showing details */}
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
                  <h2>Carry Over</h2>
                </div>
              )}
            </Modal.Body>
          </Modal>
        </div>
      ) : null}
      {searchAutomate ? (
        <div>
          {" "}
          {/* Button to trigger modal */}
          <button
            className="btn btn-secondary mb-4"
            onClick={() => setShowModal(true)} // Open modal
          >
            Show Details
          </button>
          <h3 className="mb-3">Résultats de la recherche : Automaton</h3>
          <ul className="list-group mb-4">
            {searchResults.map((result, index) => (
              <li key={index} className="list-group-item">
                {result}
              </li>
            ))}
          </ul>
          {/* Modal for showing details */}
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
        </div>
      ) : null}
    </div>
  );
};

export default Automaton;
