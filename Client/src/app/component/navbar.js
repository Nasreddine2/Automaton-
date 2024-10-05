import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
//

function Navbar({ toggleOffcanvas, SelectedSearch, isSidebarOpen }) {
  const [text, setText] = useState("");

  const handlesearch = (text) => {
    SelectedSearch(text);
  };

  return (
    <nav
      id="barrenavigation"
      className={`navbar navbar-expand bg-white navbar-white sticky-top px-4 pb-2 pt-2 py-0 gap-3 justify-content-between ${
        isSidebarOpen ? "open" : ""
      }`}
    >
      {/* Bouton pour cacher la sidebar, ajouté ici dans le contenu principal */}
      <div cbme="d-flex">
        {!isSidebarOpen ? (
          <button
            className=" p-4 textprimary border-0 sidebar-toggler flex-shrink-0 "
            onClick={() => toggleOffcanvas()}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        ) : null}
      </div>
      <div className="d-flex w-auto gap-3">
        <input
          type="text"
          placeholder="Enter Text..."
          className="form-control "
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
