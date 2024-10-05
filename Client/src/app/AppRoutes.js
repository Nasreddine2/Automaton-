import React, { Suspense } from "react";
import { Routes } from "react-router-dom";
import Spinner from "./component/Spinner";
import { Route } from "react-router-dom";

//

import HomePage from "./HomePage";
import Books from "./Books";
import Automaton from "./automate";
//

export default function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* */}

        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<Books />} />
        <Route path="/automaton" element={<Automaton />} />

        {/* */}
      </Routes>
    </Suspense>
  );
}
