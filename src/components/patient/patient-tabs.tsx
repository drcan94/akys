"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PreoperativeEvaluationList } from "./preoperative-evaluation-list";
import { PatientInfo } from "./patient-info";
import { OperationNoteList } from "./operation-note-list";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Patient } from "@prisma/client";

interface PatientTabsProps {
  patient: Patient;
}

export function PatientTabs({ patient }: PatientTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "info";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full justify-start">
        <TabsTrigger value="info">Hasta Bilgileri</TabsTrigger>
        <TabsTrigger value="evaluations">
          Preoperatif Değerlendirmeler
        </TabsTrigger>
        <TabsTrigger value="operations">Operasyon Notları</TabsTrigger>
      </TabsList>
      <TabsContent value="info" className="mt-6">
        <PatientInfo patient={patient} />
      </TabsContent>
      <TabsContent value="evaluations" className="mt-6">
        <PreoperativeEvaluationList patient={patient} />
      </TabsContent>
      <TabsContent value="operations" className="mt-6">
        <OperationNoteList patient={patient} />
      </TabsContent>
    </Tabs>
  );
}
