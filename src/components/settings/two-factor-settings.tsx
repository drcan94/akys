"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { api } from "@/trpc/react";
import { Loader2, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export function TwoFactorSettings() {
  const [isEnabling, setIsEnabling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const { toast } = useToast();
  const utils = api.useUtils();

  const { data: user, isLoading } = api.user.getSettings.useQuery();

  const { mutate: generateSecret } = api.twoFactor.generateSecret.useMutation({
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setIsEnabling(true);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  const { mutate: enable } = api.twoFactor.enable.useMutation({
    onSuccess: (codes) => {
      setBackupCodes(codes);
      utils.user.getSettings.invalidate();
      toast({
        title: "Başarılı",
        description: "İki faktörlü doğrulama etkinleştirildi.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  const { mutate: disable } = api.twoFactor.disable.useMutation({
    onSuccess: () => {
      utils.user.getSettings.invalidate();
      toast({
        title: "Başarılı",
        description: "İki faktörlü doğrulama devre dışı bırakıldı.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (backupCodes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yedek Kodlarınız</CardTitle>
          <CardDescription>
            Bu kodları güvenli bir yerde saklayın. Her kod yalnızca bir kez
            kullanılabilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {backupCodes.map((code) => (
              <code
                key={code}
                className="rounded bg-muted px-2 py-1 font-mono text-sm"
              >
                {code}
              </code>
            ))}
          </div>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              setBackupCodes(null);
              setIsEnabling(false);
              setQrCode(null);
            }}
          >
            Tamam
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEnabling && qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>İki Faktörlü Doğrulama Kurulumu</CardTitle>
          <CardDescription>
            Google Authenticator veya benzer bir uygulama ile QR kodunu tarayın
            ve oluşturulan kodu girin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Image
              src={qrCode}
              alt="QR Code"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>
          <TwoFactorForm isSetup onSuccess={(token) => enable({ token })} />
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setIsEnabling(false);
              setQrCode(null);
            }}
          >
            İptal
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>İki Faktörlü Doğrulama</CardTitle>
            <CardDescription>
              Hesabınızı daha güvenli hale getirmek için iki faktörlü
              doğrulamayı etkinleştirin.
            </CardDescription>
          </div>
          {user.twoFactorEnabled ? (
            <ShieldCheck className="h-8 w-8 text-green-500" />
          ) : (
            <ShieldAlert className="h-8 w-8 text-yellow-500" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {user.twoFactorEnabled ? (
          <>
            <Alert className="mb-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                İki faktörlü doğrulama etkin. Hesabınız daha güvenli.
              </AlertDescription>
            </Alert>
            <TwoFactorForm onSuccess={(token) => disable({ token })} />
          </>
        ) : (
          <Button className="w-full" onClick={() => generateSecret()}>
            Etkinleştir
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
