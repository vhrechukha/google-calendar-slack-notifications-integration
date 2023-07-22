import { registerAs } from '@nestjs/config';
import * as process from 'process';

export default registerAs('application', () => ({
  message_heading: process.env.MESSAGE_HEADING,
  count_of_days_check: process.env.COUNT_OF_DAYS_CHECK,
}));
