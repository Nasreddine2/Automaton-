import { Link } from "react-router-dom";
import { useState } from "react";

//

function Navbar({ SelectedSearch }) {
  const [text, setText] = useState("");

  const toggleOffcanvas = () => {
    document
      .querySelectorAll(".sidebar-offcanvas")
      .forEach((el) => el.classList.toggle("open"));
  };

  const handlesearch = (text) => {
    SelectedSearch(text);
  };

  return (
    <nav
      id="barrenavigation"
      className="navbar navbar-expand bg-white navbar-white sticky-top px-4 pb-2 pt-2 py-0 gap-3 justify-content-between"
    >
      {/* Bouton pour cacher la sidebar, ajouté ici dans le contenu principal */}
      <div className="d-flex w-50">
        <button
          className=" p-4 textprimary border-0 sidebar-toggler flex-shrink-0"
          onClick={() => toggleOffcanvas()}
        >
          toggle
        </button>{" "}
      </div>
      <div className="d-flex w-50 gap-3">
        <input
          type="text"
          placeholder="Enter Text..."
          className="form-control w-50 "
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="btn shadow-sm"
          onClick={() => {
            handlesearch(text);
          }}
        >
          Search
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
