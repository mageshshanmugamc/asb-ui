import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/header/Header"
import Sidebar from "./components/sidebar/Sidebar";
import Dashboard from "./components/pages/dashboards/Dashboards";
import UserManagement from "./components/pages/users/UserManagement";
import UserGroupManagement from "./components/pages/usergroups/UserGroupManagement";
import RoleManagement from "./components/pages/roles/RoleManagement";
import PolicyManagement from "./components/pages/policies/PolicyManagement";
import MenuManagement from "./components/pages/menus/MenuManagement";
import Reports from "./components/pages/reports/Reports";
import Settings from "./components/pages/settings/Settings";
import "./App.css";
import { initAuth } from "./auth/oidc";
import { User } from "oidc-client-ts";
import { AppAuthProvider, useAppAuth } from "./auth/AppAuthContext";
import ChatBot from "./components/chatbot/ChatBot";

type AuthStatus = "loading" | "authenticated" | "error";

const AccessDenied: React.FC = () => (
  <div style={{ padding: 32, textAlign: "center" }}>
    <h2>Access Denied</h2>
    <p>You do not have permission to view this page.</p>
  </div>
);

const GuardedRoutes: React.FC<{ user: User }> = ({ user }) => {
  const { loading, allowedRoutes, error } = useAppAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center", opacity: 0.6 }}>
        Loading menus...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#d32f2f" }}>
        Failed to load permissions: {error}
      </div>
    );
  }

  const isAllowed = allowedRoutes.has(location.pathname);

  if (!isAllowed) {
    return <AccessDenied />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard user={user} />} />
      <Route path="/dashboard" element={<Dashboard user={user} />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/users/groups" element={<UserGroupManagement />} />
      <Route path="/users/roles" element={<RoleManagement />} />
      <Route path="/users/policies" element={<PolicyManagement />} />
      <Route path="/settings/menus" element={<MenuManagement />} />
      <Route path="/users/*" element={<UserManagement />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/reports/*" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/*" element={<Settings />} />
      <Route path="/audit" element={<Reports />} />
      <Route path="*" element={<AccessDenied />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const initializeAuth = () => {
    setAuthStatus("loading");
    setAuthError(null);

    initAuth()
      .then((authenticatedUser) => {
        if (authenticatedUser) {
          setUser(authenticatedUser);
          setAuthStatus("authenticated");
          console.log("Access Token:", authenticatedUser.access_token);
          console.log("Profile:", authenticatedUser.profile);
          return;
        }
        // signinRedirect was called, page will navigate away
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Authentication failed";
        setAuthError(message);
        setAuthStatus("error");
        console.error("OIDC init error:", err);
      });
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  if (authStatus === "loading") {
    return (
      <div className="auth-status-screen">
        <div className="auth-card">
          <div className="auth-spinner" aria-label="Loading authentication" />
          <p className="auth-message">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (authStatus === "error") {
    return (
      <div className="auth-status-screen">
        <div className="auth-card auth-card-error">
          <h2>Authentication Failed</h2>
          <p className="auth-message">{authError || "Unable to authenticate."}</p>
          <button className="auth-retry" onClick={initializeAuth}>Retry Login</button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppAuthProvider>
        <div className={`app ${theme}`}>
          <Header toggleTheme={toggleTheme} currentTheme={theme} user={user!} />
          <div className="main-layout">
            <Sidebar />
            <div className="content-wrapper">
              <div className="content">
                <GuardedRoutes user={user!} />
              </div>
              <footer className="footer">
                &copy; {new Date().getFullYear()} Magesh Shanmugam &mdash; All rights reserved.
              </footer>
            </div>
          </div>
          <ChatBot />
        </div>
      </AppAuthProvider>
    </BrowserRouter>
  );
};

export default App;
