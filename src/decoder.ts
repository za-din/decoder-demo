
import fs from 'fs/promises';
import path from 'path';
import parsePhoneNumber from 'libphonenumber-js'
import { Parser } from 'json2csv';

type CdrRate = {
  rateId: string;
  countryCode: number;
  standardRate: number;
  reducedRate: number;
  description: string;
  dialPlan: string;
  chargingBlockId: string;
  accessCode: string;
};

type ParsedRecord = {
  [key: string]: string;
};

export class Decoder {
    private fieldDefinitions = [
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

  private cdrRates: CdrRate[];

  constructor(cdrRatesPath: string) {
    this.loadCdrRates(cdrRatesPath);
  }

  private async loadCdrRates(cdrRatesPath: string): Promise<void> {
    const data = await fs.readFile(cdrRatesPath, 'utf-8');
    this.cdrRates = JSON.parse(data);
  }


  async dlvParse(dlvFilePath: string): Promise<ParsedRecord[]> {
    const dlvData = await fs.readFile(dlvFilePath, 'utf-8');
    const lines = dlvData.split('\n');
    return lines.filter(line => line.trim()).map(line => this.parseDlvLine(line));
  }

  decode(parsedRecords: ParsedRecord[]): any[] {
  return parsedRecords.map(record => this.processRecord(record));
}

  private parseDlvLine(line: string): ParsedRecord {
    const fields = line.split('|');
    const parsedRecord: ParsedRecord = {};

    this.fieldDefinitions.forEach((field, index) => {
      parsedRecord[field.name] = fields[index]?.trim() || '';
    });

    return parsedRecord;
  }

  private processRecord(record: ParsedRecord): any {
    const ansDateTime = this.createValidDate(record.ANSDATE, record.ANSTIME);
    const endDateTime = this.createValidDate(record.ENDDATE, record.ENDTIME);
  
    const { standardSeconds, reducedSeconds } = this.calculateConversationTimeInSeconds(ansDateTime, endDateTime);
    const countryCode = this.getCountryCode(record.CALLEDNUMBER);
    const rate = this.getRate(countryCode, false);
    const totalCharges = this.calculateCharges(standardSeconds, reducedSeconds, rate);
  
    return {
      NETTYPE: record.NETTYPE,
      BILLTYPE: record.BILLTYPE,
      SUBSCRIBER: record.CALLERNUMBER,
      DESTINATION: record.CALLEDNUMBER,
      TYPE: this.getCallType(record.CALLEDADDRESSNATURE),
      COUNTRYCODE: countryCode === 'default' ? null : countryCode,
      ANSDATE: record.ANSDATE,
      ANSTIME: record.ANSTIME,
      ENDDATE: record.ENDDATE,
      ENDTIME: record.ENDTIME,
      CONVERSATIONTIME: record.CONVERSATIONTIME,
      CALCULATEDCONVERSATIONTIME: standardSeconds + reducedSeconds,
      STANDARDSECONDS: standardSeconds,
      REDUCEDSECONDS: reducedSeconds,
      TOTALCHARGES: totalCharges
    };
  }

  private createValidDate(dateStr: string, timeStr: string): Date {
    const day = parseInt(dateStr.slice(0, 2), 10);
    const month = parseInt(dateStr.slice(2, 4), 10) - 1; // JS months are 0-indexed
    const year = 2000 + parseInt(dateStr.slice(4, 6), 10); // Assuming years are in the 2000s
    const hour = parseInt(timeStr.slice(0, 2), 10);
    const minute = parseInt(timeStr.slice(2, 4), 10);
    const second = parseInt(timeStr.slice(4, 6), 10);
  
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute) || isNaN(second)) {
      return new Date(); // Return current date if any part is invalid
    }
  
    return new Date(year, month, day, hour, minute, second);
  }

  
