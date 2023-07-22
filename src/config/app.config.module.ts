import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import appConfig from './app.config';
import { AppConfigService } from './app.config.service';
import googleConfig from './google.config';
import slackConfig from './slack.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.production'],
      isGlobal: true,
      load: [appConfig, googleConfig, slackConfig],
    }),
  ],
  providers: [AppConfigService, ConfigService],
  exports: [AppConfigService, ConfigService],
})
export class AppConfigModule {}
