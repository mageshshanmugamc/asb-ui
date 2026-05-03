import React, { useEffect, useState } from "react";
import DataGrid, { Column } from "../../datagrid/DataGrid";
import { policyService, PolicyModel } from "../../../services/policy.service";
import "../dashboards/Dashboards.css";
import "../usergroups/UserGroupManagement.css";

interface PolicyRow {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
}

const PolicyManagement: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyModel | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", resource: "", action: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<PolicyRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columns: Column<PolicyRow>[] = [
    { key: "id", label: "ID", widthClass: "col-id" },
    { key: "name", label: "Name", widthClass: "col-md" },
    { key: "description", label: "Description", widthClass: "col-lg" },
    { key: "resource", label: "Resource", widthClass: "col-md" },
    { key: "action", label: "Action", widthClass: "col-sm" },
    {
      key: "id",
      label: "Actions",
      widthClass: "col-md",
      sortable: false,
      render: (_value: any, row: PolicyRow) => (
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

  const loadPolicies = () => {
    setLoading(true);
    const subscription = policyService.getAll$().subscribe({
      next: (data) => {
        setPolicies(data.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          resource: p.resource,
          action: p.action,
        })));
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
    const sub = loadPolicies();
    return () => sub.unsubscribe();
  }, []);

  // Create / Edit modal handlers
  const handleOpenCreate = () => {
    setEditingPolicy(null);
    setFormData({ name: "", description: "", resource: "", action: "" });
    setSubmitError(null);
    setShowModal(true);
  };

  const handleEdit = (row: PolicyRow) => {
    setEditingPolicy({ id: row.id, name: row.name, description: row.description, resource: row.resource, action: row.action });
    setFormData({ name: row.name, description: row.description, resource: row.resource, action: row.action });
    setSubmitError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPolicy(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      name: formData.name,
      description: formData.description,
      resource: formData.resource,
      action: formData.action,
    };

    const request$ = editingPolicy
      ? policyService.update$(editingPolicy.id, payload)
      : policyService.create$(payload);

    request$.subscribe({
      next: () => {
        setSubmitting(false);
        setShowModal(false);
        setEditingPolicy(null);
        loadPolicies();
      },
      error: (err) => {
        setSubmitting(false);
        setSubmitError(err.message);
      },
    });
  };

  // Delete handlers
  const handleDeleteClick = (row: PolicyRow) => {
    setDeleteTarget(row);
    setDeleteError(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    policyService.delete$(deleteTarget.id).subscribe({
      next: () => {
        setDeleting(false);
        setDeleteTarget(null);
        loadPolicies();
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
        <h2 className="page-title">Policy Management</h2>
        <button className="btn-primary" onClick={handleOpenCreate}>+ Add Policy</button>
      </div>
      {error && <p className="page-error">Failed to load policies: {error}</p>}
      <DataGrid<PolicyRow>
        columns={columns}
        data={policies}
        loading={loading}
        emptyMessage="No policies found."
        pageSize={10}
      />

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingPolicy ? "Edit Policy" : "Add Policy"}</h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter policy name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter description"
                />
              </div>
              <div className="form-group">
                <label htmlFor="resource">Resource</label>
                <input
                  id="resource"
                  name="resource"
                  type="text"
                  required
                  value={formData.resource}
                  onChange={handleChange}
                  placeholder="Enter resource"
                />
              </div>
              <div className="form-group">
                <label htmlFor="action">Action</label>
                <input
                  id="action"
                  name="action"
                  type="text"
                  required
                  value={formData.action}
                  onChange={handleChange}
                  placeholder="Enter action"
                />
              </div>
              {submitError && <p className="page-error">{submitError}</p>}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting
                    ? editingPolicy ? "Updating..." : "Creating..."
                    : editingPolicy ? "Update Policy" : "Create Policy"}
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
              <h3 className="modal-title">Delete Policy</h3>
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

export default PolicyManagement;
