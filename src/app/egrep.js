import React, { useState } from "react";

// Définition des classes d'automates et des fonctions nécessaires
class SyntaxTreeNode {
  constructor(type, left = null, right = null, char = null) {
    this.type = type; // "CONCAT", "UNION", "STAR", "CHAR"
    this.left = left;
    this.right = right;
    this.char = char;
  }
}

class NFA {
  constructor() {
    this.startState = null;
    this.acceptStates = new Set();
    this.transitions = {};
  }

  addTransition(from, symbol, to) {
    if (!this.transitions[from]) {
      this.transitions[from] = {};
    }
    if (!this.transitions[from][symbol]) {
      this.transitions[from][symbol] = new Set();
    }
    this.transitions[from][symbol].add(to);
  }

  addAcceptState(state) {
    this.acceptStates.add(state);
  }
}

class DFA {
  constructor() {
    this.startState = null;
    this.acceptStates = new Set();
    this.transitions = {};
  }

  addTransition(from, symbol, to) {
    if (!this.transitions[from]) {
      this.transitions[from] = {};
    }
    this.transitions[from][symbol] = to;
  }

  addAcceptState(state) {
    this.acceptStates.add(state);
  }

  test(input) {
    let currentState = this.startState;
    for (let char of input) {
      if (
        this.transitions[currentState] &&
        this.transitions[currentState][char]
      ) {
        currentState = this.transitions[currentState][char];
      } else {
        return false;
      }
    }
    return this.acceptStates.has(currentState);
  }
}

function regexToNFA(regex) {
  let stack = [];

  for (let char of regex) {
    if (char === "*") {
      if (stack.length === 0) {
        console.error("Erreur: la pile est vide lors de l'opération '*'");
        return;
      }
      const nfa = stack.pop();
      stack.push(applyStar(nfa));
    } else if (char === "|") {
      if (stack.length < 2) {
        console.error(
          "Erreur: pas assez d'éléments dans la pile pour l'opération '|'"
        );
        return;
      }
      const right = stack.pop();
      const left = stack.pop();
      stack.push(applyUnion(left, right));
    } else if (char === ".") {
      if (stack.length < 2) {
        console.error(
          "Erreur: pas assez d'éléments dans la pile pour l'opération '.'"
        );
        return;
      }
      const right = stack.pop();
      const left = stack.pop();
      stack.push(applyConcat(left, right));
    } else {
      stack.push(buildBasicNFA(char));
    }
  }

  if (stack.length !== 1) {
    console.error(
      "Erreur: la pile ne contient pas exactement un élément après le traitement de l'expression régulière"
    );
    return;
  }

  return stack.pop();
}

// Correction des fonctions de manipulation des NFA
function buildBasicNFA(char) {
  const nfa = new NFA();
  const startState = Symbol("start");
  const acceptState = Symbol("accept");

  nfa.startState = startState;
  nfa.addAcceptState(acceptState);
  nfa.addTransition(startState, char, acceptState);

  return nfa;
}

function applyConcat(nfa1, nfa2) {
  if (!nfa1 || !nfa2) {
    console.error("Erreur: NFA1 ou NFA2 est invalide dans applyConcat");
    return;
  }

  const nfa = new NFA();

  nfa.startState = nfa1.startState;
  for (let state of nfa1.acceptStates) {
    nfa.addTransition(state, "", nfa2.startState);
  }

  // Copier les transitions de nfa1
  for (let from in nfa1.transitions) {
    for (let char in nfa1.transitions[from]) {
      for (let to of nfa1.transitions[from][char]) {
        nfa.addTransition(from, char, to);
      }
    }
  }

  // Copier les transitions de nfa2
  for (let from in nfa2.transitions) {
    for (let char in nfa2.transitions[from]) {
      for (let to of nfa2.transitions[from][char]) {
        nfa.addTransition(from, char, to);
      }
    }
  }

  for (let state of nfa2.acceptStates) {
    nfa.addAcceptState(state);
  }

  return nfa;
}

