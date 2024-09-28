import React, { lazy, Suspense } from "react";
import { Link, Routes } from "react-router-dom";
import Spinner from "./Spinner";
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";

//

import HomePage from "./HomePage";
import EgrepClone from "./egrep";
import Automata from "./automate";
//

export default function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* */}

        <Route path="/" element={<HomePage />} />
        <Route path="/grep" element={<EgrepClone />} />
        <Route path="/automata" element={<Automata />} />

        {/* */}
      </Routes>
    </Suspense>
  );
}
