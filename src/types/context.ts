import { Context } from 'telegraf';
import { UserRecord } from './index';

/**
 * Extended context that middlewares attach the DB user record to,
 * so handlers downstream don't need to re-query the database.
 */
export interface BotContext extends Context {
  dbUser?: UserRecord;
}
