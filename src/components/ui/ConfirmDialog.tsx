"use client";

import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-danger flex-1"
          >
            {loading ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
