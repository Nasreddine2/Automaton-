import { Link } from "react-router-dom";
import React, { useEffect } from "react";
import booksData from "../database.json";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

export default function Sidebar({
  toggleOffcanvas,
  onLanguageSelect,
  isSidebarOpen,
}) {
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
    <div
      id="sidebar"
      className={`sidebar bg-white sidebar-offcanvas pe-2 pb-3 ${
        isSidebarOpen ? "open" : "closed"
      }`}
    >
      <nav className="navbar bg-white navbar-dark p-1">
        <div
          className="d-flex justify-content-between p-1"
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Link
            to={"/"}
            className="navbar-brand mx-4 mb-3 d-flex justify-content-between flex-column align-items-center"
          >
            <img
              src="book.png"
              alt="Livre"
              className="img-fluid"
              style={{ maxHeight: "30px", objectFit: "contain" }}
            />{" "}
            <h6
              className="font-weight-bold text-dark"
              style={{ fontFamily: "Roboto, sans-serif" }}
            >
              Gutenberg Project
            </h6>
          </Link>
          {/* Bouton pour cacher la sidebar, ajouté ici dans le contenu principal */}

          <div className="d-flex align-items-center">
            {" "}
            {/* Alignement vertical */}
            {isSidebarOpen && (
              <div
                className="rounded-circle"
                style={{
                  backgroundColor: "#f8f9fa", // Couleur de fond
                }}
              >
                <button
                  className="btn   sidebar-toggler  "
                  onClick={() => toggleOffcanvas()}
                >
                  <FontAwesomeIcon icon={faBars} />
                </button>
              </div>
            )}
          </div>
        </div>

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
