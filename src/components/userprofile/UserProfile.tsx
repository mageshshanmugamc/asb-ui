import React, { useState, useRef, useEffect } from "react";
import { User } from "oidc-client-ts";
import { logout } from "../../auth/oidc";
import "./UserProfile.css";

interface UserProfileProps {
  user: User;
}

const getInitials = (user: User): string => {
  const given = user.profile.given_name || "";
  const family = user.profile.family_name || "";

  if (given && family) {
    return (given[0] + family[0]).toUpperCase();
  }

  const name = user.profile.name || user.profile.preferred_username || "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || "U").toUpperCase();
};

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = getInitials(user);
  const displayName = user.profile.name || user.profile.preferred_username || "User";
  const email = user.profile.email || "";

  return (
    <div className="user-profile" ref={cardRef}>
      <div className="user-avatar" onClick={() => setOpen(!open)}>
        {initials}
      </div>

      {open && (
        <div className="user-profile-card">
          <div className="user-profile-card-header">
            <div className="user-avatar user-avatar-large">{initials}</div>
            <div className="user-profile-info">
              <span className="user-profile-name">{displayName}</span>
              {email && <span className="user-profile-email">{email}</span>}
            </div>
          </div>
          <div className="user-profile-card-body">
            <button className="user-profile-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
