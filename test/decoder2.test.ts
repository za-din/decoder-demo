import { expect, test, vi ,beforeEach, afterEach} from 'vitest';
import { Decoder } from '../src/decoder2';
import fs from 'fs/promises';
import path from 'path';





test('loadCdrRates loads actual CDR rates from file', async () => {
  const cdrRatesPath = path.resolve(__dirname, '../cdr.json');
  const decoder = new Decoder(cdrRatesPath);

  await decoder['loadCdrRates'](cdrRatesPath);

  expect(decoder['cdrRates']).toBeDefined();
  expect(Array.isArray(decoder['cdrRates'])).toBe(true);
  //console.log(decoder)
  expect(decoder['cdrRates'].length).toBeGreaterThan(0);

  const firstRate = decoder['cdrRates'][0];
  expect(firstRate).toHaveProperty('rateId');
  expect(firstRate).toHaveProperty('countryCode');
  expect(firstRate).toHaveProperty('standardRate');
  expect(firstRate).toHaveProperty('reducedRate');
  expect(firstRate).toHaveProperty('description');
  expect(firstRate).toHaveProperty('dialPlan');
  expect(firstRate).toHaveProperty('chargingBlockId');
  expect(firstRate).toHaveProperty('accessCode');
});