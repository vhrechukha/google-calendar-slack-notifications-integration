import { generateFinalMessage, getDateAndTime, isNotPastEvent } from '../utils';

describe('Utils', () => {
  describe('generateFinalMessage', () => {
    it('One Date', () => {
      const data = [
        { dateIdentifier: 'ЧТВ 20 липня', startAt: '~16:15', endAt: '17:15~' },
        { dateIdentifier: 'ЧТВ 20 липня', startAt: '17:30', endAt: '18:30' },
        { dateIdentifier: 'ЧТВ 20 липня', startAt: '20:00', endAt: '21:00' },
      ];

      expect(generateFinalMessage(data)).toStrictEqual(`• *ЧТВ 20 липня*
\t○ ~16:15-17:15~: AFK
\t○ 17:30-18:30: AFK
\t○ 20:00-21:00: AFK
`);
    });
    it('Two Dates', () => {
      const data = [
        { dateIdentifier: 'ЧТВ 20 липня', startAt: '~16:15', endAt: '17:15~' },
        { dateIdentifier: 'ЧТВ 20 липня', startAt: '17:30', endAt: '18:30' },
        { dateIdentifier: 'ЧТВ 30 липня', startAt: '20:00', endAt: '21:00' },
      ];

      expect(generateFinalMessage(data)).toStrictEqual(
        `• *ЧТВ 20 липня*
\t○ ~16:15-17:15~: AFK
\t○ 17:30-18:30: AFK
• *ЧТВ 30 липня* - 20:00-21:00: AFK
`,
      );
    });
  });
  describe('getDateAndTime', () => {
    it('test date string converted from +2 to +3 timezone', () => {
      const data = '2023-07-20T16:00:00+02:00';

      expect(getDateAndTime(data)).toStrictEqual({
        date: 'ЧТВ 20 липня',
        time: '17:00',
      });
    });
  });
  describe('isNotPastEvent', () => {
    it('needs to be true', () => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
      expect(
        isNotPastEvent('Europe/Kiev', '2023-07-20T23:34:00+02:00'),
      ).toEqual(true);
    });
    it('needs to be false', () => {
      jest.useFakeTimers().setSystemTime(new Date('2023-07-25'));
      expect(
        isNotPastEvent('Europe/Kiev', '2023-07-20T23:34:00+02:00'),
      ).toEqual(false);
    });
  });
});
