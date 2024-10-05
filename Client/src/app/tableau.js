import React from "react";

const ResultsTable = ({ timesearch, isKMP }) => {
  if (!timesearch || (!timesearch.results.length && !timesearch.egrep.length)) {
    return <div className="text-center">Aucun résultat à afficher.</div>;
  }

  const maxLength = Math.max(
    timesearch.results.length,
    timesearch.egrep.length
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
          {/* Calculer le nombre maximum d'itérations pour afficher les lignes */}

          {Array.from({ length: maxLength }).map((_, index) => (
            <tr key={index}>
              <td>
                {timesearch.results[index]
                  ? timesearch.results[index].iteration
                  : "-"}
              </td>
              <td>
                {timesearch.results[index]
                  ? timesearch.results[index].time.toFixed(3)
                  : "-"}
              </td>
              <td>
                {timesearch.egrep[index]
                  ? timesearch.egrep[index].iteration
                  : "-"}
              </td>
              <td>
                {timesearch.egrep[index]
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
