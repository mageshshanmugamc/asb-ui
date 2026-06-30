import React from "react";

interface ConfirmDialogProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmingLabel?: string;
  confirming?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmingLabel = "Deleting...",
  confirming = false,
  error = null,
  onConfirm,
  onCancel,
}) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3 className="modal-title">{title}</h3>
        <button className="modal-close" onClick={onCancel}>&times;</button>
      </div>
      <div className="modal-body">
        <p className="delete-message">{message}</p>
        {error && <p className="page-error">{error}</p>}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-primary btn-danger"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;
