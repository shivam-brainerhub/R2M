"use client";

import React, { useCallback, useEffect } from "react";

export type ModalVariant = "danger" | "warning" | "info" | "success";

export interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  variant?: ModalVariant;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string | null;
  isLoading?: boolean;
}

export default function CustomModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = "info",
  icon,
  confirmLabel,
  cancelLabel = "Cancel",
  isLoading = false,
}: CustomModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading],
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: "bg-rose-50 text-rose-600",
      defaultIcon: "warning",
      confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white",
      defaultConfirmText: "Delete",
    },
    warning: {
      iconBg: "bg-amber-50 text-amber-600",
      defaultIcon: "warning",
      confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white",
      defaultConfirmText: "Confirm",
    },
    info: {
      iconBg: "bg-blue-50 text-blue-600",
      defaultIcon: "info",
      confirmBtn: "bg-navy hover:bg-navy-light text-white",
      defaultConfirmText: "OK",
    },
    success: {
      iconBg: "bg-emerald-50 text-emerald-600",
      defaultIcon: "check_circle",
      confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
      defaultConfirmText: "Done",
    },
  }[variant];

  const resolvedIcon = icon || variantStyles.defaultIcon;
  const isAlertOnly = cancelLabel === null || cancelLabel === undefined;
  const resolvedConfirmLabel =
    confirmLabel || (isAlertOnly ? "OK" : variantStyles.defaultConfirmText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-scale-in">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${variantStyles.iconBg}`}
        >
          <span className="material-symbols-outlined text-2xl!">
            {resolvedIcon}
          </span>
        </div>

        <h3 className="text-base font-bold text-navy mb-2">{title}</h3>

        <div className="text-xs text-gray-500 leading-relaxed mb-6">
          {description}
        </div>

        <div className="flex items-center justify-end gap-3">
          {!isAlertOnly && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={async () => {
              if (onConfirm) {
                await onConfirm();
              } else {
                onClose();
              }
            }}
            className={`inline-flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${variantStyles.confirmBtn}`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
