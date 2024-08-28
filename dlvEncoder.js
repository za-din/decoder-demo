import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dlvFilePath = path.join(__dirname, 'data.DLV');
const jsonFilePath = path.join(__dirname, 'output.json');
const parsedJsonFilePath = path.join(__dirname, 'parsed_output.json');
const cdrJsonFilePath = path.join(__dirname, 'cdr.json');

const fieldDefinitions = [
  { name: 'NETTYPE', size: 3 },
  { name: 'BILLTYPE', size: 3 },
  { name: 'PARTIALRECORDINDICATOR', size: 2 },
  { name: 'CHARGEPARTYINDICATOR', size: 2 },
  { name: 'ANSDATE', size: 8 },
  { name: 'ANSTIME', size: 6 },
  { name: 'ENDDATE', size: 8 },
  { name: 'ENDTIME', size: 6 },
  { name: 'CONVERSATIONTIME', size: 8 },
  { name: 'CALLERDNSET', size: 5 },
  { name: 'CALLERADDRESSNATURE', size: 3 },
  { name: 'CALLERNUMBER', size: 20 },
  { name: 'CALLEDDNSET', size: 5 },
  { name: 'CALLEDADDRESSNATURE', size: 3 },
  { name: 'CALLEDNUMBER', size: 20 },
  { name: 'CENTREXGROUPNUMBER', size: 6 },
  { name: 'CALLERCTXNUMBER', size: 6 },
  { name: 'CALLEDCTXNUMBER', size: 6 },
  { name: 'TRUNKGROUPIN', size: 6 },
  { name: 'TRUNKGROUPOUT', size: 6 },
  { name: 'CALLERDID', size: 4 },
  { name: 'CALLEDDID', size: 4 },
  { name: 'CALLERCATEGORY', size: 3 },
  { name: 'CALLTYPE', size: 2 },
  { name: 'CONNECTEDNUM', size: 1 },
  { name: 'BERTYPE', size: 2 },
  { name: 'GSVN', size: 3 },
  { name: 'TERMINATIONCODE', size: 3 },
  { name: 'TERMINATINGREASON', size: 2 },
  { name: 'CALLCHARGEAMOUNT', size: 1 },
  { name: 'CALLERSRC', size: 5 },
  { name: 'CALLEDSRC', size: 5 },
  { name: 'SUPPLEMENTARYSERVICETYPE', size: 5 },
  { name: 'CHARGINGCASE', size: 5 },
  { name: 'CONNECTEDADDRESSNATURE', size: 3 },
  { name: 'CONNECTEDNUMBER', size: 20 },
  { name: 'CHARGEDNSET', size: 5 },
  { name: 'CHARGEADDRESSNATURE', size: 3 },
  { name: 'CHARGENUMBER', size: 20 },
  { name: 'BEARERSERVICE', size: 3 },
  { name: 'BEARERMODE', size: 3 },
  { name: 'ISUPINDICATION1', size: 2 },
  { name: 'DIALNUMBER', size: 32 },
  { name: 'PARTIALCOUNTER', size: 3 },
  { name: 'SERVICEID', size: 3 },
  { name: 'CALLEREQUIPMENTTYPE', size: 3 },
  { name: 'CODETYPEVIDEO', size: 4 },
  { name: 'CALLERROAMMODE', size: 2 },
  { name: 'CALLEDROAMMODE', size: 2 },
  { name: 'CALLERNUMBERBEFORECHANGE', size: 21 },
  { name: 'CALLEDNUMBERBEFORECHANGE', size: 21 },
  { name: 'OPC', size: 10 },
  { name: 'DPC', size: 10 },
  { name: 'INCOMINGROUTEID', size: 33 },
  { name: 'OUTGOINGROUTEID', size: 33 },
  { name: 'SWITCHID', size: 13 },
  { name: 'LOCALTIMEZONE', size: 3 },
  { name: 'CALLERTIMEZONE', size: 3 },
  { name: 'CALLEDTIMEZONE', size: 3 },
  { name: 'CALLERPORTNUMBER', size: 5 },
  { name: 'CALLEDPORTNUMBER', size: 5 },
  { name: 'OUTGOINGTRAFFICDISPERSIONID', size: 5 },
  { name: 'INCOMINGTRAFFICDISPERSIONID', size: 5 },
  { name: 'TELESERVICE', size: 3 },
  { name: 'PSTNINDICATOR', size: 3 },
  { name: 'ORGNUMBER', size: 21 }
];

function isReducedRateTime(hour) {
  // Assuming reduced rate is from 00:00 to 07:59
  return hour >= 0 && hour < 8;
}

const defaultRate = {
  countryCode: 'default',
  standardRate: 0.1,
  reducedRate: 0.05
};


function roundUpToMinute(seconds) {
  return Math.ceil(seconds / 60) * 60;
}

