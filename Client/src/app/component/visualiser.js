import React from "react";
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
export default AutomateVisualizer;
