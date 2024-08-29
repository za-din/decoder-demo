import { describe , expect, test, vi ,beforeEach, afterEach, beforeAll} from 'vitest';
import { Decoder } from '../src/decoder';
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

test('decode method processes Domestic record correctly', () => {
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

describe('decode method processes Domestic  record correctly', async () => {
  const cdrRatesPath = path.resolve(__dirname, '../cdr.json');
  const decoder = new Decoder(cdrRatesPath);
  const parsedRecords = await decoder.dlvParse(dlvFilePath);
  
  
  await decoder['loadCdrRates'](cdrRatesPath);
  
  const internationalRecord = parsedRecords[0];

  const processedRecord = decoder['processRecord'](internationalRecord);

  test('Type is landline', () => {
    expect(processedRecord).toHaveProperty('TYPE', 'landline');
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

  test('Country Code is correct (null)', () => {
    expect(processedRecord).toHaveProperty('COUNTRYCODE', null);
  });
});

describe('Process Domestic record with 5-minute STANDARD TIME conversation', async () => {
  
 
    
  const cdrRatesPath = path.resolve(__dirname, '../cdr.json');
  const decoder = new Decoder(cdrRatesPath);
  const parsedRecords = await decoder.dlvParse(dlvFilePath);
  
  
  await decoder['loadCdrRates'](cdrRatesPath);
  
  const internationalRecord = parsedRecords[0];

  internationalRecord.ANSDATE = "13082024";
  internationalRecord.ANSTIME = "100000";
  internationalRecord.ENDDATE = "13082024";
  internationalRecord.ENDTIME = "100500";
  internationalRecord.CONVERSATIONTIME = "300";

  const processedRecord = decoder['processRecord'](internationalRecord);

  test('Conversation Time is 5 minutes', () => {
    expect(processedRecord).toHaveProperty('CONVERSATIONTIME', '300');
  });

  test('Total Charges are calculated correctly', () => {
    const expectedRate = 0.1; // Assuming standard rate for 6088 is 0.1
    const expectedCharges = (5 * expectedRate).toFixed(2);
    expect(processedRecord).toHaveProperty('TOTALCHARGES', parseFloat(expectedCharges));
  });

  test('Type is landline', () => {
    expect(processedRecord).toHaveProperty('TYPE', 'landline');
  });

  test('Country Code is correct (null)', () => {
    expect(processedRecord).toHaveProperty('COUNTRYCODE', null);
  });

  test('Start and End times are correct', () => {
    expect(processedRecord).toHaveProperty('ANSTIME', '100000');
    expect(processedRecord).toHaveProperty('ENDTIME', '100500');
  });
});



describe('Process Domestic Record with 5-minute REDUCED TIME conversation', async () => {
  const cdrRatesPath = path.resolve(__dirname, '../cdr.json');
  const decoder = new Decoder(cdrRatesPath);
  const parsedRecords = await decoder.dlvParse(dlvFilePath);

  await decoder['loadCdrRates'](cdrRatesPath);

  const internationalRecord = parsedRecords[0];

  internationalRecord.ANSDATE = "13082024";
  internationalRecord.ANSTIME = "030000";
  internationalRecord.ENDDATE = "13082024";
  internationalRecord.ENDTIME = "030500";
  internationalRecord.CONVERSATIONTIME = "300";

  const processedRecord = decoder['processRecord'](internationalRecord);

  test('Conversation Time is 5 minutes', () => {
    expect(processedRecord).toHaveProperty('CONVERSATIONTIME', '300');
  });

  test('Total Charges are calculated correctly for reduced time', () => {
    const expectedRate = 0.05; // Assuming reduced rate for 6088 is 0.03
    const expectedCharges = (5 * expectedRate).toFixed(2);
    expect(processedRecord).toHaveProperty('TOTALCHARGES', parseFloat(expectedCharges));
  });

  test('Type is landline', () => {
    expect(processedRecord).toHaveProperty('TYPE', 'landline');
  });

  test('Country Code is correct (null)', () => {
    expect(processedRecord).toHaveProperty('COUNTRYCODE', null);
  });

  test('Start and End times are correct for reduced time', () => {
    expect(processedRecord).toHaveProperty('ANSTIME', '030000');
    expect(processedRecord).toHaveProperty('ENDTIME', '030500');
  });
});


describe('Processes Domestic record with conversation spanning Standard and Reduced time', async () => {
  const cdrRatesPath = path.resolve(__dirname, '../cdr.json');
  const decoder = new Decoder(cdrRatesPath);
  const parsedRecords = await decoder.dlvParse(dlvFilePath);

  await decoder['loadCdrRates'](cdrRatesPath);

  const internationalRecord = parsedRecords[0];

  internationalRecord.ANSDATE = "13082024";
  internationalRecord.ANSTIME = "075500";
  internationalRecord.ENDDATE = "13082024";
  internationalRecord.ENDTIME = "080500";
  internationalRecord.CONVERSATIONTIME = "600";

  const processedRecord = decoder['processRecord'](internationalRecord);

  test('Conversation Time is 10 minutes', () => {
    expect(processedRecord).toHaveProperty('CONVERSATIONTIME', '600');
  });

  test('Total Charges are calculated correctly for mixed time', () => {
    const reducedRate = 0.05; // Assuming reduced rate for 6088 is 0.03
    const standardRate = 0.1; // Assuming standard rate for 6088 is 0.06
    const expectedCharges = ((5 * reducedRate) + (5 * standardRate)).toFixed(2);
    expect(processedRecord).toHaveProperty('TOTALCHARGES', parseFloat(expectedCharges));
  });

  test('Type is Landline', () => {
    expect(processedRecord).toHaveProperty('TYPE', 'landline');
  });

  test('Country Code is correct (null)', () => {
    expect(processedRecord).toHaveProperty('COUNTRYCODE', null);
  });

  test('Start and End times span reduced and standard time', () => {
    expect(processedRecord).toHaveProperty('ANSTIME', '075500');
    expect(processedRecord).toHaveProperty('ENDTIME', '080500');
  });
});
//end Domestic test

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
  const parsedRecords = await decoder.dlvParse(dlvFilePath);
  
  
  await decoder['loadCdrRates'](cdrRatesPath);
  
  const internationalRecord = parsedRecords[29];

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

describe('Process International record with 5-minute STANDARD TIME conversation', async () => {
  
 
    
  const cdrRatesPath = path.resolve(__dirname, '../cdr.json');
  const decoder = new Decoder(cdrRatesPath);
  const parsedRecords = await decoder.dlvParse(dlvFilePath);
  
  
  await decoder['loadCdrRates'](cdrRatesPath);
  
  const internationalRecord = parsedRecords[29];

  internationalRecord.ANSDATE = "13082024";
  internationalRecord.ANSTIME = "100000";
  internationalRecord.ENDDATE = "13082024";
  internationalRecord.ENDTIME = "100500";
  internationalRecord.CONVERSATIONTIME = "300";

  const processedRecord = decoder['processRecord'](internationalRecord);

  test('Conversation Time is 5 minutes', () => {
    expect(processedRecord).toHaveProperty('CONVERSATIONTIME', '300');
  });

  test('Total Charges are calculated correctly', () => {
    const expectedRate = 0.06; // Assuming standard rate for 6088 is 0.1
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



describe('Process International Record with 5-minute REDUCED TIME conversation', async () => {
  const cdrRatesPath = path.resolve(__dirname, '../cdr.json');
  const decoder = new Decoder(cdrRatesPath);
  const parsedRecords = await decoder.dlvParse(dlvFilePath);

  await decoder['loadCdrRates'](cdrRatesPath);

  const internationalRecord = parsedRecords[29];

  internationalRecord.ANSDATE = "13082024";
  internationalRecord.ANSTIME = "030000";
  internationalRecord.ENDDATE = "13082024";
  internationalRecord.ENDTIME = "030500";
  internationalRecord.CONVERSATIONTIME = "300";

  const processedRecord = decoder['processRecord'](internationalRecord);

  test('Conversation Time is 5 minutes', () => {
    expect(processedRecord).toHaveProperty('CONVERSATIONTIME', '300');
  });

  test('Total Charges are calculated correctly for reduced time', () => {
    const expectedRate = 0.05; // Assuming reduced rate for 6088 is 0.03
    const expectedCharges = (5 * expectedRate).toFixed(2);
    expect(processedRecord).toHaveProperty('TOTALCHARGES', parseFloat(expectedCharges));
  });

  test('Type is International', () => {
    expect(processedRecord).toHaveProperty('TYPE', 'international');
  });

  test('Country Code is correct', () => {
    expect(processedRecord).toHaveProperty('COUNTRYCODE', 6088);
  });

  test('Start and End times are correct for reduced time', () => {
    expect(processedRecord).toHaveProperty('ANSTIME', '030000');
    expect(processedRecord).toHaveProperty('ENDTIME', '030500');
  });
});


describe('Processes international record with conversation spanning Standard and Reduced time', async () => {
  const cdrRatesPath = path.resolve(__dirname, '../cdr.json');
  const decoder = new Decoder(cdrRatesPath);
  const parsedRecords = await decoder.dlvParse(dlvFilePath);

  await decoder['loadCdrRates'](cdrRatesPath);

  const internationalRecord = parsedRecords[29];

  internationalRecord.ANSDATE = "13082024";
  internationalRecord.ANSTIME = "075500";
  internationalRecord.ENDDATE = "13082024";
  internationalRecord.ENDTIME = "080500";
  internationalRecord.CONVERSATIONTIME = "600";

  const processedRecord = decoder['processRecord'](internationalRecord);

  test('Conversation Time is 10 minutes', () => {
    expect(processedRecord).toHaveProperty('CONVERSATIONTIME', '600');
  });

  test('Total Charges are calculated correctly for mixed time', () => {
    const reducedRate = 0.05; // Assuming reduced rate for 6088 is 0.03
    const standardRate = 0.06; // Assuming standard rate for 6088 is 0.06
    const expectedCharges = ((5 * reducedRate) + (5 * standardRate)).toFixed(2);
    expect(processedRecord).toHaveProperty('TOTALCHARGES', parseFloat(expectedCharges));
  });

  test('Type is International', () => {
    expect(processedRecord).toHaveProperty('TYPE', 'international');
  });

  test('Country Code is correct', () => {
    expect(processedRecord).toHaveProperty('COUNTRYCODE', 6088);
  });

  test('Start and End times span reduced and standard time', () => {
    expect(processedRecord).toHaveProperty('ANSTIME', '075500');
    expect(processedRecord).toHaveProperty('ENDTIME', '080500');
  });
});
