import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { generateRefreshToken } from '@/lib/token-helper';
import { getClientInfo } from '@/lib/request-utils';

export interface SetupProgress {
  step: string;
  progress: number;
  message: string;
}

export interface SetupResult {
  success: boolean;
  error?: string;
  refreshToken?: string;
  userId?: string;
  recoveryCodes?: string[];
  refreshTokenExpiresAt?: Date;
}

const CURRENT_SCHEMA_VERSION = '1.0.1';

function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // Alphanumerisch

  for (let i = 0; i < count; i++) {
    let code = '';

    // Generiere 3 Blöcke à 3 Zeichen
    for (let block = 0; block < 3; block++) {
      for (let char = 0; char < 3; char++) {
        const randomIndex = crypto.randomInt(0, chars.length);
        code += chars[randomIndex];
      }

      // Füge Bindestrich hinzu (außer nach dem letzten Block)
      if (block < 2) {
        code += '-';
      }
    }

    codes.push(code);
  }

  return codes;
}

async function checkSchemaStatus(client: PrismaClient): Promise<{
  tablesExist: boolean;
  schemaUpToDate: boolean;
  currentVersion: string | null;
}> {
  try {
    // Prüfe ob Tabellen existieren
    await client.user.findFirst();
    const setupStatus = await client.setupStatus.findFirst();

    if (!setupStatus) {
      return {
        tablesExist: true,
        schemaUpToDate: false,
        currentVersion: null,
      };
    }

    // Vergleiche Schema-Versionen
    const schemaUpToDate = setupStatus.version === CURRENT_SCHEMA_VERSION;

    return {
      tablesExist: true,
      schemaUpToDate,
      currentVersion: setupStatus.version,
    };
  } catch {
    return {
      tablesExist: false,
      schemaUpToDate: false,
      currentVersion: null,
    };
  }
}

export async function testDatabaseConnection(
  databaseUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });

    await client.$connect();
    await client.$queryRaw`SELECT 1`;
    await client.$disconnect();

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

export async function runSetup(
  request: NextRequest,
  databaseUrl: string,
  username: string,
  password: string,
  onProgress: (progress: SetupProgress) => void
): Promise<SetupResult> {
  let client: PrismaClient | null = null;

  try {
    // Schritt 1: Verbindung testen
    onProgress({
      step: 'connection',
      progress: 10,
      message: 'Testing database connection...',
    });

    const connectionTest = await testDatabaseConnection(databaseUrl);
    if (!connectionTest.success) {
      return { success: false, error: connectionTest.error };
    }

    // Schritt 2: Client erstellen
    onProgress({
      step: 'client',
      progress: 20,
      message: 'Initializing database client...',
    });

    client = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });

    await client.$connect();

    // Schritt 3: Tabellen prüfen/erstellen
    onProgress({
      step: 'tables',
      progress: 30,
      message: 'Checking database tables...',
    });

    const schemaStatus = await checkSchemaStatus(client);

    if (!schemaStatus.tablesExist) {
      onProgress({
        step: 'migration',
        progress: 40,
        message: 'Creating database tables...',
      });
      await runMigration(databaseUrl);
    } else if (!schemaStatus.schemaUpToDate) {
      onProgress({
        step: 'migration',
        progress: 40,
        message: `Updating schema from ${schemaStatus.currentVersion} to ${CURRENT_SCHEMA_VERSION}...`,
      });
      await runMigration(databaseUrl);
    } else {
      onProgress({
        step: 'migration',
        progress: 40,
        message: `Schema up-to-date (v${CURRENT_SCHEMA_VERSION})`,
      });
    }

    // Schritt 4: Admin-User erstellen
    onProgress({
      step: 'user',
      progress: 50,
      message: 'Creating admin user...',
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    let userId: string;
    // Prüfe ob User bereits existiert
    const existingUser = await client.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      // Update existierenden User
      await client.user.update({
        where: { username },
        data: { password: hashedPassword },
      });
      userId = existingUser.id;
    } else {
      // Erstelle neuen User
      const newUser = await client.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'admin',
        },
      });
      userId = newUser.id;
    }

    // Schritt 5: Recovery Codes generieren
    onProgress({
      step: 'recovery',
      progress: 60,
      message: 'Generating recovery codes...',
    });

    const recoveryCodes = generateRecoveryCodes(8);

    // Lösche alte Recovery Codes
    await client.recoveryCode.deleteMany({
      where: { userId },
    });

    // Speichere neue Recovery Codes (gehasht in DB)
    for (const code of recoveryCodes) {
      const hashedCode = await bcrypt.hash(code, 10);
      await client.recoveryCode.create({
        data: {
          userId,
          code: hashedCode,
          used: false,
        },
      });
    }

    // Schritt 6: Refresh Token generieren (mit deinem token-helper)
    onProgress({
      step: 'token',
      progress: 70,
      message: 'Creating session...',
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    // Verwende deinen bestehenden token-helper
    const { token: refreshToken, expiresAt: refreshTokenExpiresAt } =
      await generateRefreshToken(
        client,
        userId,
        false, // stayLoggedIn = false für Setup-Session
        ipAddress,
        userAgent
      );

    // Schritt 7: Setup-Status speichern
    onProgress({
      step: 'status',
      progress: 80,
      message: 'Saving setup status...',
    });

    await client.setupStatus.upsert({
      where: { id: 'setup' },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        version: CURRENT_SCHEMA_VERSION,
      },
      create: {
        id: 'setup',
        isCompleted: true,
        completedAt: new Date(),
        version: CURRENT_SCHEMA_VERSION,
      },
    });

    // Schritt 8: .env Datei aktualisieren
    onProgress({
      step: 'env',
      progress: 90,
      message: 'Updating configuration...',
    });

    await updateEnvFile(databaseUrl);

    // Schritt 9: Fertig
    onProgress({
      step: 'complete',
      progress: 100,
      message: 'Setup completed successfully!',
    });

    return {
      success: true,
      refreshToken,
      userId,
      recoveryCodes,
      refreshTokenExpiresAt,
    };
  } catch (error: unknown) {
    console.error('Setup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Setup failed',
    };
  } finally {
    if (client) {
      await client.$disconnect();
    }
  }
}

async function runMigration(databaseUrl: string): Promise<void> {
  const originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = databaseUrl;

  try {
    execSync('pnpm prisma db push --skip-generate', {
      stdio: 'inherit',
      env: process.env,
    });
  } finally {
    if (originalUrl) {
      process.env.DATABASE_URL = originalUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  }
}

async function updateEnvFile(databaseUrl: string): Promise<void> {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Update oder füge DATABASE_URL hinzu
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(
      /DATABASE_URL=.*/g,
      `DATABASE_URL="${databaseUrl}"`
    );
  } else {
    envContent += `\nDATABASE_URL="${databaseUrl}"\n`;
  }

  fs.writeFileSync(envPath, envContent);
}

export async function isSetupAllowed(): Promise<boolean> {
  // Umgebungsvariable checken
  if (process.env.ALLOW_SETUP_AGAIN === 'true') {
    return true;
  }

  // Datenbank checken
  try {
    const client = new PrismaClient();
    await client.$connect();

    const setupStatus = await client.setupStatus.findFirst();
    await client.$disconnect();

    // Setup erlaubt wenn noch nicht abgeschlossen
    return !setupStatus?.isCompleted;
  } catch {
    // Bei Fehler Setup erlauben (erste Installation)
    return true;
  }
}