//TODO
//Need to update to check if economical no not. base on the number Starts WIth 00, 095, 098, 099.
//Edit the matched rate to select either where access_code = 0 or 95.
  private getCountryCode(calledNumber: string): number | 'default' {
    if (!calledNumber || !calledNumber.startsWith('00')) {
      return 'default';
    }
    const numberWithoutPrefix = calledNumber.substring(2);
    
    // First, try to match using cdrRates
    let longestMatch = null;
    for (let i = 4; i >= 1; i--) {
      const potentialDialCode = numberWithoutPrefix.substring(0, i);
      const matchedRates = this.cdrRates.filter(rate => rate.dialPlan === potentialDialCode);
      if (matchedRates.length > 0) {
        longestMatch = matchedRates[0];
        break;
      }
    }
  
    if (longestMatch) {
      return longestMatch.countryCode;
    }
  
    // If no match found in cdrRates, use libphonenumber-js
    const phoneNumber = parsePhoneNumber('+' + numberWithoutPrefix);
    return phoneNumber ? parseInt(phoneNumber.countryCallingCode) : 'default';
  }
  
  private testGetCountryCode() {
    const testData = '11|01|0|9|13082024|092305|13082024|092330|      25|    0|  0|             2330142|    0|  3|        006088265386| 65535|      |      |    47|    73|  15| 118| 10| 4|0| 0|  4|144| 1|0|    0|    0|65535|   50|  3|        006088265386|65535|   |                    |  3|  2| 0|                    006088265386|  1| 63|  3|    |15|15|                     |                     |          |          | 00000000000000000000000000000000| 00000000000000000000000000000000| 000000000000|   |   |   |65535|65535|65535|65535| 15|255|                     |';
    
    const fields = testData.split('|');
    const calledNumber = fields[14].trim(); // '006088265386'
    
    const countryCode = this.getCountryCode(calledNumber);
    console.log(`Country code for ${calledNumber}: ${countryCode}`);
  }

  private getRate(countryCode: number | 'default', economic: boolean): CdrRate {

    //TODO:
    //need to update this. for voice to voice, voice to mobile, refer the notes
    const defaultRate: CdrRate = {
      rateId: 'default',
      countryCode: 0,
      standardRate: 0.1,
      reducedRate: 0.05,
      description: 'Default Rate',
      dialPlan: '',
      chargingBlockId: '',
      accessCode: '0'
    };

    if (countryCode === 'default') {
      return defaultRate;
    }

    const matchedRates = this.cdrRates.filter(rate => rate.countryCode === countryCode);
    if (matchedRates.length > 0) {
      return economic ? matchedRates.find(rate => rate.accessCode === "95") || matchedRates[0] : matchedRates.find(rate => rate.accessCode === "0") || matchedRates[0];
    }

    return defaultRate;
  }

  private calculateConversationTimeInSeconds(ansDateTime: Date, endDateTime: Date): { standardSeconds: number, reducedSeconds: number } {
    const startHour = ansDateTime.getHours();
    const endHour = endDateTime.getHours();
    const conversationTimeInSeconds = Math.max(0, (endDateTime.getTime() - ansDateTime.getTime()) / 1000);
  
    let standardSeconds = 0;
    let reducedSeconds = 0;
  
    if (this.isReducedRateTime(startHour) === this.isReducedRateTime(endHour)) {
      if (this.isReducedRateTime(startHour)) {
        reducedSeconds = conversationTimeInSeconds;
      } else {
        standardSeconds = conversationTimeInSeconds;
      }
    } else {
      const reducedEndTime = new Date(ansDateTime);
      reducedEndTime.setHours(8, 0, 0, 0);
      reducedSeconds = (reducedEndTime.getTime() - ansDateTime.getTime()) / 1000;
      standardSeconds = conversationTimeInSeconds - reducedSeconds;
    }
  
    return { standardSeconds, reducedSeconds };
  }

  private calculateCharges(standardSeconds: number, reducedSeconds: number, rate: CdrRate): number {
    const roundedStandardSeconds = this.roundUpToMinute(standardSeconds || 0);
    const roundedReducedSeconds = this.roundUpToMinute(reducedSeconds || 0);
  
    const standardCharge = (roundedStandardSeconds / 60) * (rate.standardRate || 0);
    const reducedCharge = (roundedReducedSeconds / 60) * (rate.reducedRate || 0);
  
    return Number((standardCharge + reducedCharge).toFixed(2)) || 0;
  }

  private isReducedRateTime(hour: number): boolean {
    return hour >= 0 && hour < 8;
  }

  private roundUpToMinute(seconds: number): number {
    return Math.ceil(seconds / 60) * 60;
  }

  private getCallType(calledAddressNature: string): string {
    switch (calledAddressNature) {
      case '3': return 'international';
      case '2': return 'mobile';
      case '0': return 'landline';
      default: return 'unknown';
    }
  }

  public async convertToCSV(processedRecords: any[]): string {
    const fields = [
      'NETTYPE',
      'BILLTYPE',
      'SUBSCRIBER',
      'DESTINATION',
      'TYPE',
      'COUNTRYCODE',
      'ANSDATE',
      'ANSTIME',
      'ENDDATE',
      'ENDTIME',
      'CONVERSATIONTIME',
      'CALCULATEDCONVERSATIONTIME',
      'TOTALCHARGES'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(processedRecords);

    await fs.writeFile("test.csv", csv, 'utf8');
  }
}
