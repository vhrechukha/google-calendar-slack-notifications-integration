import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { utcToZonedTime } from 'date-fns-tz';

import { FinalMessageItem } from './interfaces';

const defaultEventTitle = 'AFK';

export const generateFinalMessage = (array: FinalMessageItem[]) => {
  if (array.length === 0) {
    return '';
  }

  return array.reduce(
    (
      accumulator,
      { dateIdentifier, startAt, endAt, isDeclined = false },
      i,
      arr,
    ) => {
      const previousDate = arr[i - 1]?.dateIdentifier;
      const nextDate = arr[i + 1]?.dateIdentifier;

      const timeRangeString = `${startAt}-${endAt}`;
      const timeRangeWithTitleString = isDeclined
        ? `~${timeRangeString}: ${defaultEventTitle}~`
        : `${timeRangeString}: ${defaultEventTitle}`;

      if (nextDate !== dateIdentifier && previousDate !== dateIdentifier) {
        accumulator += `• *${dateIdentifier}* - ${timeRangeWithTitleString}\n`;
      } else if (i === 0 || previousDate !== dateIdentifier) {
        accumulator += `• *${dateIdentifier}*\n\t○ ${timeRangeWithTitleString}\n`;
      } else {
        accumulator += `\t○ ${timeRangeWithTitleString}\n`;
      }

      return accumulator;
    },
    '',
  );
};

export const getDateAndTime = (
  date: string,
): {
  dateIdentifier: string;
  time: string;
} => {
  const timezone = 'Europe/Kiev'; // Replace with your desired time zone
  const datetime = utcToZonedTime(date, timezone);
  const dayOfWeek = format(datetime, 'E', { locale: uk }).toUpperCase();
  const dayOfMonth = format(datetime, 'd', { locale: uk });
  const month = format(datetime, 'MMMM', { locale: uk });
  const time = format(datetime, 'HH:mm');

  return {
    dateIdentifier: `${dayOfWeek} ${dayOfMonth} ${month}`,
    time,
  };
};

export const isNotPastEvent = (timezone, date): boolean => {
  const startAtDate = utcToZonedTime(date, timezone);
  const currentDate = utcToZonedTime(new Date(), timezone);

  return !(currentDate > startAtDate);
};
