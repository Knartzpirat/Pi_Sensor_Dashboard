// lib/request-utils.ts
import { NextRequest } from 'next/server';

/**
 * Extract client information from a request
 */
export function getClientInfo(request: NextRequest): {
  ipAddress: string | undefined;
  userAgent: string | undefined;
} {
  // Get IP address (considering proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined;

  // Get User Agent
  const userAgent = request.headers.get('user-agent') || undefined;

  return {
    ipAddress,
    userAgent,
  };
}
