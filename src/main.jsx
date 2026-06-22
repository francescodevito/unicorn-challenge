import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import AdminRaffle from "./AdminRaffle.jsx";
import "./Styles.css";

function Router() {
  const hash = window.location.hash || "#/play";

  if (hash.startsWith("#/admin")) {
    return <AdminRaffle />;
  }

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);