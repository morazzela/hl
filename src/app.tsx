import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import "./app.scss";
import Layout from "./layout";

export default function App() {
  return (
    <Router root={Layout}>
      <FileRoutes />
    </Router>
  );
}
