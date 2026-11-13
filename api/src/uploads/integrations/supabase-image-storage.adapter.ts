import type { EnvironmentVariables } from '@/config/environment.variables';
import { PublicImageStorageUnavailableError } from '@/uploads/domain/upload-errors';
import type {
  PublicImageStoragePort,
  PutPublicImageCommand,
  StoredPublicImage,
} from '@/uploads/integrations/public-image-storage.port';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseImageStorageAdapter implements PublicImageStoragePort {
  private readonly logger = new Logger(SupabaseImageStorageAdapter.name);
  private readonly client: SupabaseClient;
  private readonly bucketName: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    const timeoutMs = config.get('SUPABASE_STORAGE_TIMEOUT_MS', {
      infer: true,
    });

    this.bucketName = config.get('SUPABASE_STORAGE_BUCKET', { infer: true });
    this.client = createClient(
      config.get('SUPABASE_STORAGE_URL', { infer: true }),
      config.get('SUPABASE_STORAGE_SECRET_KEY', { infer: true }),
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
        global: {
          fetch: createTimeoutFetch(timeoutMs),
        },
      },
    );
  }

  async put(command: PutPublicImageCommand): Promise<StoredPublicImage> {
    try {
      const { error } = await this.client.storage
        .from(this.bucketName)
        .upload(command.objectKey, command.bytes, {
          cacheControl: String(command.cacheControlSeconds),
          contentType: command.contentType,
          upsert: false,
        });

      if (error) {
        this.logger.error(
          `Supabase image upload failed (${error.name ?? 'StorageError'}).`,
        );
        throw new PublicImageStorageUnavailableError();
      }

      const { data } = this.client.storage
        .from(this.bucketName)
        .getPublicUrl(command.objectKey);
      const url = parsePublicHttpUrl(data.publicUrl);
      return { url };
    } catch (error: unknown) {
      if (error instanceof PublicImageStorageUnavailableError) {
        throw error;
      }

      this.logger.error(
        `Supabase image upload request failed (${errorName(error)}).`,
      );
      throw new PublicImageStorageUnavailableError();
    }
  }
}

function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const signals: AbortSignal[] = [AbortSignal.timeout(timeoutMs)];
    if (init?.signal) {
      signals.push(init.signal);
    }

    return fetch(input, {
      ...init,
      signal: AbortSignal.any(signals),
    });
  };
}

function parsePublicHttpUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new PublicImageStorageUnavailableError();
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new PublicImageStorageUnavailableError();
  }

  return url.toString();
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : 'UnknownError';
}
