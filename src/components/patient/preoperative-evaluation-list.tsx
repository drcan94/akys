"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { PreoperativeEvaluationDialog } from "./preoperative-evaluation-dialog";
import type { Patient } from "@prisma/client";

interface PreoperativeEvaluationListProps {
  patient: Patient;
}

export function PreoperativeEvaluationList({
  patient,
}: PreoperativeEvaluationListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: evaluations, isLoading } =
    api.preoperativeEvaluation.getByPatientId.useQuery(patient.id);

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Preoperatif Değerlendirmeler</h3>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Değerlendirme
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {evaluations?.map((evaluation) => (
          <Card key={evaluation.id}>
            <CardHeader>
              <CardTitle>
                {format(new Date(evaluation.evaluationDate), "PPP", {
                  locale: tr,
                })}
              </CardTitle>
              <CardDescription>
                {evaluation.createdBy.name} ({evaluation.createdBy.role})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge>{evaluation.asaScore}</Badge>
                {evaluation.consentObtained && (
                  <Badge variant="outline">Onam Alındı</Badge>
                )}
              </div>
              {evaluation.comorbidities.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Komorbiditeler</p>
                  <div className="flex flex-wrap gap-1">
                    {evaluation.comorbidities.map((comorbidity) => (
                      <Badge key={comorbidity} variant="secondary">
                        {comorbidity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {evaluation.notes && (
                <p className="text-sm text-muted-foreground">
                  {evaluation.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <PreoperativeEvaluationDialog
        patient={patient}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
