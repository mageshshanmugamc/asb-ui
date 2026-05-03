import React, { useEffect, useState } from "react";
import DataGrid, { Column } from "../../datagrid/DataGrid";
import MultiSelect from "../../multiselect/MultiSelect";
import { userGroupService, UserGroupModel } from "../../../services/usergroup.service";
import { roleService, RoleModel } from "../../../services/role.service";
import "../dashboards/Dashboards.css";
import "./UserGroupManagement.css";

interface UserGroupRow {
  id: number;
  groupName: string;
  roles: string;
}

const UserGroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<UserGroupRow[]>([]);
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroupModel | null>(null);
  const [formData, setFormData] = useState({ groupName: "" });
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<UserGroupRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columns: Column<UserGroupRow>[] = [
    { key: "id", label: "ID", widthClass: "col-id" },
    { key: "groupName", label: "Group Name", widthClass: "col-md" },
    { key: "roles", label: "Roles", widthClass: "col-lg" },
    {
      key: "id",
      label: "Actions",
      widthClass: "col-md",
      sortable: false,
      render: (_value: any, row: UserGroupRow) => (
        <div className="actions-cell">
          <button className="btn-secondary btn-action" onClick={() => handleEdit(row)}>
            Edit
          </button>
          <button className="btn-secondary btn-action btn-delete" onClick={() => handleDeleteClick(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  const loadGroups = () => {
    setLoading(true);
    const subscription = userGroupService.getAll$().subscribe({
      next: (data) => {
        setGroups(
          data.map((g) => ({
            id: g.id,
            groupName: g.groupName,
            roles: g.roles.map((r) => r.name).join(", ") || "—",
          }))
        );
        setLoading(false);
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
      },
    });
    return subscription;
  };

  const loadRoles = () => {
    roleService.getAll$().subscribe({
      next: (data) => setRoles(data),
      error: () => {},
    });
  };

  useEffect(() => {
    const sub = loadGroups();
    loadRoles();
    return () => sub.unsubscribe();
  }, []);

  // Create / Edit modal handlers
  const handleOpenCreate = () => {
    setEditingGroup(null);
    setFormData({ groupName: "" });
    setSelectedRoleIds([]);
    setSubmitError(null);
    setShowModal(true);
  };

  const handleEdit = (row: UserGroupRow) => {
    userGroupService.getById$(row.id).subscribe({
      next: (group) => {
        setEditingGroup(group);
        setFormData({ groupName: group.groupName });
        setSelectedRoleIds(group.roles.map((r) => r.id));
        setSubmitError(null);
        setShowModal(true);
      },
      error: () => {
        setEditingGroup({ id: row.id, groupName: row.groupName, users: [], roles: [] });
        setFormData({ groupName: row.groupName });
        setSelectedRoleIds([]);
        setSubmitError(null);
        setShowModal(true);
      },
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGroup(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const payload = { groupName: formData.groupName, roleIds: selectedRoleIds };

    const request$ = editingGroup
      ? userGroupService.update$(editingGroup.id, payload)
      : userGroupService.create$(payload);

    request$.subscribe({
      next: () => {
        setSubmitting(false);
        setShowModal(false);
        setEditingGroup(null);
        loadGroups();
      },
      error: (err) => {
        setSubmitting(false);
        setSubmitError(err.message);
      },
    });
  };

  // Delete handlers
  const handleDeleteClick = (row: UserGroupRow) => {
    setDeleteTarget(row);
    setDeleteError(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    userGroupService.delete$(deleteTarget.id).subscribe({
      next: () => {
        setDeleting(false);
        setDeleteTarget(null);
        loadGroups();
      },
      error: (err) => {
        setDeleting(false);
        setDeleteError(err.message);
      },
    });
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    setDeleteError(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">User Group Management</h2>
        <button className="btn-primary" onClick={handleOpenCreate}>+ Add Group</button>
      </div>
      {error && <p className="page-error">Failed to load user groups: {error}</p>}
      <DataGrid<UserGroupRow>
        columns={columns}
        data={groups}
        loading={loading}
        emptyMessage="No user groups found."
        pageSize={10}
      />

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingGroup ? "Edit User Group" : "Add User Group"}</h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="groupName">Group Name</label>
                <input
                  id="groupName"
                  name="groupName"
                  type="text"
                  required
                  value={formData.groupName}
                  onChange={handleChange}
                  placeholder="Enter group name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Roles</label>
                <MultiSelect
                  options={roles.map((r) => ({ value: r.id, label: r.name }))}
                  selected={selectedRoleIds}
                  onChange={(vals) => setSelectedRoleIds(vals as number[])}
                  placeholder="Select roles..."
                />
              </div>
              {submitError && <p className="page-error">{submitError}</p>}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting
                    ? editingGroup ? "Updating..." : "Creating..."
                    : editingGroup ? "Update Group" : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete User Group</h3>
              <button className="modal-close" onClick={handleDeleteCancel}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="delete-message">
                Are you sure you want to delete <strong>{deleteTarget.groupName}</strong>?
              </p>
              {deleteError && <p className="page-error">{deleteError}</p>}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleDeleteCancel}>Cancel</button>
                <button
                  type="button"
                  className="btn-primary btn-danger"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGroupManagement;
