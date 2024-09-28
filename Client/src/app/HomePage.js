import React from "react";
import { useFormik } from "formik";
import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toastify } from "toastify";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
//

//

function HomePage() {
  return (
    <>
      <div className="LoginImg ">
        <div
          className=" vh-100 "
          style={{
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="container d-flex justify-content-center align-items-center vh-100 ">
            <div className="card custom-card rounded">
              <div className="card-body p-4">
                <div className="d-flex justify-content-center align-items-center mb-4">
                  <h4 className="">DaarLib Reader</h4>
                </div>
                <div className="form-group pt-5">
                  <div className="d-flex justify-content-center align-items-center mb-4 gap-3">
                    <Link
                      to={"/books"}
                      className="text-dark rounded p-1 text-decoration-none w-50 shadow border"
                    >
                      Books
                    </Link>
                    <Link
                      to={"/automaton"}
                      className="text-dark rounded p-1 text-decoration-none w-50 shadow border"
                    >
                      Automaton Project
                    </Link>
                  </div>
                  <div className="d-flex justify-content-center align-items-center mb-4 gap-3">
                    <button className="btn w-50 shadow-sm">
                      Deutsche Bucher
                    </button>

                    <button className="btn w-50 shadow-sm">
                      Other languages
                    </button>
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
