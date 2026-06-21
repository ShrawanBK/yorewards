"use client";

import { useState, useTransition } from "react";
import type { ActionError } from "@repo/utils/action-error";
import { Button } from "@repo/ui/button";
import { Textarea } from "@repo/ui/textarea";
import { Label } from "@repo/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";

type AdminReasonConfirmDialogProps = {
  title: string;
  description: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  reasonRequiredMessage: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmClassName: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<{ error?: ActionError } | void>;
  onSuccess: () => void;
  onError: (error: ActionError) => void;
};

export function AdminReasonConfirmDialog({
  title,
  description,
  reasonLabel,
  reasonPlaceholder,
  reasonRequiredMessage,
  cancelLabel,
  confirmLabel,
  confirmClassName,
  onClose,
  onConfirm,
  onSuccess,
  onError,
}: AdminReasonConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError(true);
      return;
    }
    setReasonError(false);
    startTransition(async () => {
      const result = await onConfirm(trimmed);
      if (result?.error) {
        onError(result.error);
        return;
      }
      onSuccess();
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="admin-reason-input">{reasonLabel}</Label>
          <Textarea
            id="admin-reason-input"
            rows={3}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (reasonError) setReasonError(false);
            }}
            placeholder={reasonPlaceholder}
            aria-invalid={reasonError}
            disabled={isPending}
          />
          {reasonError ? (
            <p className="text-xs text-destructive" role="alert">
              {reasonRequiredMessage}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="admin-btn-outline"
            disabled={isPending}
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className={confirmClassName}
            disabled={isPending}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
