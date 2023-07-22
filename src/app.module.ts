import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/app.config.module';
import { GoogleApiModule } from './google-api/google-api.module';
import { SlackController } from './slack-bot/slack.controller';
import { SlackModule } from './slack-bot/slack.module';

@Module({
  imports: [AppConfigModule, GoogleApiModule, SlackModule],
  controllers: [SlackController],
})
export class AppModule {}
