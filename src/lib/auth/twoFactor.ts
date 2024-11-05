import { authenticator } from "otplib";
import QRCode from "qrcode";
import { encrypt, decrypt } from "@/lib/security/encryption";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";

// Configure TOTP settings
authenticator.options = {
  window: 1, // Allow 30 seconds before/after for time drift
  step: 30, // 30-second time step
};

export async function generateTwoFactorSecret(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Kullanıcı bulunamadı",
    });
  }

  // Generate new secret
  const secret = authenticator.generateSecret();
  const tempSecret = await encrypt(secret);

  // Save temporary secret
  await db.user.update({
    where: { id: userId },
    data: {
      tempSecretKey: tempSecret,
      tempSecretExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
    },
  });

  // Generate QR code
  const otpauth = authenticator.keyuri(user.email, "Anestezi Kliniği", secret);

  const qrCode = await QRCode.toDataURL(otpauth);

  return {
    secret,
    qrCode,
  };
}

export async function verifyTwoFactorToken(
  userId: string,
  token: string,
  isSetup = false,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Kullanıcı bulunamadı",
    });
  }

  try {
    let secret;
    if (isSetup) {
      if (!user.tempSecretKey || !user.tempSecretExpires) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA kurulum süresi dolmuş",
        });
      }

      if (user.tempSecretExpires < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA kurulum süresi dolmuş",
        });
      }

      secret = await decrypt(user.tempSecretKey);
    } else {
      if (!user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA etkin değil",
        });
      }

      secret = await decrypt(user.twoFactorSecret);
    }

    return authenticator.verify({
      token,
      secret,
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return false;
  }
}

export async function enableTwoFactor(userId: string, token: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user?.tempSecretKey) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "2FA kurulum başlatılmamış",
    });
  }

  const isValid = await verifyTwoFactorToken(userId, token, true);
  if (!isValid) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Geçersiz kod",
    });
  }

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    authenticator.generateSecret(10),
  );

  // Encrypt backup codes
  const encryptedBackupCodes = await Promise.all(
    backupCodes.map((code) => encrypt(code)),
  );

  // Enable 2FA
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: user.tempSecretKey,
      backupCodes: encryptedBackupCodes,
      tempSecretKey: null,
      tempSecretExpires: null,
    },
  });

  return backupCodes;
}

export async function disableTwoFactor(userId: string, token: string) {
  const isValid = await verifyTwoFactorToken(userId, token);
  if (!isValid) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Geçersiz kod",
    });
  }

  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
    },
  });

  return true;
}

export async function verifyBackupCode(userId: string, code: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user?.backupCodes.length) {
    return false;
  }

  // Check each backup code
  for (let i = 0; i < user.backupCodes.length; i++) {
    const decryptedCode = await decrypt(user.backupCodes[i]!);
    if (code === decryptedCode) {
      // Remove used backup code
      const updatedBackupCodes = [...user.backupCodes];
      updatedBackupCodes.splice(i, 1);

      await db.user.update({
        where: { id: userId },
        data: {
          backupCodes: updatedBackupCodes,
        },
      });

      return true;
    }
  }

  return false;
}
