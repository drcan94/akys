"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PatientList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = api.patient.list.useQuery({
    page,
    limit: 10,
    search,
  });

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (!data || data.patients.length === 0) {
    return <div>Hasta bulunamadı.</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Protokol No</TableHead>
            <TableHead>Ad Soyad</TableHead>
            <TableHead>Doğum Tarihi</TableHead>
            <TableHead>Son Güncelleme</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>{patient.medicalRecordNumber}</TableCell>
              <TableCell>
                {patient.firstName} {patient.lastName}
              </TableCell>
              <TableCell>
                {format(new Date(patient.dateOfBirth), "P", { locale: tr })}
              </TableCell>
              <TableCell>
                {format(new Date(patient.updatedAt), "Pp", { locale: tr })}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" asChild>
                  <Link href={`/dashboard/patients/${patient.id}`}>
                    Görüntüle
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Önceki
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={page === data.totalPages}
        >
          Sonraki
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
