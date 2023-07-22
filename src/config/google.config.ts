import { registerAs } from '@nestjs/config';
import * as process from 'process';

export default registerAs('google', () => ({
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  sheet_id: process.env.GOOGLE_SHEET_ID,
  calendar_id: process.env.GOOGLE_CALENDAR_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY,
}));
