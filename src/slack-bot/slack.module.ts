import { Module } from '@nestjs/common';
import { GoogleApiService } from 'src/google-api/google-api.service';

import { SlackService } from './slack.service';

@Module({
  providers: [SlackService, GoogleApiService],
  exports: [SlackService, GoogleApiService],
})
export class SlackModule {}
