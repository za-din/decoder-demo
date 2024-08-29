import { expect, test, vi, beforeEach } from 'vitest';
import { Decoder } from '../src/decoder1.js';
import fs from 'fs/promises';
import path from 'path';

const testDataDir = path.join(__dirname, 'testData');
const dlvFilePath = path.join(testDataDir, 'data.DLV');
const cdrRatesPath = path.join(testDataDir, 'cdr.json');
const outputJsonPath = path.join(testDataDir, 'output.json');
const parsedJsonPath = path.join(testDataDir, 'parsed_output.json');

beforeEach(() => {
  vi.resetAllMocks();
});
// Mock fs.promises
vi.mock('fs/promises');
const mockCdrRates = [
  {
  "rateId": "1148",
  "countryCode": 6085,
  "standardRate": 0.05,
  "reducedRate": 0.04,
  "description": "M’sia E-Batu Niah",
  "dialPlan": "6085",
  "chargingBlockId": "2",
  "accessCode": "0"
},
{
  "rateId": "1414",
  "countryCode": 6085,
  "standardRate": 0.02,
  "reducedRate": 0.02,
  "description": "M’sia E-Batu Niah Economic call",
  "dialPlan": "6085",
  "chargingBlockId": "2",
  "accessCode": "95"
},
{
  "rateId": "1149",
  "countryCode": 6086,
  "standardRate": 0.06,
  "reducedRate": 0.05,
  "description": "M’sia E-Bintulu",
  "dialPlan": "6086",
  "chargingBlockId": "2",
  "accessCode": "0"
},
{
  "rateId": "1415",
  "countryCode": 6086,
  "standardRate": 0.02,
  "reducedRate": 0.02,
  "description": "M’sia E-Bintulu Economic call",
  "dialPlan": "6086",
  "chargingBlockId": "2",
  "accessCode": "95"
},
{
  "rateId": "1150",
  "countryCode": 6084,
  "standardRate": 0.06,
  "reducedRate": 0.05,
  "description": "M’sia E-Kapit",
  "dialPlan": "6084",
  "chargingBlockId": "2",
  "accessCode": "0"
},
{
  "rateId": "1416",
  "countryCode": 6084,
  "standardRate": 0.02,
  "reducedRate": 0.02,
  "description": "M’sia E-Kapit Economic call",
  "dialPlan": "6084",
  "chargingBlockId": "2",
  "accessCode": "95"
},
{
  "rateId": "1151",
  "countryCode": 6088,
  "standardRate": 0.06,
  "reducedRate": 0.05,
  "description": "M’sia E-Kota Kinabalu",
  "dialPlan": "6088",
  "chargingBlockId": "2",
  "accessCode": "0"
},
{
  "rateId": "1417",
  "countryCode": 6088,
  "standardRate": 0.02,
  "reducedRate": 0.02,
  "description": "M’sia E-Kota Kinabalu Economic call",
  "dialPlan": "6088",
  "chargingBlockId": "2",
  "accessCode": "95"
},
];
let mockDlvContent = '';
test('Decoder.decode processes DLV file correctly', async () => {
  // Arrange
  mockDlvContent = '11| 01| 0| 9|01092017|230406|01092017|230607|     120|    0|  2|             2552500|    0|  3|     0060889825396945| 65535|      |      |   138|   971|  15| 118| 10| 4|0| 0|  4|144| 0|0|    0|  971|65535|   50|  3|     009779825396945|65535|   |                    |102|  2| 0|                 009779825396945|  1| 63|  3|    |15|15|                     |                     |          |          | 00000000000000000000000000000000| 00000000000000000000000000000000| 000000000000|   |   |   |65535|65535|65535|65535| 15|255|                     |';
 

  vi.mocked(fs.readFile).mockImplementation((path: string) => {
    if (path === dlvFilePath) {
      return Promise.resolve(mockDlvContent);
    } else if (path === cdrRatesPath) {
      return Promise.resolve(JSON.stringify(mockCdrRates));
    }
    return Promise.reject(new Error('File not found'));
  });
  vi.mocked(fs.writeFile).mockResolvedValue(undefined);

  const decoder = new Decoder(cdrRatesPath);

  // Act
  await decoder.decode(dlvFilePath, outputJsonPath, parsedJsonPath);

  // Assert
  expect(fs.writeFile).toHaveBeenCalledTimes(2);
  
  const fullOutputCall = vi.mocked(fs.writeFile).mock.calls[0];
  const parsedOutputCall = vi.mocked(fs.writeFile).mock.calls[1];

  expect(fullOutputCall[0]).toBe(outputJsonPath);
  expect(parsedOutputCall[0]).toBe(parsedJsonPath);

  const fullOutput = JSON.parse(fullOutputCall[1] as string);
  const parsedOutput = JSON.parse(parsedOutputCall[1] as string);

  expect(fullOutput).toHaveLength(1);
  expect(parsedOutput).toHaveLength(1);

  expect(parsedOutput[0]).toEqual({
    NETTYPE: '11',
    BILLTYPE: '01',
    SUBSCRIBER: '2552500',
    DESTINATION: '0060889825396945',
    TYPE: 'international',
    COUNTRYCODE: 6088,
    ANSDATE: '01092017',
    ANSTIME: '230406',
    ENDDATE: '01092017',
    ENDTIME: '230607',
    CONVERSATIONTIME: '120',
    TOTALCHARGES: 0.12
  });
});

