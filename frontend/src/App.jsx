import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Environmental from './pages/Environmental';
import Social from './pages/Social';
import Governance from './pages/Governance';
import Gamification from './pages/Gamification';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import CarbonCalculator from './pages/CarbonCalculator';
import Predictions from './pages/Predictions';
import GreenIdeas from './pages/GreenIdeas';
import DiversityDashboard from './pages/DiversityDashboard';
import DepartmentScores from './pages/DepartmentScores';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes Nested inside DashboardLayout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="environmental" element={<Environmental />} />
            <Route path="social" element={<Social />} />
            <Route path="governance" element={<Governance />} />
            <Route path="gamification" element={<Gamification />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="carbon-calculator" element={<CarbonCalculator />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="ideas" element={<GreenIdeas />} />
            <Route path="diversity" element={<DiversityDashboard />} />
            <Route path="department-scores" element={<DepartmentScores />} />
            
            {/* Fallback route within Dashboard layout */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Absolute Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