function calculateCharges(ansDateTime, endDateTime, conversationTimeInSeconds, matchedRate) {
  const startHour = ansDateTime.getHours();
  const endHour = endDateTime.getHours();
  
  let standardSeconds = 0;
  let reducedSeconds = 0;
  
  if (isReducedRateTime(startHour) === isReducedRateTime(endHour)) {
    // Call entirely within one rate period
    if (isReducedRateTime(startHour)) {
      reducedSeconds = conversationTimeInSeconds;
    } else {
      standardSeconds = conversationTimeInSeconds;
    }
  } else {
    // Call spans both rate periods
    const reducedEndTime = new Date(ansDateTime);
    reducedEndTime.setHours(8, 0, 0, 0);
    reducedSeconds = (reducedEndTime - ansDateTime) / 1000;
    standardSeconds = conversationTimeInSeconds - reducedSeconds;
  }
  
  const roundedStandardSeconds = roundUpToMinute(standardSeconds);
  const roundedReducedSeconds = roundUpToMinute(reducedSeconds);
  
  const standardCharge = (roundedStandardSeconds / 60) * matchedRate.standardRate;
  const reducedCharge = (roundedReducedSeconds / 60) * matchedRate.reducedRate;
  
  const totalCharge = standardCharge + reducedCharge;
  return Number(totalCharge.toFixed(2));
}
function parseDlvLine(line) {
  const fields = line.split('|');
  const fullRecord = {};

  fieldDefinitions.forEach((field, index) => {
    fullRecord[field.name] = fields[index]?.trim() || '';
  });

  const ansDateTime = new Date(`${fullRecord.ANSDATE.slice(0,4)}-${fullRecord.ANSDATE.slice(4,6)}-${fullRecord.ANSDATE.slice(6,8)}T${fullRecord.ANSTIME.slice(0,2)}:${fullRecord.ANSTIME.slice(2,4)}:${fullRecord.ANSTIME.slice(4,6)}`);
  const endDateTime = new Date(`${fullRecord.ENDDATE.slice(0,4)}-${fullRecord.ENDDATE.slice(4,6)}-${fullRecord.ENDDATE.slice(6,8)}T${fullRecord.ENDTIME.slice(0,2)}:${fullRecord.ENDTIME.slice(2,4)}:${fullRecord.ENDTIME.slice(4,6)}`);
  
  const countryCode = getCountryCode(fullRecord.CALLEDNUMBER, cdrRates);
  let  matchedRate = cdrRates.find(rate => rate.countryCode === countryCode);
  
  let totalCharges = null;
    
  if (!matchedRate) {
    matchedRate = defaultRate;
  }

  totalCharges = calculateCharges(
    ansDateTime, 
    endDateTime, 
    parseInt(fullRecord.CONVERSATIONTIME, 10), 
    matchedRate
  );

  // Create the parsed record with specific fields
  const parsedRecord = {
    NETTYPE: fullRecord.NETTYPE,
    BILLTYPE: fullRecord.BILLTYPE,
    SUBSCRIBER: fullRecord.CALLERNUMBER,
    DESTINATION: fullRecord.CALLEDNUMBER,
    TYPE: getCallType(fullRecord.CALLEDADDRESSNATURE),
    COUNTRYCODE: countryCode === 'default' ? null : countryCode,
    ANSDATE: fullRecord.ANSDATE,
    ANSTIME: fullRecord.ANSTIME,
    ENDDATE: fullRecord.ENDDATE,
    ENDTIME: fullRecord.ENDTIME,
    CONVERSATIONTIME: fullRecord.CONVERSATIONTIME,
    TOTALCHARGES: totalCharges
  };

  return { fullRecord, parsedRecord };
}
function getCallType(calledAddressNature) {
  switch (calledAddressNature) {
    case '3': return 'international';
    case '2': return 'mobile';
    case '0': return 'landline';
    default: return 'unknown';
  }
}

function getCountryCode(calledNumber, cdrRates) {
  if (!calledNumber.startsWith('00')) {
    return 'default';
  }
  if (calledNumber.startsWith('00')) {
    const numberWithoutPrefix = calledNumber.substring(2);
    for (let i = 4; i >= 1; i--) {
      const potentialDialCode = numberWithoutPrefix.substring(0, i);
      const matchedRates = cdrRates.filter(rate => rate.dialPlan === potentialDialCode);
      if (matchedRates.length > 0) {
        // If there's only one match or all matches have the same countryCode, return it
        if (matchedRates.length === 1 || matchedRates.every(rate => rate.countryCode === matchedRates[0].countryCode)) {
          return matchedRates[0].countryCode;
        }
        // If there are multiple matches with different countryCodes, continue to the next iteration
      }
    }
  }
  return null;
}

const results = [];
const parsedResults = [];

// Read CDR rates
const cdrRates = JSON.parse(fs.readFileSync(cdrJsonFilePath, 'utf8'));

fs.readFile(dlvFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const lines = data.split('\n');
  
  for (const line of lines) {
    if (line.trim()) {
      const { fullRecord, parsedRecord } = parseDlvLine(line, cdrRates);
      results.push(fullRecord);
      parsedResults.push(parsedRecord);
    }
  }

  // Write full output
  fs.writeFile(jsonFilePath, JSON.stringify(results, null, 2), (err) => {
    if (err) {
      console.error('Error writing full output file:', err);
      return;
    }
    console.log('DLV file successfully converted to JSON and saved to output.json');
  });

  // Write parsed output
  fs.writeFile(parsedJsonFilePath, JSON.stringify(parsedResults, null, 2), (err) => {
    if (err) {
      console.error('Error writing parsed output file:', err);
      return;
    }
    console.log('Parsed DLV data successfully saved to parsed_output.json');
  });
});