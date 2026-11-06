
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Home from "./pages/Home";
import AddMedicine from "./pages/AddMedicine";
import Calendar from "./pages/Calendar";
import Medicines from "./pages/Medicines";
import Family from "./pages/Family";
import WastageTrends from "./pages/WastageTrends";

import ExpiryRescue from "./pages/ExpiryRescue";
import MedicinePassport from "./pages/MedicinePassport";
import MedicineQRScanner from "./pages/MedicineQRScanner";
import PrescriptionScanner from "./pages/PrescriptionScanner";
import SmartStorage from "./pages/SmartStorage";
import AIMedicineScanner from "./pages/AIMedicineScanner";

import "./App.css";

function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-area">
        <Header />

        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/add-medicine" element={<AddMedicine />} />
          <Route path="/family" element={<Family />} />
          <Route path="/wastage-trends" element={<WastageTrends />} />

          {/* Smart Tools */}
          <Route
            path="/expiry-rescue"
            element={<ExpiryRescue />}
          />

          <Route
            path="/medicine-passport"
            element={<MedicinePassport />}
          />

          <Route
            path="/medicine-passport/:id"
            element={<MedicinePassport />}
          />

          <Route
            path="/scan-medicine-qr"
            element={<MedicineQRScanner />}
          />

          <Route
            path="/prescription-scanner"
            element={<PrescriptionScanner />}
          />

          <Route
            path="/smart-storage"
            element={<SmartStorage />}
          />

          <Route
            path="/ai-medicine-scanner"
            element={<AIMedicineScanner />}
          />

          {/* Invalid Routes */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
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
