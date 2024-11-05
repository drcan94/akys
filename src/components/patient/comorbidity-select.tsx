"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import {
  COMORBIDITIES,
  COMORBIDITY_CATEGORIES,
  type Comorbidity,
} from "@/lib/constants/comorbidities";

interface ComorbiditySelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  onTestsRequired?: (tests: string[]) => void;
}

interface CustomComorbidity {
  id: string;
  label: string;
  category: keyof typeof COMORBIDITY_CATEGORIES;
  isCustom: true;
}

export function ComorbiditySelect({
  value,
  onChange,
  onTestsRequired,
}: ComorbiditySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customComorbidity, setCustomComorbidity] = useState({
    label: "",
    category: "OTHER" as keyof typeof COMORBIDITY_CATEGORIES,
  });

  // Combine predefined and custom comorbidities
  const allComorbidities = useMemo(() => {
    const customIds = value.filter(
      (id) => !COMORBIDITIES.find((c) => c.id === id)
    );

    const customItems: CustomComorbidity[] = customIds.map((id) => ({
      id,
      label: id,
      category: "OTHER",
      isCustom: true,
    }));

    return [...COMORBIDITIES, ...customItems];
  }, [value]);

  // Group comorbidities by category
  const groupedComorbidities = useMemo(() => {
    const grouped = Object.keys(COMORBIDITY_CATEGORIES).reduce(
      (acc, category) => {
        acc[category] = allComorbidities.filter(
          (item) => item.category === category
        );
        return acc;
      },
      {} as Record<string, (Comorbidity | CustomComorbidity)[]>
    );

    return grouped;
  }, [allComorbidities]);

  // Filter comorbidities based on search
  const filteredGroups = useMemo(() => {
    if (!search) return groupedComorbidities;

    const searchLower = search.toLowerCase();
    const filtered = {} as Record<string, (Comorbidity | CustomComorbidity)[]>;

    Object.entries(groupedComorbidities).forEach(([category, items]) => {
      const matchingItems = items.filter((item) =>
        item.label.toLowerCase().includes(searchLower)
      );
      if (matchingItems.length > 0) {
        filtered[category] = matchingItems;
      }
    });

    return filtered;
  }, [groupedComorbidities, search]);

  const handleSelect = (selectedId: string) => {
    const newValue = value.includes(selectedId)
      ? value.filter((id) => id !== selectedId)
      : [...value, selectedId];

    onChange(newValue);

    // Collect required tests from selected comorbidities
    if (onTestsRequired) {
      const requiredTests = new Set<string>();
      newValue.forEach((id) => {
        const comorbidity = COMORBIDITIES.find((c) => c.id === id);
        if (comorbidity?.requiredTests) {
          comorbidity.requiredTests.forEach((test) => requiredTests.add(test));
        }
      });
      onTestsRequired(Array.from(requiredTests));
    }
  };

  const handleAddCustom = () => {
    if (!customComorbidity.label.trim()) return;

    const customId = `custom_${customComorbidity.label
      .toLowerCase()
      .replace(/\s+/g, "_")}`;
    if (!value.includes(customId)) {
      onChange([...value, customId]);
    }

    setCustomComorbidity({ label: "", category: "OTHER" });
    setCustomDialogOpen(false);
  };

  const removeItem = (itemId: string) => {
    onChange(value.filter((id) => id !== itemId));
  };

  const selectedItems = value
    .map((id) => allComorbidities.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between"
            >
              Komorbidite seç
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput
                placeholder="Komorbidite ara..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <ScrollArea className="h-[300px]">
                  {Object.entries(filteredGroups).map(([category, items]) =>
                    items.length > 0 ? (
                      <div key={category}>
                        <CommandGroup
                          heading={
                            COMORBIDITY_CATEGORIES[
                              category as keyof typeof COMORBIDITY_CATEGORIES
                            ]
                          }
                        >
                          {items.map((item) => (
                            <CommandItem
                              key={item.id}
                              onSelect={() => handleSelect(item.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  value.includes(item.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {item.label}
                              {"icd10" in item && item.icd10 && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({item.icd10})
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandSeparator />
                      </div>
                    ) : null
                  )}
                </ScrollArea>
                {search && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setCustomComorbidity((prev) => ({
                            ...prev,
                            label: search,
                          }));
                          setCustomDialogOpen(true);
                          setSearch("");
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni ekle: "{search}"
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Komorbidite Ekle</DialogTitle>
              <DialogDescription>
                Listede bulunmayan bir komorbidite ekleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Komorbidite Adı</Label>
                <Input
                  id="name"
                  value={customComorbidity.label}
                  onChange={(e) =>
                    setCustomComorbidity((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={customComorbidity.category}
                  onChange={(e) =>
                    setCustomComorbidity((prev) => ({
                      ...prev,
                      category: e.target
                        .value as keyof typeof COMORBIDITY_CATEGORIES,
                    }))
                  }
                >
                  {Object.entries(COMORBIDITY_CATEGORIES).map(
                    ([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCustomDialogOpen(false)}
              >
                İptal
              </Button>
              <Button onClick={handleAddCustom}>Ekle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map(
            (item) =>
              item && (
                <Badge
                  key={item.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {item.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
          )}
        </div>
      )}
    </div>
  );
}
