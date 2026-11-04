
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Home from "./pages/Home";

function Placeholder({ title }) {
  return (
    <div className="page-content">
      <p className="eyebrow">MEDISHARE WORKSPACE</p>
      <h1>{title}</h1>
      <p className="welcome-copy">
        This page will be implemented in the next development stage.
      </p>
    </div>
  );
}

function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-area">
        <Header />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/medicines" element={<Placeholder title="Medicines & disposal" />} />
          <Route path="/calendar" element={<Placeholder title="Calendar" />} />
          <Route path="/add-medicine" element={<Placeholder title="Add medicine" />} />
          <Route path="/family" element={<Placeholder title="Family" />} />
          <Route path="/wastage-trends" element={<Placeholder title="Wastage trends" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