test('Decoder calculates charges correctly for domestic call', async () => {
  mockDlvContent = '11| 01| 0| 9|01092023|100000|01092023|100500|     300|    0|  2|             2552500|    0|  3|     2222222| 65535|      |      |   138|   971|  15| 118| 10| 4|0| 0|  4|144| 0|0|    0|  971|65535|   50|  3|     2222222|65535|   |                    |102|  2| 0|                 2222222|  1| 63|  3|    |15|15|                     |                     |          |          | 00000000000000000000000000000000| 00000000000000000000000000000000| 000000000000|   |   |   |65535|65535|65535|65535| 15|255|                     |';

  vi.mocked(fs.readFile).mockImplementation((path: string) => {
    if (path === dlvFilePath) {
      return Promise.resolve(mockDlvContent);
    } else if (path === cdrRatesPath) {
      return Promise.resolve(JSON.stringify(mockCdrRates));
    }
    return Promise.reject(new Error('File not found'));
  });
  vi.mocked(fs.writeFile).mockResolvedValue(undefined);

  const decoder = new Decoder(cdrRatesPath);
  await decoder.decode(dlvFilePath, outputJsonPath, parsedJsonPath);

  const parsedOutputCall = vi.mocked(fs.writeFile).mock.calls[1];
  const parsedOutput = JSON.parse(parsedOutputCall[1] as string);
  console.log(parsedOutput);
  expect(parsedOutput).toHaveLength(1);
  
  const ansDateTime = new Date('2023-09-01T10:00:00');
const endDateTime = new Date('2023-09-01T10:05:00');
const conversationTimeInSeconds = endDateTime.getTime() - ansDateTime.getTime();
const rate = {standardRate: 0.1, reducedRate: 0.05}; // Use appropriate rate
console.log(conversationTimeInSeconds)
const expectedCharge = decoder['calculateCharges'](ansDateTime, endDateTime, conversationTimeInSeconds, rate);
console.log(expectedCharge);
expect(parsedOutput[0].TOTALCHARGES).toBeCloseTo(expectedCharge, 2);
});


test('Decoder calculates charges correctly for various scenarios', async () => {
  mockDlvContent = '11| 01| 0| 9|01092023|100000|01092023|100500|     300|    0|  2|             2552500|    0|  3|     006088123456| 65535|      |      |   138|   971|  15| 118| 10| 4|0| 0|  4|144| 0|0|    0|  971|65535|   50|  3|     006088123456|65535|   |                    |102|  2| 0|                 006088123456|  1| 63|  3|    |15|15|                     |                     |          |          | 00000000000000000000000000000000| 00000000000000000000000000000000| 000000000000|   |   |   |65535|65535|65535|65535| 15|255|                     |';

  vi.mocked(fs.readFile).mockImplementation((path: string) => {
    if (path === dlvFilePath) {
      return Promise.resolve(mockDlvContent);
    } else if (path === cdrRatesPath) {
      return Promise.resolve(JSON.stringify(mockCdrRates));
    }
    return Promise.reject(new Error('File not found'));
  });
  vi.mocked(fs.writeFile).mockResolvedValue(undefined);

  const decoder = new Decoder(cdrRatesPath);
  await decoder.decode(dlvFilePath, outputJsonPath, parsedJsonPath);

  const parsedOutputCall = vi.mocked(fs.writeFile).mock.calls[1];
  const parsedOutput = JSON.parse(parsedOutputCall[1] as string);

  expect(parsedOutput).toHaveLength(1);
  expect(parsedOutput[0].TOTALCHARGES).toBeCloseTo(0.06 * 2, 2);
});
