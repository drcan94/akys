"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PreoperativeEvaluationForm } from "./preoperative-evaluation-form";
import type { Patient } from "@prisma/client";

interface PreoperativeEvaluationDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreoperativeEvaluationDialog({
  patient,
  open,
  onOpenChange,
}: PreoperativeEvaluationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Yeni Preoperatif Değerlendirme</DialogTitle>
        </DialogHeader>
        <PreoperativeEvaluationForm
          patientId={patient.id}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
