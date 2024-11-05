import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/src/server/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { NewPatientForm } from "@/components/patient/new-patient-form";

export default async function NewPatientPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/");
  }

  if (!["SUPERADMIN", "LECTURER", "RESIDENT"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Hasta Kaydı</CardTitle>
        </CardHeader>
        <CardContent>
          <NewPatientForm />
        </CardContent>
      </Card>
    </div>
  );
}
