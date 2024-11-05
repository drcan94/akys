"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/trpc/react";
import { OperationNoteForm } from "./operation-note-form";
import { FileUpload } from "@/components/common/file-upload";
import { useSession } from "next-auth/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { ActiveCollaborators } from "./active-collaborators";
import { useCollaboration } from "@/lib/collaboration";
import type { Patient } from "@prisma/client";

interface OperationNoteDialogProps {
  patient: Patient;
  noteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  { id: "basic", label: "Temel Bilgiler" },
  { id: "medications", label: "İlaçlar" },
  { id: "monitoring", label: "Monitörizasyon" },
  { id: "details", label: "Detaylar" },
  { id: "attachments", label: "Ekler" },
  { id: "review", label: "İnceleme" },
];

export function OperationNoteDialog({
  patient,
  noteId,
  open,
  onOpenChange,
}: OperationNoteDialogProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<any>(null);
  const { data: session } = useSession();
  const { toast } = useToast();

  const { data: note, isLoading: isLoadingNote } =
    api.operationNote.getById.useQuery(noteId!, { enabled: !!noteId });

  const { isLocked, lockedBy, startEditing, stopEditing } = useCollaboration({
    noteId: noteId!,
    userId: session?.user.id!,
    userName: session?.user.name,
    onCollaboratorJoin: (userId, userName) => {
      toast({
        title: "Aktif Kullanıcı",
        description: `${userName || "Bir kullanıcı"} notu görüntülüyor.`,
      });
    },
    onNoteLocked: (userId, userName) => {
      toast({
        variant: "destructive",
        title: "Not Kilitlendi",
        description: `${userName || "Bir kullanıcı"} notu düzenlemeye başladı.`,
      });
    },
  });

  // Handle dialog close
  const handleClose = async () => {
    if (formData) {
      const confirmed = window.confirm(
        "Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?"
      );
      if (!confirmed) return;
    }

    await stopEditing();
    setActiveStep(0);
    setFormData(null);
    onOpenChange(false);
  };

  // Calculate progress
  const progress = ((activeStep + 1) / STEPS.length) * 100;

  if (isLoadingNote) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {noteId ? "Operasyon Notunu Düzenle" : "Yeni Operasyon Notu"}
            </DialogTitle>
            {noteId && (
              <ActiveCollaborators
                noteId={noteId}
                currentUserId={session?.user.id!}
                lockedBy={lockedBy}
                lockedAt={note?.lockedAt}
              />
            )}
          </div>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        {isLocked && lockedBy?.id !== session?.user.id && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bu not {lockedBy?.name || "başka bir kullanıcı"} tarafından
              düzenleniyor
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={STEPS[activeStep].id} className="mt-4">
          <TabsList className="grid w-full grid-cols-6">
            {STEPS.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                disabled={index > activeStep}
                onClick={() => setActiveStep(index)}
              >
                {step.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <OperationNoteForm
              patient={patient}
              initialData={note}
              step="basic"
              isLocked={isLocked && lockedBy?.id !== session?.user.id}
              onStartEditing={startEditing}
              onStopEditing={stopEditing}
              onNext={(data) => {
                setFormData((prev: any) => ({ ...prev, ...data }));
                setActiveStep(1);
              }}
            />
          </TabsContent>

          {/* Similar updates for other steps... */}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
