import { expect, test } from 'vitest';
import {
  Decoder,
  type CallerDetailRecord,
  type CdrRate,
  type ChargeDetail,
} from '../src/decoder.js';

test('decode', () => {
  // arrange
  const callDetailRecords: CallerDetailRecord[] = [
    {
      answerDateTime: new Date(2020, 0, 1, 6, 0, 0, 0),
      endDateTime: new Date(2020, 0, 1, 6, 1, 0, 0),
      calledNumber: 6738852329,
    },
  ];

  const cdrRates: CdrRate[] = [
    {
      countryCode: 673,
      standardRate: 0.5,
      reducedRate: 0.1,
    },
  ];

  const decoder = new Decoder();

  // act
  const charges: ChargeDetail[] = decoder.decode(callDetailRecords, cdrRates);

  // assert
  expect(charges).toHaveLength(1);
  expect(charges[0].chargeAmount).toBe(0.5);
});
