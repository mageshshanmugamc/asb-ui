import React, { useEffect, useState } from "react";
import DataGrid, { Column } from "../../datagrid/DataGrid";
import { menuService, MenuItemModel } from "../../../services/menu.service";
import "../dashboards/Dashboards.css";
import "../usergroups/UserGroupManagement.css";

interface MenuRow {
  id: number;
  name: string;
  route: string;
  icon: string;
  displayOrder: number;
  parentName: string;
}

/** Flatten nested menus into rows with parent name */
function flattenMenus(menus: MenuItemModel[], parentName = "—"): MenuRow[] {
  const rows: MenuRow[] = [];
  for (const m of menus) {
    rows.push({
      id: m.id,
      name: m.name,
      route: m.route,
      icon: m.icon ?? "",
      displayOrder: m.displayOrder,
      parentName,
    });
    if (m.children.length > 0) {
      rows.push(...flattenMenus(m.children, m.name));
    }
  }
  return rows;
}

/** Build a flat list of parent options from the tree */
function flattenParentOptions(menus: MenuItemModel[], prefix = ""): { value: number; label: string }[] {
  const options: { value: number; label: string }[] = [];
  for (const m of menus) {
    const label = prefix ? `${prefix} > ${m.name}` : m.name;
    options.push({ value: m.id, label });
    if (m.children.length > 0) {
      options.push(...flattenParentOptions(m.children, label));
    }
  }
  return options;
}

const MenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<MenuItemModel[]>([]);
  const [rows, setRows] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuRow | null>(null);
  const [formData, setFormData] = useState({ name: "", route: "", icon: "", displayOrder: "0", parentId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<MenuRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columns: Column<MenuRow>[] = [
    { key: "id", label: "ID", widthClass: "col-id" },
    { key: "name", label: "Name", widthClass: "col-md" },
    { key: "route", label: "Route", widthClass: "col-md" },
    { key: "icon", label: "Icon", widthClass: "col-sm" },
    { key: "displayOrder", label: "Order", widthClass: "col-sm" },
    { key: "parentName", label: "Parent", widthClass: "col-md" },
    {
      key: "id",
      label: "Actions",
      widthClass: "col-md",
      sortable: false,
      render: (_value: any, row: MenuRow) => (
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

  const loadMenus = () => {
    setLoading(true);
    const subscription = menuService.getAll$().subscribe({
      next: (data) => {
        setMenus(data);
        setRows(flattenMenus(data));
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
    const sub = loadMenus();
    return () => sub.unsubscribe();
  }, []);

  // Find parentId for an existing menu item by walking the tree
  const findParentId = (menus: MenuItemModel[], targetId: number): number | null => {
    for (const m of menus) {
      for (const child of m.children) {
        if (child.id === targetId) return m.id;
      }
      const found = findParentId(m.children, targetId);
      if (found !== null) return found;
    }
    return null;
  };

  // Create / Edit modal handlers
  const handleOpenCreate = () => {
    setEditingMenu(null);
    setFormData({ name: "", route: "", icon: "", displayOrder: "0", parentId: "" });
    setSubmitError(null);
    setShowModal(true);
  };

  const handleEdit = (row: MenuRow) => {
    const parentId = findParentId(menus, row.id);
    setEditingMenu(row);
    setFormData({
      name: row.name,
      route: row.route,
      icon: row.icon,
      displayOrder: String(row.displayOrder),
      parentId: parentId != null ? String(parentId) : "",
    });
    setSubmitError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMenu(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      name: formData.name,
      route: formData.route,
      icon: formData.icon || undefined,
      displayOrder: Number(formData.displayOrder),
      parentId: formData.parentId ? Number(formData.parentId) : null,
    };

    const request$ = editingMenu
      ? menuService.update$(editingMenu.id, payload)
      : menuService.create$(payload);

    request$.subscribe({
      next: () => {
        setSubmitting(false);
        setShowModal(false);
        setEditingMenu(null);
        loadMenus();
      },
      error: (err) => {
        setSubmitting(false);
        setSubmitError(err.message);
      },
    });
  };

  // Delete handlers
  const handleDeleteClick = (row: MenuRow) => {
    setDeleteTarget(row);
    setDeleteError(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    menuService.delete$(deleteTarget.id).subscribe({
      next: () => {
        setDeleting(false);
        setDeleteTarget(null);
        loadMenus();
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

  const parentOptions = flattenParentOptions(menus);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Menu Management</h2>
        <button className="btn-primary" onClick={handleOpenCreate}>+ Add Menu</button>
      </div>
      {error && <p className="page-error">Failed to load menus: {error}</p>}
      <DataGrid<MenuRow>
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No menus found."
        pageSize={10}
      />

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingMenu ? "Edit Menu" : "Add Menu"}</h3>
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
                  placeholder="Enter menu name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="route">Route</label>
                <input
                  id="route"
                  name="route"
                  type="text"
                  required
                  value={formData.route}
                  onChange={handleChange}
                  placeholder="e.g. /users"
                />
              </div>
              <div className="form-group">
                <label htmlFor="icon">Icon</label>
                <input
                  id="icon"
                  name="icon"
                  type="text"
                  value={formData.icon}
                  onChange={handleChange}
                  placeholder="e.g. dashboard, people, settings"
                />
              </div>
              <div className="form-group">
                <label htmlFor="displayOrder">Display Order</label>
                <input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  required
                  value={formData.displayOrder}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="parentId">Parent Menu</label>
                <select
                  id="parentId"
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleChange}
                >
                  <option value="">-- None (Top Level) --</option>
                  {parentOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {submitError && <p className="page-error">{submitError}</p>}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting
                    ? editingMenu ? "Updating..." : "Creating..."
                    : editingMenu ? "Update Menu" : "Create Menu"}
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
              <h3 className="modal-title">Delete Menu</h3>
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

export default MenuManagement;
