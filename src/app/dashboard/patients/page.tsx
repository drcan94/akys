import { Suspense } from "react";
import { PatientList } from "@/src/components/patient/patient-list";
import { PatientSearch } from "@/src/components/patient/patient-search";
import { NewPatientButton } from "@/components/patient/new-patient-button";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function PatientsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Hastalar</h1>
        <NewPatientButton />
      </div>
      <div className="flex items-center gap-4">
        <PatientSearch />
      </div>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <PatientList />
      </Suspense>
    </div>
  );
}
