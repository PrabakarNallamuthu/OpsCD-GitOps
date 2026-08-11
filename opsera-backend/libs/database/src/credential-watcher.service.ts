import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { watchFile, unwatchFile, readFileSync } from 'fs';
import { EventEmitter } from 'events';

export interface DatabaseCredentials {
  username: string;
  password: string;
}

const CREDENTIALS_PATH =
  process.env['DB_CREDENTIALS_PATH'] ?? '/vault/secrets/db-credentials';

@Injectable()
export class CredentialWatcherService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CredentialWatcherService.name);
  private currentCredentials: DatabaseCredentials | null = null;

  onModuleInit(): void {
    this.loadCredentials();
    this.startWatching();
  }

  onModuleDestroy(): void {
    unwatchFile(CREDENTIALS_PATH);
    this.logger.log('Credential watcher stopped');
  }

  getCredentials(): DatabaseCredentials | null {
    return this.currentCredentials;
  }

  private loadCredentials(): void {
    try {
      const raw = readFileSync(CREDENTIALS_PATH, 'utf-8');
      const creds = JSON.parse(raw) as DatabaseCredentials;
      const changed =
        this.currentCredentials?.username !== creds.username ||
        this.currentCredentials?.password !== creds.password;
      this.currentCredentials = creds;
      if (changed) {
        this.logger.log('Database credentials refreshed');
        this.emit('credentials-changed', creds);
      }
    } catch (err) {
      this.logger.warn(`Failed to read credentials from ${CREDENTIALS_PATH}: ${String(err)}`);
    }
  }

  private startWatching(): void {
    watchFile(CREDENTIALS_PATH, { interval: 30_000 }, () => {
      this.logger.debug('Credential file changed, reloading');
      this.loadCredentials();
    });
    this.logger.log(`Watching credentials at ${CREDENTIALS_PATH}`);
  }
}
