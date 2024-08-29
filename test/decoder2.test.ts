import { describe , expect, test, vi ,beforeEach, afterEach, beforeAll} from 'vitest';
import { Decoder } from '../src/decoder2';
import fs from 'fs/promises';
import path from 'path';


const cdrRatesPath = path.resolve(__dirname, '../cdr.json');
const dlvFilePath = path.join(__dirname, '../data.DLV');

let decoder: Decoder;
let parsedRecords: any[];

beforeAll(async () => {
  decoder = new Decoder(cdrRatesPath);
  parsedRecords = await decoder.dlvParse(dlvFilePath);
});

test('loadCdrRates loads actual CDR rates from file', async () => {
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

test('dlvParse method parses DLV file correctly', async () => {
  const decoder = new Decoder(cdrRatesPath);

  const parsedRecords = await decoder.dlvParse(dlvFilePath);

  expect(parsedRecords).toBeDefined();
  expect(Array.isArray(parsedRecords)).toBe(true);
  expect(parsedRecords.length).toBeGreaterThan(0);

  const firstParsedRecord = parsedRecords[0];
  expect(firstParsedRecord).toHaveProperty('NETTYPE');
  expect(firstParsedRecord).toHaveProperty('BILLTYPE');
  expect(firstParsedRecord).toHaveProperty('CALLERNUMBER');
  expect(firstParsedRecord).toHaveProperty('CALLEDNUMBER');
  // Add more specific assertions for parsed record properties
});

test('decode method processes parsed records correctly', async () => {
  
  const processedRecords = decoder.decode(parsedRecords);

  expect(processedRecords).toBeDefined();
  expect(Array.isArray(processedRecords)).toBe(true);
  expect(processedRecords.length).toBe(parsedRecords.length);

  const firstProcessedRecord = processedRecords[0];
  expect(firstProcessedRecord).toHaveProperty('NETTYPE');
  expect(firstProcessedRecord).toHaveProperty('BILLTYPE');
  expect(firstProcessedRecord).toHaveProperty('SUBSCRIBER');
  expect(firstProcessedRecord).toHaveProperty('DESTINATION');
  expect(firstProcessedRecord).toHaveProperty('TYPE');
  expect(firstProcessedRecord).toHaveProperty('COUNTRYCODE');
  expect(firstProcessedRecord).toHaveProperty('ANSDATE');
  expect(firstProcessedRecord).toHaveProperty('ANSTIME');
  expect(firstProcessedRecord).toHaveProperty('ENDDATE');
  expect(firstProcessedRecord).toHaveProperty('ENDTIME');
  expect(firstProcessedRecord).toHaveProperty('CONVERSATIONTIME');
  expect(firstProcessedRecord).toHaveProperty('TOTALCHARGES');
  // Add more specific assertions for processed record properties
});

test('decode method processes landline record correctly', () => {
  const landlineRecord = parsedRecords[0];
  const processedRecord = decoder['processRecord'](landlineRecord);

  expect(processedRecord).toHaveProperty('TYPE', 'landline');
  expect(processedRecord).toHaveProperty('SUBSCRIBER', landlineRecord.CALLERNUMBER);
  expect(processedRecord).toHaveProperty('DESTINATION', landlineRecord.CALLEDNUMBER);
  expect(processedRecord).toHaveProperty('ANSDATE', landlineRecord.ANSDATE);
  expect(processedRecord).toHaveProperty('ANSTIME', landlineRecord.ANSTIME);
  expect(processedRecord).toHaveProperty('ENDDATE', landlineRecord.ENDDATE);
  expect(processedRecord).toHaveProperty('ENDTIME', landlineRecord.ENDTIME);
  expect(processedRecord).toHaveProperty('CONVERSATIONTIME', landlineRecord.CONVERSATIONTIME);
});

test('decode method processes international record correctly', () => {
  const internationalRecord = parsedRecords[29];
  const processedRecord = decoder['processRecord'](internationalRecord);

  expect(processedRecord).toHaveProperty('TYPE', 'international');
  expect(processedRecord).toHaveProperty('SUBSCRIBER', internationalRecord.CALLERNUMBER);
  expect(processedRecord).toHaveProperty('DESTINATION', internationalRecord.CALLEDNUMBER);
  expect(processedRecord).toHaveProperty('ANSDATE', internationalRecord.ANSDATE);
  expect(processedRecord).toHaveProperty('ANSTIME', internationalRecord.ANSTIME);
  expect(processedRecord).toHaveProperty('ENDDATE', internationalRecord.ENDDATE);
  expect(processedRecord).toHaveProperty('ENDTIME', internationalRecord.ENDTIME);
  expect(processedRecord).toHaveProperty('CONVERSATIONTIME', internationalRecord.CONVERSATIONTIME);
});



describe('decode method processes international record correctly', async () => {
  const cdrRatesPath = path.resolve(__dirname, '../cdr.json');
  
  const decoder = new Decoder(cdrRatesPath);
  await decoder['loadCdrRates'](cdrRatesPath);


  
  const internationalRecord = {
  NETTYPE: "11",
  BILLTYPE: "01",
  PARTIALRECORDINDICATOR: "0",
  CHARGEPARTYINDICATOR: "9",
  ANSDATE: "13082024",
  ANSTIME: "092305",
  ENDDATE: "13082024",
  ENDTIME: "092330",
  CONVERSATIONTIME: "25",
  CALLERDNSET: "0",
  CALLERADDRESSNATURE: "0",
  CALLERNUMBER: "2330142",
  CALLEDDNSET: "0",
  CALLEDADDRESSNATURE: "3",
  CALLEDNUMBER: "006088265386",
  CENTREXGROUPNUMBER: "65535",
  CALLERCTXNUMBER: "",
  CALLEDCTXNUMBER: "",
  TRUNKGROUPIN: "47",
  TRUNKGROUPOUT: "73",
  CALLERDID: "15",
  CALLEDDID: "118",
  CALLERCATEGORY: "10",
  CALLTYPE: "4",
  CONNECTEDNUM: "0",
  BERTYPE: "0",
  GSVN: "4",
  TERMINATIONCODE: "144",
  TERMINATINGREASON: "1",
  CALLCHARGEAMOUNT: "0",
  CALLERSRC: "0",
  CALLEDSRC: "0",
  SUPPLEMENTARYSERVICETYPE: "65535",
  CHARGINGCASE: "50",
  CONNECTEDADDRESSNATURE: "3",
  CONNECTEDNUMBER: "006088265386",
  CHARGEDNSET: "65535",
  CHARGEADDRESSNATURE: "",
  CHARGENUMBER: "",
  BEARERSERVICE: "3",
  BEARERMODE: "2",
  ISUPINDICATION1: "0",
  DIALNUMBER: "006088265386",
  PARTIALCOUNTER: "1",
  SERVICEID: "63",
  CALLEREQUIPMENTTYPE: "3",
  CODETYPEVIDEO: "",
  CALLERROAMMODE: "15",
  CALLEDROAMMODE: "15",
  CALLERNUMBERBEFORECHANGE: "",
  CALLEDNUMBERBEFORECHANGE: "",
  OPC: "",
  DPC: "",
  INCOMINGROUTEID: "00000000000000000000000000000000",
  OUTGOINGROUTEID: "00000000000000000000000000000000",
  SWITCHID: "000000000000",
  LOCALTIMEZONE: "",
  CALLERTIMEZONE: "",
  CALLEDTIMEZONE: "",
  CALLERPORTNUMBER: "65535",
  CALLEDPORTNUMBER: "65535",
  OUTGOINGTRAFFICDISPERSIONID: "65535",
  INCOMINGTRAFFICDISPERSIONID: "65535",
  TELESERVICE: "15",
  PSTNINDICATOR: "255",
  ORGNUMBER: "",
}

  const processedRecord = decoder['processRecord'](internationalRecord);

  test('Type is International', () => {
    expect(processedRecord).toHaveProperty('TYPE', 'international');
  });

  test('Subscriber matches', () => {
    expect(processedRecord).toHaveProperty('SUBSCRIBER', internationalRecord.CALLERNUMBER);
  });

  test('Destination matches', () => {
    expect(processedRecord).toHaveProperty('DESTINATION', internationalRecord.CALLEDNUMBER);
  });

  test('Date and Time match', () => {
    expect(processedRecord).toHaveProperty('ANSDATE', internationalRecord.ANSDATE);
    expect(processedRecord).toHaveProperty('ANSTIME', internationalRecord.ANSTIME);
    expect(processedRecord).toHaveProperty('ENDDATE', internationalRecord.ENDDATE);
    expect(processedRecord).toHaveProperty('ENDTIME', internationalRecord.ENDTIME);
  });

  test('Conversation Time matches', () => {
    expect(processedRecord).toHaveProperty('CONVERSATIONTIME', internationalRecord.CONVERSATIONTIME.trim());
  });

  test('Country Code is correct', () => {
    expect(processedRecord).toHaveProperty('COUNTRYCODE', 6088);
  });
});

describe('decode method processes international record with 5-minute standard time conversation', async () => {
  const cdrRatesPath = path.resolve(__dirname, '../cdr.json');
  const decoder = new Decoder(cdrRatesPath);
  
  
  await decoder['loadCdrRates'](cdrRatesPath);
  

  const internationalRecord = {
    NETTYPE: "11",
    BILLTYPE: "01",
    PARTIALRECORDINDICATOR: "0",
    CHARGEPARTYINDICATOR: "9",
    ANSDATE: "13082024",
    ANSTIME: "100000",
    ENDDATE: "13082024",
    ENDTIME: "100500",
    CONVERSATIONTIME: "300",
    CALLERDNSET: "0",
    CALLERADDRESSNATURE: "0",
    CALLERNUMBER: "2330142",
    CALLEDDNSET: "0",
    CALLEDADDRESSNATURE: "3",
    CALLEDNUMBER: "006088265386",
    CENTREXGROUPNUMBER: "65535",
    CALLERCTXNUMBER: "",
    CALLEDCTXNUMBER: "",
    TRUNKGROUPIN: "47",
    TRUNKGROUPOUT: "73",
    CALLERDID: "15",
    CALLEDDID: "118",
    CALLERCATEGORY: "10",
    CALLTYPE: "4",
    CONNECTEDNUM: "0",
    BERTYPE: "0",
    GSVN: "4",
    TERMINATIONCODE: "144",
    TERMINATINGREASON: "1",
    CALLCHARGEAMOUNT: "0",
    CALLERSRC: "0",
    CALLEDSRC: "0",
    SUPPLEMENTARYSERVICETYPE: "65535",
    CHARGINGCASE: "50",
    CONNECTEDADDRESSNATURE: "3",
    CONNECTEDNUMBER: "006088265386",
    CHARGEDNSET: "65535",
    CHARGEADDRESSNATURE: "",
    CHARGENUMBER: "",
    BEARERSERVICE: "3",
    BEARERMODE: "2",
    ISUPINDICATION1: "0",
    DIALNUMBER: "006088265386",
    PARTIALCOUNTER: "1",
    SERVICEID: "63",
    CALLEREQUIPMENTTYPE: "3",
    CODETYPEVIDEO: "",
    CALLERROAMMODE: "15",
    CALLEDROAMMODE: "15",
    CALLERNUMBERBEFORECHANGE: "",
    CALLEDNUMBERBEFORECHANGE: "",
    OPC: "",
    DPC: "",
    INCOMINGROUTEID: "00000000000000000000000000000000",
    OUTGOINGROUTEID: "00000000000000000000000000000000",
    SWITCHID: "000000000000",
    LOCALTIMEZONE: "",
    CALLERTIMEZONE: "",
    CALLEDTIMEZONE: "",
    CALLERPORTNUMBER: "65535",
    CALLEDPORTNUMBER: "65535",
    OUTGOINGTRAFFICDISPERSIONID: "65535",
    INCOMINGTRAFFICDISPERSIONID: "65535",
    TELESERVICE: "15",
    PSTNINDICATOR: "255",
    ORGNUMBER: "",
  }

  const processedRecord = decoder['processRecord'](internationalRecord);

  test('Conversation Time is 5 minutes', () => {
    expect(processedRecord).toHaveProperty('CONVERSATIONTIME', '300');
  });

  test('Total Charges are calculated correctly', () => {
    const expectedRate = 0.1; // Assuming standard rate for 6088 is 0.1
    const expectedCharges = (5 * expectedRate).toFixed(2);
    expect(processedRecord).toHaveProperty('TOTALCHARGES', parseFloat(expectedCharges));
  });

  test('Type is International', () => {
    expect(processedRecord).toHaveProperty('TYPE', 'international');
  });

  test('Country Code is correct', () => {
    expect(processedRecord).toHaveProperty('COUNTRYCODE', 6088);
  });

  test('Start and End times are correct', () => {
    expect(processedRecord).toHaveProperty('ANSTIME', '100000');
    expect(processedRecord).toHaveProperty('ENDTIME', '100500');
  });
});
