import { registerAs } from '@nestjs/config';
import * as process from 'process';

export default registerAs('slack', () => ({
  chat_id: process.env.SLACK_CHAT_ID,
  bot_token: process.env.SLACK_BOT_TOKEN,
  token: process.env.SLACK_TOKEN,
}));
