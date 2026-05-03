import React from "react";
import { User } from "oidc-client-ts";
import "./Dashboards.css";

interface DashboardProps {
  user: User;
}

const Dashboards: React.FC<DashboardProps> = ({ user }) => {
  const fullName = user.profile.name || user.profile.preferred_username || "User";

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
      </div>
      <div className="dashboard-welcome">
        <h3>Welcome back, {fullName}! 👋</h3>
        <p>How was your day? Here's your workspace overview.</p>
      </div>
    </div>
  );
};

export default Dashboards;
