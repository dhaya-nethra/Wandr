const redirect = sessionStorage.redirect;
delete sessionStorage.redirect;

if (redirect && redirect !== location.href) {
    history.replaceState(null, "", redirect);
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);