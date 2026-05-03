import React, { useEffect, useState } from "react";
import DataGrid, { Column } from "../../datagrid/DataGrid";
import { roleService, RoleModel } from "../../../services/role.service";
import "../dashboards/Dashboards.css";
import "../usergroups/UserGroupManagement.css";

interface RoleRow {
  id: number;
  name: string;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleModel | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columns: Column<RoleRow>[] = [
    { key: "id", label: "ID", widthClass: "col-id" },
    { key: "name", label: "Role Name", widthClass: "col-lg" },
    {
      key: "id",
      label: "Actions",
      widthClass: "col-md",
      sortable: false,
      render: (_value: any, row: RoleRow) => (
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

  const loadRoles = () => {
    setLoading(true);
    const subscription = roleService.getAll$().subscribe({
      next: (data) => {
        setRoles(data.map((r) => ({ id: r.id, name: r.name })));
        setLoading(false);
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
      },
    });
    return subscription;
  };

  useEffect(() => {
    const sub = loadRoles();
    return () => sub.unsubscribe();
  }, []);

  // Create / Edit modal handlers
  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: "" });
    setSubmitError(null);
    setShowModal(true);
  };

  const handleEdit = (row: RoleRow) => {
    setEditingRole({ id: row.id, name: row.name });
    setFormData({ name: row.name });
    setSubmitError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const payload = { name: formData.name };

    const request$ = editingRole
      ? roleService.update$(editingRole.id, payload)
      : roleService.create$(payload);

    request$.subscribe({
      next: () => {
        setSubmitting(false);
        setShowModal(false);
        setEditingRole(null);
        loadRoles();
      },
      error: (err) => {
        setSubmitting(false);
        setSubmitError(err.message);
      },
    });
  };

  // Delete handlers
  const handleDeleteClick = (row: RoleRow) => {
    setDeleteTarget(row);
    setDeleteError(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    roleService.delete$(deleteTarget.id).subscribe({
      next: () => {
        setDeleting(false);
        setDeleteTarget(null);
        loadRoles();
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
        <h2 className="page-title">Role Management</h2>
        <button className="btn-primary" onClick={handleOpenCreate}>+ Add Role</button>
      </div>
      {error && <p className="page-error">Failed to load roles: {error}</p>}
      <DataGrid<RoleRow>
        columns={columns}
        data={roles}
        loading={loading}
        emptyMessage="No roles found."
        pageSize={10}
      />

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingRole ? "Edit Role" : "Add Role"}</h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Role Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter role name"
                  autoFocus
                />
              </div>
              {submitError && <p className="page-error">{submitError}</p>}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting
                    ? editingRole ? "Updating..." : "Creating..."
                    : editingRole ? "Update Role" : "Create Role"}
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
              <h3 className="modal-title">Delete Role</h3>
              <button className="modal-close" onClick={handleDeleteCancel}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="delete-message">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
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

export default RoleManagement;
