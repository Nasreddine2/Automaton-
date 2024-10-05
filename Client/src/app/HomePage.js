import React from "react";

import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
//

//

function HomePage() {
  return (
    <>
      <div
        className="vh-100"
        style={{
          backgroundImage: "url('bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          repeat: "no-repeat",
          backgroundColor: "#f8f8f8", // Couleur de fallback
        }}
      >
        <div
          className="vh-100 d-flex justify-content-center align-items-center"
          style={{
            backdropFilter: "blur(8px)", // Flou appliqué sur l'arrière-plan
          }}
        >
          <div
            className="card container py-3 w-auto shadow-lg rounded"
            style={{ backgroundColor: "#FAFAFA" }}
          >
            <div className="card-body p-4">
              {/* Ajout de l'image de livre */}
              <div className="text-center mb-4">
                <img
                  src="book.png"
                  alt="Livre"
                  className="img-fluid"
                  style={{ maxHeight: "300px", objectFit: "contain" }}
                />
              </div>

              <div className="d-flex justify-content-center align-items-center mb-4">
                <h2
                  className="font-weight-bold"
                  style={{ fontFamily: "Roboto, sans-serif" }}
                >
                  Gutenberg Project
                </h2>
              </div>

              <div className="form-group pt-5">
                <div className="row">
                  <div className="col-12 col-md-6 mb-3 d-flex justify-content-center">
                    <Link
                      to={"/books"}
                      className="btn btn-light w-100 text-dark text-decoration-none border"
                    >
                      Livres
                    </Link>
                  </div>
                  <div className="col-12 col-md-6 mb-3 d-flex justify-content-center">
                    <Link
                      to={"/automaton"}
                      className="btn btn-light w-100 text-dark text-decoration-none border"
                    >
                      Projet
                    </Link>
                  </div>
                  <div className="col-12 col-md-6 mb-3 d-flex justify-content-center">
                    <Link
                      to={"https://www-npa.lip6.fr/~buixuan/daar2024"}
                      className="btn btn-light w-100 text-dark text-decoration-none border"
                      target="_blank"
                    >
                      DAAR
                    </Link>
                  </div>
                  <div className="col-12 col-md-6 mb-3 d-flex justify-content-center">
                    <Link
                      to={"https://www.gutenberg.org/"}
                      className="btn btn-light w-100 text-dark text-decoration-none border"
                      target="_blank"
                    >
                      The Gutenberg Project
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
