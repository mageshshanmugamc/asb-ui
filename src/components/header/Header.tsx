import React from "react";
import { User } from "oidc-client-ts";
import UserProfile from "../userprofile/UserProfile";
import "./Header.css";

interface HeaderProps {
  toggleTheme: () => void;
  currentTheme: "light" | "dark";
  user: User;
}

const Header: React.FC<HeaderProps> = ({ toggleTheme, currentTheme, user }) => {
  return (
    <header className="header">
      <div className="logo">ASB</div>
      <nav className="nav-links">
        <span className="theme-toggle" onClick={toggleTheme}>
          {currentTheme === "light" ? "🌙" : "☀️"}
        </span>
        <UserProfile user={user} />
      </nav>
    </header>
  );
};

export default Header;
