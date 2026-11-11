import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  public db!: PostgresJsDatabase<typeof schema>;
  private client!: postgres.Sql;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const connectionString =
      this.configService.get<string>('DATABASE_URL') ||
      'postgresql://postgres:postgres@localhost:5432/chess_db';

    const isSsl =
      connectionString.includes('sslmode=require') ||
      connectionString.includes('neon.tech');

    this.client = postgres(connectionString, {
      ssl: isSsl ? 'require' : false,
      max: 10,
    });

    this.db = drizzle(this.client, { schema });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.end();
    }
  }
}

