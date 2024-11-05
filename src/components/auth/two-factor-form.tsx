"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  token: z.string().length(6, "Kod 6 haneli olmalıdır"),
});

interface TwoFactorFormProps {
  onSuccess?: () => void;
  isSetup?: boolean;
}

export function TwoFactorForm({ onSuccess, isSetup }: TwoFactorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: "",
    },
  });

  const { mutate: verifyToken } = api.twoFactor.verifyToken.useMutation({
    onSuccess: (success) => {
      if (success) {
        onSuccess?.();
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Geçersiz kod. Lütfen tekrar deneyin.",
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const { mutate: verifyBackupCode } =
    api.twoFactor.verifyBackupCode.useMutation({
      onSuccess: (success) => {
        if (success) {
          onSuccess?.();
        } else {
          toast({
            variant: "destructive",
            title: "Hata",
            description: "Geçersiz yedek kod. Lütfen tekrar deneyin.",
          });
        }
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Hata",
          description: error.message,
        });
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    if (showBackupCode) {
      verifyBackupCode({ code: values.token });
    } else {
      verifyToken({ token: values.token, isSetup });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {showBackupCode ? "Yedek Kod" : "Doğrulama Kodu"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    showBackupCode ? "Yedek kodunuzu girin" : "6 haneli kod"
                  }
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Doğrula
        </Button>

        {!isSetup && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setShowBackupCode(!showBackupCode)}
            disabled={isSubmitting}
          >
            {showBackupCode ? "Doğrulama kodunu kullan" : "Yedek kodu kullan"}
          </Button>
        )}
      </form>
    </Form>
  );
}
