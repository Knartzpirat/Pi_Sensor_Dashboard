import { NextRequest } from 'next/server';
import { runSetup, SetupProgress } from '@/lib/setup-helper';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { user_data, db_config } = body;

        // Validierung
        if (!user_data?.username || !user_data?.password) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: 'Username and password are required',
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Database URL erstellen
        const databaseUrl = `postgresql://${db_config.username}:${db_config.password}@${db_config.host}:${db_config.port}/${db_config.database}`;

        // Setup ausführen mit Progress Updates
        const result = await runSetup(
          databaseUrl,
          user_data.username,
          user_data.password,
          (progress: SetupProgress) => {
            // Sende Progress Update
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(progress)}\n\n`)
            );
          }
        );

        if (!result.success) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: result.error })}\n\n`
            )
          );
        }

        controller.close();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
