"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Patient } from "@prisma/client";

interface PatientInfoProps {
  patient: Patient;
}

export function PatientInfo({ patient }: PatientInfoProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Kişisel Bilgiler</CardTitle>
          <CardDescription>Hastanın temel bilgileri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Ad Soyad</span>
            <span className="text-sm text-muted-foreground">
              {patient.firstName} {patient.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Protokol No</span>
            <span className="text-sm text-muted-foreground">
              {patient.medicalRecordNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Doğum Tarihi</span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(patient.dateOfBirth), "P", { locale: tr })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Cinsiyet</span>
            <span className="text-sm text-muted-foreground">
              {patient.gender}
            </span>
          </div>
          {patient.bloodType && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Kan Grubu</span>
              <span className="text-sm text-muted-foreground">
                {patient.bloodType}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İletişim Bilgileri</CardTitle>
          <CardDescription>Hastanın iletişim bilgileri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {patient.phoneNumber && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Telefon</span>
              <span className="text-sm text-muted-foreground">
                {patient.phoneNumber}
              </span>
            </div>
          )}
          {patient.email && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">E-posta</span>
              <span className="text-sm text-muted-foreground">
                {patient.email}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {(patient.allergies || patient.comorbidities) && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tıbbi Bilgiler</CardTitle>
            <CardDescription>Alerjiler ve komorbiditeler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.allergies && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Alerjiler</h4>
                <p className="text-sm text-muted-foreground">
                  {patient.allergies}
                </p>
              </div>
            )}
            {patient.comorbidities && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Komorbiditeler</h4>
                <div className="flex flex-wrap gap-2">
                  {(patient.comorbidities as string[]).map((comorbidity) => (
                    <Badge key={comorbidity} variant="secondary">
                      {comorbidity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
