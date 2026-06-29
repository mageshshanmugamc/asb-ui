import React, { useEffect, useRef, useState, useCallback } from "react";
import { forkJoin } from "rxjs";
import * as signalR from "@microsoft/signalr";
import DataGrid, { Column, ServerQueryParams } from "../../datagrid/DataGrid";
import MultiSelect from "../../multiselect/MultiSelect";
import { userService, UserGroupModel } from "../../../services/user.service";
import "../dashboards/Dashboards.css";

const BASE_URL = (window as any).__ENV__?.REACT_APP_BASE_URL || "http://localhost:5057";

interface UserRow {
  id: number;
  username: string;
  email: string;
  userGroupNames: string;
}

const columns: Column<UserRow>[] = [
  { key: "id", label: "ID", widthClass: "col-id", sortKey: "Id" },
  { key: "username", label: "Username", widthClass: "col-md", sortKey: "Username" },
  { key: "email", label: "Email", widthClass: "col-lg", sortKey: "Email" },
  { key: "userGroupNames", label: "Groups", widthClass: "col-md", sortable: false },
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [groups, setGroups] = useState<UserGroupModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "" });
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());

  // Track current query params for reloading
  const queryRef = useRef<ServerQueryParams>({ skip: 0, take: 10 });

  const loadUsers = useCallback((params?: ServerQueryParams) => {
    const q = params ?? queryRef.current;
    queryRef.current = q;
    setLoading(true);
    const subscription = forkJoin({
      usersPage: userService.getAll$(q),
      groups: userService.getGroups$(),
    }).subscribe({
      next: ({ usersPage, groups }) => {
        const gMap = new Map(groups.map((g) => [g.id, g.groupName]));
        setGroups(groups);
        setTotalCount(usersPage.totalCount);
        const rows: UserRow[] = usersPage.items.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          userGroupNames: u.userGroupIds.length > 0
            ? u.userGroupIds.map((gid) => gMap.get(gid) ?? String(gid)).join(", ")
            : "—",
        }));
        setUsers(rows);
        setLoading(false);
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
      },
    });
    return subscription;
  }, []);

  // Initial data load
  useEffect(() => {
    const sub = loadUsers();
    return () => sub.unsubscribe();
  }, [loadUsers]);

  const handleQueryChange = useCallback((params: ServerQueryParams) => {
    loadUsers(params);
  }, [loadUsers]);

  // SignalR connection: listen for real-time "UserCreated" events
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const existingIdsRef = useRef<Set<number>>(new Set());

  // Keep track of current user IDs for diffing on SignalR events
  useEffect(() => {
    existingIdsRef.current = new Set(users.map((u) => u.id));
  }, [users]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/notifications`)
      .build();

    connectionRef.current = connection;

    connection.on("UserCreated", (notification: { message: string }) => {
      console.log(notification.message);
      const previousIds = new Set(existingIdsRef.current);
      // Reload current page and highlight the new ones
      const q = queryRef.current;
      forkJoin({
        usersPage: userService.getAll$(q),
        groups: userService.getGroups$(),
      }).subscribe({
        next: ({ usersPage, groups: freshGroups }) => {
          const gMap = new Map(freshGroups.map((g) => [g.id, g.groupName]));
          setGroups(freshGroups);
          setTotalCount(usersPage.totalCount);
          const rows: UserRow[] = usersPage.items.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            userGroupNames: u.userGroupIds.length > 0
              ? u.userGroupIds.map((gid) => gMap.get(gid) ?? String(gid)).join(", ")
              : "—",
          }));
          setUsers(rows);

          // Find newly added IDs
          const newIds = usersPage.items
            .map((u) => u.id)
            .filter((id) => !previousIds.has(id));

          if (newIds.length > 0) {
            setHighlightedIds(new Set(newIds));
            setTimeout(() => setHighlightedIds(new Set()), 3000);
          }
        },
      });
    });

    connection.start().catch((err) =>
      console.error("SignalR connection failed:", err)
    );

    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop();
      }
    };
  }, [loadUsers]);

  const handleOpenModal = () => {
    setFormData({ username: "", email: "" });
    setSelectedGroupIds([]);
    setSubmitError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      username: formData.username,
      email: formData.email,
      userGroupIds: selectedGroupIds,
    };

    userService.create$(payload).subscribe({
      next: () => {
        setSubmitting(false);
        setShowModal(false);
        loadUsers();
      },
      error: (err) => {
        setSubmitting(false);
        setSubmitError(err.message);
      },
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">User Management</h2>
        <button className="btn-primary" onClick={handleOpenModal}>+ Add User</button>
      </div>
      {error && <p className="page-error">Failed to load users: {error}</p>}
      <DataGrid<UserRow>
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users found."
        pageSize={10}
        totalCount={totalCount}
        onQueryChange={handleQueryChange}
        rowClassName={(row) => highlightedIds.has(row.id) ? "row-new" : undefined}
      />

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add User</h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>User Groups</label>
                <MultiSelect
                  options={groups.map((g) => ({ value: g.id, label: g.groupName }))}
                  selected={selectedGroupIds}
                  onChange={(vals) => setSelectedGroupIds(vals as number[])}
                  placeholder="Select groups..."
                />
              </div>
              {submitError && <p className="page-error">{submitError}</p>}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
