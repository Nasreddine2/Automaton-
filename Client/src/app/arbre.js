import React from "react";
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

export default SyntaxTree;
