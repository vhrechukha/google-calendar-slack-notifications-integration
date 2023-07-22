import { Injectable, Logger } from '@nestjs/common';
import { JWT } from 'google-auth-library/build/src/auth/jwtclient';
import { calendar_v3, google, sheets_v4 } from 'googleapis';
import Calendar = calendar_v3.Calendar;
import Schema$Event = calendar_v3.Schema$Event;
import Sheets = sheets_v4.Sheets;
import { ConfigService } from '@nestjs/config';

import {
  GoogleSheetColumnLetters,
  GoogleSheetColumns,
} from '../shared/constants';

@Injectable()
export class GoogleApiService {
  private readonly jwtClient: JWT;
  private readonly calendar: Calendar;
  private readonly sheets: Sheets;

  constructor(private readonly configService: ConfigService) {
    this.jwtClient = new google.auth.JWT(
      this.configService.get('google.client_email'),
      null,
      this.configService
        .get('google.private_key')
        .split(String.raw`\n`)
        .join('\n'),
      [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://spreadsheets.google.com/feeds',
        'https://www.googleapis.com/auth/drive',
      ],
    );

    this.calendar = google.calendar({
      version: 'v3',
      auth: this.jwtClient,
    });

    this.sheets = google.sheets({
      version: 'v4',
      auth: this.jwtClient,
    });
  }

  async getCalendarEvents(): Promise<Schema$Event[]> {
    try {
      const startOfWeek = new Date();

      const now = new Date();
      const currentYear = now.getFullYear();
      const month = now.getMonth();
      const date = now.getDate();
      const endOfWeek = new Date(
        currentYear,
        month,
        date +
          (Number(this.configService.get('application.count_of_days_check')) -
            now.getDay()),
      );

      const formattedStart = startOfWeek.toISOString();
      const formattedEnd = endOfWeek.toISOString();

      const {
        data: { items },
      } = await this.calendar.events.list({
        calendarId: this.configService.get('google.calendar_id'),
        timeMin: formattedStart,
        timeMax: formattedEnd,
        singleEvents: true,
        orderBy: 'startTime',
      });

      /**
       * Filter events to interact only with those that have type "outOfOffice"
       * There is no possibility to do it with "list" API now
       */
      return items.filter(({ summary }) => summary.includes('[out]'));
    } catch (e) {
      new Logger().error(this.getCalendarEvents.name, e);
    }
  }

  async writeSheetRows(
    events: {
      id: string;
      startAt: string;
      endAt: string;
      isDeclined: boolean;
    }[],
  ) {
    try {
      return await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.configService.get('google.sheet_id'),
        range: 'A:A',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          majorDimension: 'ROWS',
          values: events.map((event) => [
            event.id,
            event.startAt,
            event.endAt,
            event.isDeclined,
          ]),
        },
        // TODO: investigate why type is not correct, API is working
      } as any);
    } catch (e) {
      new Logger().error(this.writeSheetRows.name, e);
    }
  }

  async updateSheetRow(range: string, value: string) {
    const req = {
      spreadsheetId: this.configService.get('google.sheet_id'),
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        majorDimension: 'ROWS',
        values: [[value]],
      },
    };

    return await this.sheets.spreadsheets.values.update(req);
  }

  async getEventsFromSheet(): Promise<
    {
      id: string;
      startAt: string;
      endAt: string;
      isDeclined: boolean;
    }[]
  > {
    try {
      const req = {
        spreadsheetId: this.configService.get('google.sheet_id'),
        range: `${GoogleSheetColumnLetters[GoogleSheetColumns.id]}:${
          GoogleSheetColumnLetters[GoogleSheetColumns.isDeclined]
        }`,
      };

      const {
        data: { values },
      } = await this.sheets.spreadsheets.values.get(req);

      if (!values?.length) {
        return [];
      }

      return values.map(([id, startAt, endAt, isDeclined]) => ({
        id,
        startAt,
        endAt,
        isDeclined: Boolean(!!isDeclined),
      }));
    } catch (e) {
      new Logger().error(this.getEventsFromSheet.name, e);
    }
  }
}
