import React, { useEffect, useState } from "react";
import DataGrid, { Column } from "../../datagrid/DataGrid";
import { countryService, CountryModel } from "../../../services/country.service";
import "../dashboards/Dashboards.css";
import "./Country.css";

interface CountryRow {
  id: number;
  code: string;
  name: string;
  market: string;
}

const Country: React.FC = () => {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryModel | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", market: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<CountryRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columns: Column<CountryRow>[] = [
    { key: "id", label: "ID", widthClass: "col-id" },
    { key: "code", label: "Code", widthClass: "col-sm" },
    { key: "name", label: "Name", widthClass: "col-md" },
    { key: "market", label: "Market", widthClass: "col-md" },
    {
      key: "id",
      label: "Actions",
      widthClass: "col-md",
      sortable: false,
      render: (_value: any, row: CountryRow) => (
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

  const loadCountries = () => {
    setLoading(true);
    const subscription = countryService.getAll$().subscribe({
      next: (data) => {
        setCountries(
          data.map((c) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            market: c.market,
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

  useEffect(() => {
    const sub = loadCountries();
    return () => sub.unsubscribe();
  }, []);

  // Create / Edit modal handlers
  const handleOpenCreate = () => {
    setEditingCountry(null);
    setFormData({ code: "", name: "", market: "" });
    setSubmitError(null);
    setShowModal(true);
  };

  const handleEdit = (row: CountryRow) => {
    countryService.getById$(row.id).subscribe({
      next: (country) => {
        setEditingCountry(country);
        setFormData({ code: country.code, name: country.name, market: country.market });
        setSubmitError(null);
        setShowModal(true);
      },
      error: () => {
        setEditingCountry({ id: row.id, code: row.code, name: row.name, market: row.market });
        setFormData({ code: row.code, name: row.name, market: row.market });
        setSubmitError(null);
        setShowModal(true);
      },
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCountry(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const payload = { code: formData.code, name: formData.name, market: formData.market };

    const request$ = editingCountry
      ? countryService.update$(editingCountry.id, payload)
      : countryService.create$(payload);

    request$.subscribe({
      next: () => {
        setSubmitting(false);
        setShowModal(false);
        setEditingCountry(null);
        loadCountries();
      },
      error: (err) => {
        setSubmitting(false);
        setSubmitError(err.message);
      },
    });
  };

  // Delete handlers
  const handleDeleteClick = (row: CountryRow) => {
    setDeleteTarget(row);
    setDeleteError(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    countryService.delete$(deleteTarget.id).subscribe({
      next: () => {
        setDeleting(false);
        setDeleteTarget(null);
        loadCountries();
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
        <h2 className="page-title">Country Management</h2>
        <button className="btn-primary" onClick={handleOpenCreate}>+ Add Country</button>
      </div>
      {error && <p className="page-error">Failed to load countries: {error}</p>}
      <DataGrid<CountryRow>
        columns={columns}
        data={countries}
        loading={loading}
        emptyMessage="No countries found."
        pageSize={10}
      />

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCountry ? "Edit Country" : "Add Country"}</h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="code">Code</label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. US"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. United States"
                />
              </div>
              <div className="form-group">
                <label htmlFor="market">Market</label>
                <input
                  id="market"
                  name="market"
                  type="text"
                  required
                  value={formData.market}
                  onChange={handleChange}
                  placeholder="e.g. North America"
                />
              </div>
              {submitError && <p className="page-error">{submitError}</p>}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting
                    ? editingCountry ? "Updating..." : "Creating..."
                    : editingCountry ? "Update Country" : "Create Country"}
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
              <h3 className="modal-title">Delete Country</h3>
              <button className="modal-close" onClick={handleDeleteCancel}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="delete-message">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.code})?
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

export default Country;
