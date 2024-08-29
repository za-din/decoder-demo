import { expect, test, vi } from 'vitest';
import { Decoder } from '../src/decoder2';
import fs from 'fs/promises';

vi.mock('fs/promises');

test('loadCdrRates loads and parses CDR rates correctly', async () => {
  const mockCdrRates = [
    {
      rateId: '1',
      countryCode: 1,
      standardRate: 0.1,
      reducedRate: 0.05,
      description: 'Test Rate',
      dialPlan: '1',
      chargingBlockId: '1',
      accessCode: '0'
    }
  ];

  vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockCdrRates));

  const decoder = new Decoder();
  await decoder['loadCdrRates']();

  expect(decoder['cdrRates']).toEqual(mockCdrRates);
  expect(fs.readFile).toHaveBeenCalledWith('../cdr.json', 'utf-8');
});
