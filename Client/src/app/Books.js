import React, { useEffect, useState } from "react";
import axios from "axios";
import booksData from "../database.json";

import Sidebar from "./sidebar";
import Navbar from "./navbar";

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [languages, setLanguages] = useState([]);

  const [filteredBooks, setFilteredBooks] = useState([]);

  // Cette fonction sera appelée par le composant Sidebar
  const handleLanguageSelect = (language) => {
    // Filtrer les livres selon la langue sélectionnée
    if (language === "All") {
      const allBooks = Object.keys(booksData).reduce((acc, lang) => {
        return [...acc, ...booksData[lang]];
      }, []);
      setFilteredBooks(allBooks); // Tous les livres si "All"
    } else {
      setFilteredBooks(booksData[language]); // Livres filtrés selon la langue
    }
  };

  const handleSearch = (text) => {
    const allBooks = Object.keys(booksData).reduce((acc, lang) => {
      return [...acc, ...booksData[lang]];
    }, []);

    if (text === "") {
      setFilteredBooks(allBooks);
      return;
    }

    const filteredBooks = allBooks.filter((book) => {
      return book.Title.toLowerCase().includes(text.toLowerCase());
    });

    setFilteredBooks(filteredBooks);
  };

  useEffect(() => {
    // Charger tous les livres au démarrage (langue "All" par défaut)
    const allBooks = Object.keys(booksData).reduce((acc, lang) => {
      return [...acc, ...booksData[lang]];
    }, []);
    setFilteredBooks(allBooks); // Par défaut, tous les livres
  }, []);

  const getDownloadLink = (link) => {
    return `http://localhost:3001/download/${link}`; // API backend
  };

  const downloadBook = async (book) => {
    const downloadLink = getDownloadLink(book.link);

    try {
      const response = await axios.get(downloadLink, {
        responseType: "blob",
      });

      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const fileLink = document.createElement("a");
      fileLink.href = fileURL;
      fileLink.setAttribute("download", `${book.Title}.txt`);

      document.body.appendChild(fileLink);
      fileLink.click();
      document.body.removeChild(fileLink);
    } catch (error) {
      console.error("Erreur lors du téléchargement du livre:", error);
    }
  };

  return (
    <div className="">
      {/* Sidebar */}
      <div className="container-fluid position-relative d-flex flex-row-reverse p-0">
        <Sidebar onLanguageSelect={handleLanguageSelect} />
        <div class="content sidebar-offcanvas">
          <Navbar SelectedSearch={handleSearch} />
          <div
            className="content-wrapper"
            style={{ backgroundColor: "#f0f0f0" }}
          >
            {/* Main Content */}
            <div className="container-fluid pt-4 px-4">
              <div className="row">
                {filteredBooks.map((book, index) => (
                  <div key={index} className="col-12 col-sm-6 col-lg-4 mb-4">
                    <div className="card h-100" style={{ maxWidth: "18rem" }}>
                      <img
                        className="card-img-top"
                        src={`https://www.gutenberg.org/cache/epub/${book.link}/pg${book.link}.cover.medium.jpg`}
                        alt={book.Title}
                        style={{
                          width: "100%",
                          height: "250px",
                          objectFit: "cover",
                        }}
                      />
                      <div className="card-body">
                        <h5 className="card-title">{book.Title}</h5>
                        <p className="card-text">Author: {book.Author}</p>
                        <button
                          className="btn btn-primary"
                          onClick={() => downloadBook(book)}
                        >
                          Download TXT
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookList;
