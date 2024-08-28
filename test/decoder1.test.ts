import { expect, test, vi } from 'vitest';
import {
  Decoder,
  type CallerDetailRecord,
  type CdrRate,
  type ChargeDetail,
  type CdrRateJson
} from '../src/decoder1.js';

test('decode with reduced rate within one day', async () => {

  const consoleSpy = vi.spyOn(console, 'log');
  // Arrange
  const callDetailRecords: CallerDetailRecord[] = [
    {
      answerDateTime: new Date(2020, 0, 1, 7, 0, 0, 0), // 7:00 AM
      endDateTime: new Date(2020, 0, 1, 7, 5, 0, 0), // 7:05 AM
      calledNumber: 6738852329,
    },
  ];

  const cdrRates: CdrRateJson[] = [
    {
      rateId: "1000",
      countryCode: 673,
      standardRate: 0.5,
      reducedRate: 0.1,
      description: "Test Country",
      dialPlan: "673",
      chargingBlockId: "2",
      accessCode: "0"
    },
  ];

  const decoder = new Decoder();

  // Act
  const charges: ChargeDetail[] = await decoder.decode(callDetailRecords, cdrRates);


  // Assert
  console.log(charges)
  expect(charges).toHaveLength(1);
  expect(charges[0].chargeAmount).toBe(300 * 0.1); // 300 seconds * 0.1 rate = 30
  //expect(consoleSpy).toHaveBeenCalledWith("RATE ==>", expect.any(Number));
  // If you want to see all console.log calls
  console.log(consoleSpy.mock.calls);

  // Don't forget to restore the spy
  consoleSpy.mockRestore();

});

test('decode with standard rate within one day', async () => {
  // Arrange
  const callDetailRecords: CallerDetailRecord[] = [
    {
      answerDateTime: new Date(2020, 0, 1, 10, 0, 0, 0), // 10:00 AM
      endDateTime: new Date(2020, 0, 1, 10, 5, 0, 0), // 10:05 AM
      calledNumber: 6738852329,
    },
  ];

  const cdrRates: CdrRateJson[] = [
    {
      rateId: "1000",
      countryCode: 673,
      standardRate: 0.5,
      reducedRate: 0.1,
      description: "Test Country",
      dialPlan: "673",
      chargingBlockId: "2",
      accessCode: "0"
    },
  ];

  const decoder = new Decoder();

  // Act
  const charges: ChargeDetail[] = await decoder.decode(callDetailRecords, cdrRates);

  // Assert
  expect(charges).toHaveLength(1);
  expect(charges[0].chargeAmount).toBe(5 * 60 * 0.5); // 5 minutes * 60 seconds * 0.5 rate = 150
});

test('decode with call spanning multiple days', () => {
  // arrange
  const callDetailRecords: CallerDetailRecord[] = [
    {
      answerDateTime: new Date(2020, 0, 1, 23, 58, 0, 0), // 11:58 PM Jan 1
      endDateTime: new Date(2020, 0, 2, 0, 2, 0, 0), // 12:02 AM Jan 2
      calledNumber: 6738852329,
    },
  ];

  const cdrRates: CdrRate[] = [
    {
      countryCode: 673,
      standardRate: 0.5,
      reducedRate: 0.1,
      economic: true,
    },
  ];

  const decoder = new Decoder();

  // act
  const charges: ChargeDetail[] = decoder.decode(callDetailRecords, cdrRates);

  // assert
  expect(charges).toHaveLength(1);
  // Calculate charge: 2 minutes in standard rate (23:58 - 00:00) and 2 minutes in reduced rate (00:00 - 00:02)
  const expectedCharge = 2 * 60 * 0.5 + 2 * 60 * 0.1;
  expect(charges[0].chargeAmount).toBe(expectedCharge);
});

test('decode with call spanning both standard and reduced rate periods', () => {
  // arrange
  const callDetailRecords: CallerDetailRecord[] = [
    {
      answerDateTime: new Date(2020, 0, 1, 7, 58, 0, 0), // 7:58 AM
      endDateTime: new Date(2020, 0, 1, 8, 2, 0, 0), // 8:02 AM
      calledNumber: 6738852329,
    },
  ];

  const cdrRates: CdrRate[] = [
    {
      countryCode: 673,
      standardRate: 0.5,
      reducedRate: 0.1,
      economic: true,
    },
  ];

  const decoder = new Decoder();

  // act
  const charges: ChargeDetail[] = decoder.decode(callDetailRecords, cdrRates);

  // assert
  expect(charges).toHaveLength(1);
  // Calculate charge: 2 minutes in reduced rate (07:58 - 08:00) and 2 minutes in standard rate (08:00 - 08:02)
  const expectedCharge = 2 * 60 * 0.1 + 2 * 60 * 0.5;
  expect(charges[0].chargeAmount).toBe(expectedCharge);
});

test('decode with no matching rate, should apply default rate', () => {
  // arrange
  const callDetailRecords: CallerDetailRecord[] = [
    {
      answerDateTime: new Date(2020, 0, 1, 10, 0, 0, 0), // 10:00 AM
      endDateTime: new Date(2020, 0, 1, 10, 5, 0, 0), // 10:05 AM
      calledNumber: 1234567890, // Unmatched country code
    },
  ];

  const cdrRates: CdrRate[] = [
    {
      countryCode: 673,
      standardRate: 0.5,
      reducedRate: 0.1,
      economic: false,
    },
  ];

  const decoder = new Decoder();

  // act
  const charges: ChargeDetail[] = decoder.decode(callDetailRecords, cdrRates);

  // assert
  expect(charges).toHaveLength(1);
  expect(charges[0].chargeAmount).toBe(5 * 60 * 1); // 5 minutes * 60 seconds * default rate (1)
});
