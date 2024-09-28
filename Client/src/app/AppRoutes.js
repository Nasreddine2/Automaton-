import React, { lazy, Suspense } from "react";
import { Link, Routes } from "react-router-dom";
import Spinner from "./Spinner";
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";

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
