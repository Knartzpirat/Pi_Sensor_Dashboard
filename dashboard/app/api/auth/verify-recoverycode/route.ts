// In deiner Login-API

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function verifyRecoveryCode(
  prisma: PrismaClient,
  userId: string,
  inputCode: string
): Promise<boolean> {
  const codes = await prisma.recoveryCode.findMany({
    where: {
      userId,
      used: false, // Nur unbenutzte Codes
    },
  });

  for (const code of codes) {
    const isValid = await bcrypt.compare(inputCode, code.code);

    if (isValid) {
      // Markiere Code als verwendet
      await prisma.recoveryCode.update({
        where: { id: code.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });

      return true;
    }
  }

  return false;
}
