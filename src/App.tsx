import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';

// Pages
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { PatientStartPage, EmergencyPage, PatientVisitPage } from './pages/patient';
import { StaffLoginPage, StaffDashboardPage } from './pages/staff';
import { AdminComingSoonPage } from './pages/admin';
import { PurposePage } from './pages/PurposePage';
import { DepartmentPage } from './pages/DepartmentPage';
import { SlipPage } from './pages/SlipPage';
import { WayfindingPage } from './pages/WayfindingPage';
import { ComponentDemoPage } from './pages/ComponentDemoPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Entry flow: Screen A (Language selection) & Screen B (Role selection) */}
            <Route path="/" element={<RoleSelectionPage />} />

            {/* Screen C: Patient entry with Phone+OTP or Guest */}
            <Route path="/patient/start" element={<PatientStartPage />} />
            <Route path="/patient/emergency" element={<EmergencyPage />} />
            <Route path="/patient/visit" element={<PatientVisitPage />} />

            {/* Screen D: Staff login & Staff dashboard */}
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route path="/staff/dashboard" element={<StaffDashboardPage />} />

            {/* Hospital Admin Coming Soon */}
            <Route path="/admin/coming-soon" element={<AdminComingSoonPage />} />

            {/* Patient navigation & slip flow */}
            <Route path="/purpose" element={<PurposePage />} />
            <Route path="/department" element={<DepartmentPage />} />
            <Route path="/slip" element={<SlipPage />} />
            <Route path="/wayfinding" element={<WayfindingPage />} />

            {/* UI Component Library Demo */}
            <Route path="/demo" element={<ComponentDemoPage />} />

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AccessibilityProvider>
  );
}
