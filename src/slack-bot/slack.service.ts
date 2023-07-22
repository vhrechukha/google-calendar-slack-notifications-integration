import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocketModeClient } from '@slack/socket-mode';
import { WebClient } from '@slack/web-api';
import { GoogleApiService } from 'src/google-api/google-api.service';

import {
  GoogleSheetColumnLetters,
  GoogleSheetColumns,
} from '../shared/constants';
import { FinalMessageItem } from '../shared/interfaces';
import {
  generateFinalMessage,
  getDateAndTime,
  isNotPastEvent,
} from '../shared/utils';

@Injectable()
export class SlackService {
  messageHeading: string;
  private readonly slackClient: SocketModeClient;
  private readonly slackApi: WebClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly googleApiService: GoogleApiService,
  ) {
    this.messageHeading = this.configService.get('application.message_heading');
    this.slackClient = new SocketModeClient({
      appToken: this.configService.get('slack.token'),
    });
    this.slackApi = new WebClient(this.configService.get('slack.bot_token'));
  }

  async notifyEventsUpdates() {
    try {
      const events = await this.googleApiService.getCalendarEvents();
      const sheetEvents = await this.googleApiService.getEventsFromSheet();
      const eventsMessageData: FinalMessageItem[] = [];

      /**
       * Nothing to process.
       */
      if (!events?.length && !sheetEvents?.length) {
        return;
      }

      /**
       * Filter events which can be still declined and check them for new changes
       */
      let eventsToAdd = events;
      if (sheetEvents?.length) {
        const activeSheetEvents = sheetEvents.filter((se) => !se.isDeclined);
        for (const sheetEvent of activeSheetEvents) {
          const sheetEventIndex = sheetEvents.findIndex(
            (se) => sheetEvent.id === se.id && !se.isDeclined,
          );
          const range =
            GoogleSheetColumnLetters[GoogleSheetColumns.isDeclined] +
            (sheetEventIndex + 1).toString();

          /**
           * If event from sheet storage not found in event list - send a message of it's "decline" status
           */
          const receivedEventIndex = events.findIndex(
            (event) => sheetEvent.id === event.id,
          );

          const receivedEvent = events?.[receivedEventIndex];
          const isDateRangeChanged =
            receivedEvent &&
            (receivedEvent?.start?.dateTime !== sheetEvent.startAt ||
              receivedEvent?.end?.dateTime !== sheetEvent.endAt);

          if (
            (receivedEventIndex === -1 || isDateRangeChanged) &&
            isNotPastEvent('Europe/Kiev', sheetEvent.startAt)
          ) {
            await this.googleApiService.updateSheetRow(range, 'true');

            const { dateIdentifier, time } = getDateAndTime(sheetEvent.startAt);
            eventsMessageData.push({
              dateIdentifier,
              startAt: time,
              endAt: `${getDateAndTime(sheetEvent.endAt).time}`,
              isDeclined: true,
            });
          }

          /**
           * When we already have such event in sheets but some of the
           * date range was changed  - send a message with a new date range status
           */
          if (isDateRangeChanged) {
            const { dateIdentifier, time } = getDateAndTime(
              receivedEvent.start.dateTime,
            );
            eventsMessageData.push({
              dateIdentifier,
              startAt: time,
              endAt: `${getDateAndTime(receivedEvent.end.dateTime).time}`,
            });

            await this.googleApiService.writeSheetRows([
              {
                id: receivedEvent.id,
                startAt: receivedEvent.start.dateTime,
                endAt: receivedEvent.end.dateTime,
                isDeclined: undefined,
              },
            ]);
          }
        }

        eventsToAdd = events.filter(
          (e) => !sheetEvents.find((se) => se.id === e.id),
        );
      }

      if (eventsToAdd.length) {
        const newEvents = eventsToAdd.map((event) => ({
          id: event.id,
          startAt: event.start.dateTime,
          endAt: event.end.dateTime,
          isDeclined: undefined,
        }));

        newEvents.forEach((event) => {
          const { dateIdentifier, time } = getDateAndTime(event.startAt);
          eventsMessageData.push({
            dateIdentifier,
            startAt: time,
            endAt: `${getDateAndTime(event.endAt).time}`,
          });
        });

        await this.googleApiService.writeSheetRows(newEvents);
      }

      if (eventsMessageData.length) {
        const finalMessage = generateFinalMessage(eventsMessageData);

        const message = this.messageHeading
          ? `${this.messageHeading}:\n ${finalMessage}`
          : finalMessage;

        await this.sendMessageInSlackChannel(
          this.configService.get('slack.chat_id'),
          message,
        );
      }
    } catch (e) {
      new Logger().error(this.notifyEventsUpdates.name, e);
    }
  }

  async sendMessageInSlackChannel(
    channel: string,
    text: string,
  ): Promise<void> {
    try {
      await this.slackApi.chat.postMessage({
        channel,
        text,
        parse: 'full',
      });
    } catch (e) {
      new Logger().error(this.sendMessageInSlackChannel.name, e);
    }
  }
}
