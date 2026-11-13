import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

const JWT_PATTERN =
  /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i;
const MAX_AUTHORIZATION_LENGTH = 8_192;

type RawHeaderRequest = Pick<Request, 'rawHeaders'>;

export function extractBearerToken(request: RawHeaderRequest): string {
  if (collectRawHeaders(request, 'x-jwt').length > 0) {
    throw new UnauthorizedException('Unsupported authentication header.');
  }

  const authorizationValues = collectRawHeaders(request, 'authorization');
  if (authorizationValues.length !== 1) {
    throw new UnauthorizedException(
      'A single Authorization header is required.',
    );
  }

  return parseAuthorizationValue(authorizationValues[0]);
}

export function extractBearerTokenFromConnectionParams(
  connectionParams: unknown,
): string {
  if (!isRecord(connectionParams)) {
    throw new UnauthorizedException(
      'A single Authorization connection parameter is required.',
    );
  }

  const entries = Object.entries(connectionParams);
  if (entries.some(([key]) => key.toLowerCase() === 'x-jwt')) {
    throw new UnauthorizedException(
      'Unsupported authentication connection parameter.',
    );
  }

  const authorizationEntries = entries.filter(
    ([key]) => key.toLowerCase() === 'authorization',
  );
  if (
    authorizationEntries.length !== 1 ||
    authorizationEntries[0][0] !== 'Authorization'
  ) {
    throw new UnauthorizedException(
      'A single Authorization connection parameter is required.',
    );
  }

  return parseAuthorizationValue(authorizationEntries[0][1]);
}

function parseAuthorizationValue(value: unknown): string {
  if (typeof value !== 'string' || value.length > MAX_AUTHORIZATION_LENGTH) {
    throw new UnauthorizedException('Invalid Authorization value.');
  }

  const match = JWT_PATTERN.exec(value);
  if (!match) {
    throw new UnauthorizedException('Expected Authorization: Bearer <JWT>.');
  }

  return match[1];
}

function collectRawHeaders(
  request: RawHeaderRequest,
  headerName: string,
): string[] {
  const values: string[] = [];
  const target = headerName.toLowerCase();

  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    if (request.rawHeaders[index]?.toLowerCase() === target) {
      values.push(request.rawHeaders[index + 1] ?? '');
    }
  }

  return values;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
