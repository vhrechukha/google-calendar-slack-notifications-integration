import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SlackService } from './slack.service';

@Controller()
export class SlackController {
  constructor(
    private readonly configService: ConfigService,
    private readonly slackService: SlackService,
  ) {}

  @Get('notify')
  async update() {
    await this.slackService.notifyEventsUpdates();
  }

  @Get('test')
  async sendMessage() {
    const ch = this.configService.get('slack.chat_id');
    const txt = 'Hello!';

    return await this.slackService.sendMessageInSlackChannel(ch, txt);
  }
}
