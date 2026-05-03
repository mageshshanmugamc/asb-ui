import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppAuth } from "../../auth/AppAuthContext";
import { MenuModel } from "../../services/auth.service";
import "./Sidebar.css";

const iconMap: Record<string, string> = {
  dashboard: "🏠",
  people: "👥",
  bar_chart: "📊",
  settings: "⚙️",
  history: "📋",
  person: "👤",
  group: "👥",
  admin_panel_settings: "🔐",
  assessment: "📈",
  security: "🔒",
  tune: "🎛️",
  lock: "🔑",
};

const MenuItem: React.FC<{ menu: MenuModel; depth?: number }> = ({ menu, depth = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = menu.children.length > 0;

  return (
    <div className="sidebar-menu-item">
      {hasChildren ? (
        <>
          <button
            className={`menu-link menu-parent ${expanded ? "expanded" : ""}`}
            onClick={() => setExpanded(!expanded)}
            style={{ paddingLeft: 12 + depth * 16 }}
          >
            <span className="menu-icon">{iconMap[menu.icon ?? ""] ?? "📄"}</span>
            <span className="menu-label">{menu.name}</span>
            <span className={`menu-chevron ${expanded ? "open" : ""}`}>›</span>
          </button>
          {expanded && (
            <div className="sidebar-submenu">
              {menu.children
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((child) => (
                  <MenuItem key={child.id} menu={child} depth={depth + 1} />
                ))}
            </div>
          )}
        </>
      ) : (
        <NavLink
          to={menu.route}
          className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
          style={{ paddingLeft: 12 + depth * 16 }}
          title={menu.name}
        >
          <span className="menu-icon">{iconMap[menu.icon ?? ""] ?? "📄"}</span>
          <span className="menu-label">{menu.name}</span>
        </NavLink>
      )}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const { menus, loading } = useAppAuth();

  if (loading) {
    return <aside className="sidebar"><span className="menu-link">...</span></aside>;
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menus
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((menu) => (
            <MenuItem key={menu.id} menu={menu} />
          ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