function applyUnion(nfa1, nfa2) {
  if (!nfa1 || !nfa2) {
    console.error("Erreur: NFA1 ou NFA2 est invalide dans applyUnion");
    return;
  }

  const nfa = new NFA();
  const startState = Symbol("start");

  nfa.startState = startState;
  nfa.addTransition(startState, "", nfa1.startState);
  nfa.addTransition(startState, "", nfa2.startState);

  // Copier les transitions de nfa1
  for (let from in nfa1.transitions) {
    for (let char in nfa1.transitions[from]) {
      for (let to of nfa1.transitions[from][char]) {
        nfa.addTransition(from, char, to);
      }
    }
  }

  // Copier les transitions de nfa2
  for (let from in nfa2.transitions) {
    for (let char in nfa2.transitions[from]) {
      for (let to of nfa2.transitions[from][char]) {
        nfa.addTransition(from, char, to);
      }
    }
  }

  for (let state of nfa1.acceptStates) {
    nfa.addAcceptState(state);
  }
  for (let state of nfa2.acceptStates) {
    nfa.addAcceptState(state);
  }

  return nfa;
}

function applyStar(nfa) {
  if (!nfa) {
    console.error("Erreur: NFA est invalide dans applyStar");
    return;
  }

  const result = new NFA();
  const startState = Symbol("start");

  result.startState = startState;
  result.addAcceptState(startState);
  result.addTransition(startState, "", nfa.startState);

  // Copier les transitions de nfa
  for (let from in nfa.transitions) {
    for (let char in nfa.transitions[from]) {
      for (let to of nfa.transitions[from][char]) {
        result.addTransition(from, char, to);
      }
    }
  }

  for (let state of nfa.acceptStates) {
    result.addTransition(state, "", nfa.startState);
    result.addAcceptState(state);
  }

  return result;
}

// Fonction pour convertir le NFA en un DFA
function convertNFAToDFA(nfa) {
  let dfa = new DFA();
  let queue = [];
  let dfaStartState = [nfa.startState];
  queue.push(dfaStartState);
  dfa.startState = JSON.stringify(dfaStartState);

  while (queue.length > 0) {
    let current = queue.shift();
    let currentDFAState = JSON.stringify(current);

    let charTransitions = {};
    current.forEach((nfaState) => {
      if (nfa.transitions[nfaState]) {
        for (let char in nfa.transitions[nfaState]) {
          if (!charTransitions[char]) charTransitions[char] = new Set();
          nfa.transitions[nfaState][char].forEach((toState) => {
            charTransitions[char].add(toState);
          });
        }
      }
    });

    for (let char in charTransitions) {
      let toDFAState = Array.from(charTransitions[char]);
      let toDFAStateString = JSON.stringify(toDFAState);

      dfa.addTransition(currentDFAState, char, toDFAStateString);

      if (!queue.some((state) => JSON.stringify(state) === toDFAStateString)) {
        queue.push(toDFAState);
      }
    }

    current.forEach((state) => {
      if (nfa.acceptStates.has(state)) dfa.addAcceptState(currentDFAState);
    });
  }

  return dfa;
}

function EgrepClone() {
  const [fileContent, setFileContent] = useState("");
  const [regexPattern, setRegexPattern] = useState("");
  const [searchResults, setSearchResults] = useState([]);

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
    if (!regexPattern) return;

    // Construire le NFA à partir du motif
    const nfa = regexToNFA(regexPattern);

    // Convertir le NFA en DFA
    const dfa = convertNFAToDFA(nfa);

    const lines = fileContent.split("\n"); // Diviser le contenu du fichier par ligne
    const results = lines.filter((line) => dfa.test(line)); // Rechercher les lignes qui correspondent
    setSearchResults(results);
  };

  return (
    <div>
      <h2>Clone egrep - Recherche par Motif avec Automate</h2>

      {/* Téléchargement du fichier */}
      <input type="file" onChange={handleFileUpload} accept=".txt" />

      {/* Saisie du motif RegEx */}
      <input
        type="text"
        placeholder="Entrez le motif RegEx"
        value={regexPattern}
        onChange={(e) => setRegexPattern(e.target.value)}
      />

      {/* Bouton pour déclencher la recherche */}
      <button onClick={handleSearch}>Rechercher</button>

      {/* Affichage des résultats */}
      <div>
        <h3>Résultats de la recherche :</h3>
        <ul>
          {searchResults.map((result, index) => (
            <li key={index}>{result}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default EgrepClone;
