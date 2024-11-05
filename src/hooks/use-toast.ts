"use client";

import { useToast as useToastUI } from "@/components/ui/use-toast";

export function useToast() {
  const { toast } = useToastUI();

  return {
    toast: (props: {
      title?: string;
      description: string;
      variant?: "default" | "destructive";
    }) => {
      toast({
        ...props,
        duration: 3000,
      });
    },
  };
}
