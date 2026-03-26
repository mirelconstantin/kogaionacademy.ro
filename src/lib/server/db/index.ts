import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const databaseUrl =
	env.DATABASE_URL && !env.DATABASE_URL.includes('host:port')
		? env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';
const client = postgres(databaseUrl);

export const db = drizzle(client, { schema });
