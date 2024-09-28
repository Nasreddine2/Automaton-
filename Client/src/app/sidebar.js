import { Link } from "react-router-dom";
import React, { useEffect } from "react";
import booksData from "../database.json";

export default function Sidebar({ onLanguageSelect }) {
  const [languages, setLanguages] = React.useState([]);
  const [activeLanguage, setActiveLanguage] = React.useState("All");

  useEffect(() => {
    // Charger les langues disponibles à partir du fichier JSON
    const availableLanguages = Object.keys(booksData);
    setLanguages(["All", ...availableLanguages]);
  }, []);

  const handleLanguageClick = (language) => {
    setActiveLanguage(language); // Mettre à jour la langue active
    onLanguageSelect(language); // Appeler la fonction passée par les props pour filtrer les livres
  };

  return (
    <div id="sidebar" className="sidebar bg-white sidebar-offcanvas pe-2 pb-3">
      <nav className="navbar bg-white navbar-dark p-1">
        <Link to={"/"} className="navbar-brand mx-4 mb-3">
          <h3 className="textprimary d-flex align-items-center me-5 mbr-section-subtitle align-center text-dark mbr-light mbr-fonts-style display-1 fs-1">
            Books
          </h3>{" "}
        </Link>

        <div className="navbar-nav w-100 ">
          <span
            className={`nav-link ${activeLanguage === "All" ? "active" : ""}`}
            onClick={() => handleLanguageClick("All")}
          >
            All Books
          </span>
          {languages.slice(1).map((language) => (
            <span
              key={language}
              className={`nav-link ${
                activeLanguage === language ? "active" : ""
              }`}
              onClick={() => handleLanguageClick(language)}
              style={{ cursor: "pointer" }}
            >
              {language}
            </span>
          ))}
        </div>
      </nav>
    </div>
  );
}
