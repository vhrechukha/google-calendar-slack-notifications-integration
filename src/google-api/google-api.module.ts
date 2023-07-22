import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { SlackService } from '../slack-bot/slack.service';
import { GoogleApiService } from './google-api.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [GoogleApiService, SlackService],
  exports: [GoogleApiService, SlackService],
})
export class GoogleApiModule {}
