import React, { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RecordsProvider } from './context/RecordsContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import InsightsPage from './pages/InsightsPage';
import SearchPage from './pages/SearchPage';
import DoctorPortal from './pages/DoctorPortal';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState('home'); // 'home', 'login', 'dashboard'
  const [dashboardTab, setDashboardTab] = useState('dashboard'); // 'dashboard', 'upload', 'insights', 'search'
  const [loginRole, setLoginRole] = useState('patient');

  // If user is authenticated, route them to their dashboard or respective tab
  const handleGetStarted = () => {
    if (isAuthenticated) {
      setActivePage('dashboard');
      setDashboardTab('dashboard');
    } else {
      setLoginRole('patient');
      setActivePage('login');
    }
  };

  const handleLoginDoctor = () => {
    if (isAuthenticated && user?.role === 'doctor') {
      setActivePage('dashboard');
    } else {
      setLoginRole('doctor');
      setActivePage('login');
    }
  };

  const handleLoginSuccess = (role) => {
    setActivePage('dashboard');
    setDashboardTab('dashboard');
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        activePage={activePage === 'dashboard' ? dashboardTab : activePage}
        setActivePage={(page) => {
          if (['dashboard', 'upload', 'insights', 'search'].includes(page)) {
            setActivePage('dashboard');
            setDashboardTab(page);
          } else {
            setActivePage(page);
          }
        }}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {/* Unauthenticated / Home Page */}
        {activePage === 'home' && (
          <HomePage
            onGetStarted={handleGetStarted}
            onLoginDoctor={handleLoginDoctor}
          />
        )}

        {/* Login / Auth Page */}
        {activePage === 'login' && (
          <LoginPage
            initialRole={loginRole}
            onSuccess={handleLoginSuccess}
          />
        )}

        {/* Authenticated Dashboard Views */}
        {activePage === 'dashboard' && (
          <>
            {user?.role === 'doctor' ? (
              <div style={{ padding: '2rem 1.5rem' }}>
                <DoctorPortal
                  onSwitchToPatientView={() => {
                    setDashboardTab('dashboard');
                  }}
                />
              </div>
            ) : (
              <div className="dashboard-layout">
                <Sidebar
                  activeTab={dashboardTab}
                  setActiveTab={setDashboardTab}
                />

                <div className="dashboard-main">
                  {dashboardTab === 'dashboard' && (
                    <DashboardPage onNavigateTab={setDashboardTab} />
                  )}
                  {dashboardTab === 'upload' && (
                    <UploadPage
                      onUploadComplete={(tab) => setDashboardTab(tab || 'dashboard')}
                    />
                  )}
                  {dashboardTab === 'insights' && (
                    <InsightsPage onNavigateTab={setDashboardTab} />
                  )}
                  {dashboardTab === 'search' && <SearchPage />}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RecordsProvider>
        <AppContent />
      </RecordsProvider>
    </AuthProvider>
  );
}
