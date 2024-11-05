"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Common medications for auto-suggestion
const COMMON_MEDICATIONS = [
  "Propofol",
  "Fentanil",
  "Remifentanil",
  "Midazolam",
  "Ketamin",
  "Rokuronyum",
  "Atropin",
  "Neostigmin",
  "Efedrin",
  "Atrakuryum",
  "Sugammadeks",
  "Tiyopental",
  "Sevofluran",
  "Desfluran",
  // Add more medications as needed
];

const ROUTES = [
  "IV",
  "IM",
  "SC",
  "PO",
  "İnhalasyon",
  "Epidural",
  "İntratekal",
] as const;

interface Medication {
  name: string;
  dosage: string;
  route: (typeof ROUTES)[number];
  time: string;
}

interface MedicationListProps {
  value: Medication[];
  onChange: (medications: Medication[]) => void;
  error?: string;
}

export function MedicationList({
  value,
  onChange,
  error,
}: MedicationListProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newMedication, setNewMedication] = useState<Medication>({
    name: "",
    dosage: "",
    route: "IV",
    time: "",
  });

  // Filter medications based on search
  const filteredMedications = COMMON_MEDICATIONS.filter((med) =>
    med.toLowerCase().includes(search.toLowerCase())
  );

  const addMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.time)
      return;

    // Check for duplicates
    const isDuplicate = value.some(
      (med) =>
        med.name === newMedication.name &&
        med.route === newMedication.route &&
        med.time === newMedication.time
    );

    if (isDuplicate) return;

    onChange([...value, newMedication]);
    setNewMedication({
      name: "",
      dosage: "",
      route: "IV",
      time: "",
    });
    setOpen(false);
  };

  const removeMedication = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">İlaç Listesi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {newMedication.name || "İlaç seçin..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="İlaç ara..."
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandEmpty>İlaç bulunamadı</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-48">
                        {filteredMedications.map((med) => (
                          <CommandItem
                            key={med}
                            value={med}
                            onSelect={() => {
                              setNewMedication({ ...newMedication, name: med });
                              setSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                newMedication.name === med
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {med}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-[150px]">
              <Input
                placeholder="Doz"
                value={newMedication.dosage}
                onChange={(e) =>
                  setNewMedication({ ...newMedication, dosage: e.target.value })
                }
              />
            </div>

            <div className="w-[120px]">
              <Select
                value={newMedication.route}
                onValueChange={(value) =>
                  setNewMedication({
                    ...newMedication,
                    route: value as (typeof ROUTES)[number],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Yol" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTES.map((route) => (
                    <SelectItem key={route} value={route}>
                      {route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[120px]">
              <Input
                type="time"
                value={newMedication.time}
                onChange={(e) =>
                  setNewMedication({ ...newMedication, time: e.target.value })
                }
              />
            </div>

            <Button
              type="button"
              onClick={addMedication}
              disabled={
                !newMedication.name ||
                !newMedication.dosage ||
                !newMedication.time
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Ekle
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {value.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İlaç</TableHead>
                  <TableHead>Doz</TableHead>
                  <TableHead>Yol</TableHead>
                  <TableHead>Saat</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {value.map((medication, index) => (
                  <TableRow key={index}>
                    <TableCell>{medication.name}</TableCell>
                    <TableCell>{medication.dosage}</TableCell>
                    <TableCell>{medication.route}</TableCell>
                    <TableCell>{medication.time}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMedication(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
