import { Suspense } from "react";
import { notFound } from "next/navigation";
import { api } from "@/trpc/server";
import { PatientHeader } from "@/src/components/patient/patient-header";
import { PatientTabs } from "@/src/components/patient/patient-tabs";
import { Skeleton } from "@/src/components/ui/skeleton";

interface PatientPageProps {
  params: {
    id: string;
  };
}

export default async function PatientPage({ params }: PatientPageProps) {
  const patient = await api.patient.getById.query(params.id).catch(() => null);

  if (!patient) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PatientHeader patient={patient} />
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <PatientTabs patient={patient} />
      </Suspense>
    </div>
  );
}
