import React from "react";

const ResultsTable = ({ timesearch, isKMP }) => {
  // Vérifier si timesearch existe
  if (!timesearch) {
    return <div className="text-center">Aucun résultat à afficher.</div>;
  }

  // Vérifier si results et egrep sont des tableaux et s'ils ont des longueurs valides
  const resultsExist =
    Array.isArray(timesearch.results) && timesearch.results.length > 0;
  const egrepExist =
    Array.isArray(timesearch.egrep) && timesearch.egrep.length > 0;

  // Si aucune des deux listes n'a de résultats
  if (!resultsExist && !egrepExist) {
    return <div className="text-center">Aucun résultat à afficher.</div>;
  }

  // Calculer le nombre maximum d'itérations
  const maxLength = Math.max(
    resultsExist ? timesearch.results.length : 0,
    egrepExist ? timesearch.egrep.length : 0
  );

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Résultats du test de Performance</h2>
      <table className="table table-bordered">
        <thead className="thead-light">
          <tr>
            {isKMP ? (
              <th colSpan="2" className="text-center">
                KMP
              </th>
            ) : (
              <th colSpan="2" className="text-center">
                Automate
              </th>
            )}
            <th colSpan="2" className="text-center">
              Commande egrep
            </th>
          </tr>
          <tr>
            <th>Iteration</th>
            <th>Temps d'Exécution (ms)</th>
            <th>Iteration</th>
            <th>Temps d'Exécution (ms)</th>
          </tr>
        </thead>
        <tbody>
          {/* Affichage des résultats en fonction du maximum d'itérations */}
          {Array.from({ length: maxLength }).map((_, index) => (
            <tr key={index}>
              <td>
                {resultsExist && timesearch.results[index]?.iteration
                  ? timesearch.results[index].iteration
                  : "-"}
              </td>
              <td>
                {resultsExist && timesearch.results[index]?.time
                  ? timesearch.results[index].time.toFixed(3)
                  : "-"}
              </td>
              <td>
                {egrepExist && timesearch.egrep[index]?.iteration
                  ? timesearch.egrep[index].iteration
                  : "-"}
              </td>
              <td>
                {egrepExist && timesearch.egrep[index]?.executionTimeMs
                  ? timesearch.egrep[index].executionTimeMs.toFixed(3)
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
