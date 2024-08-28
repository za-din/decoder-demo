import fs from 'fs/promises';
import path from 'path';

export type CallerDetailRecord = {
  answerDateTime: Date;
  endDateTime: Date;
  calledNumber: string;
};

export type CdrRateJson = {
  rateId: string;
  countryCode: number;
  standardRate: number;
  reducedRate: number;
  description: string;
  dialPlan: string;
  chargingBlockId: string;
  accessCode: string;
};

export type CdrRate = CdrRateJson & {
  economic: boolean;
};

export type CdrRateTable = CdrRateJson[];

export type ChargeDetail = {
  chargeAmount: number;
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

  async decode(dlvFilePath: string, outputJsonPath: string, parsedJsonPath: string): Promise<void> {
    const dlvData = await fs.readFile(dlvFilePath, 'utf-8');
    const lines = dlvData.split('\n');

    const fullResults = [];
    const parsedResults = [];

    for (const line of lines) {
      if (line.trim()) {
        const { fullRecord, parsedRecord } = this.parseDlvLine(line);
        fullResults.push(fullRecord);
        parsedResults.push(parsedRecord);
      }
    }

    await fs.writeFile(outputJsonPath, JSON.stringify(fullResults, null, 2));
    await fs.writeFile(parsedJsonPath, JSON.stringify(parsedResults, null, 2));
  }

  private parseDlvLine(line: string): { fullRecord: any, parsedRecord: any } {
    const fields = line.split('|');
    const fullRecord: any = {};

    this.fieldDefinitions.forEach((field, index) => {
      fullRecord[field.name] = fields[index]?.trim() || '';
    });

    const calledNumber = fullRecord.CALLEDNUMBER || '';
    const countryCode = this.getCountryCode(calledNumber);

    const ansDateTime = new Date(`${fullRecord.ANSDATE.slice(0,4)}-${fullRecord.ANSDATE.slice(4,6)}-${fullRecord.ANSDATE.slice(6,8)}T${fullRecord.ANSTIME.slice(0,2)}:${fullRecord.ANSTIME.slice(2,4)}:${fullRecord.ANSTIME.slice(4,6)}`);
    const endDateTime = new Date(`${fullRecord.ENDDATE.slice(0,4)}-${fullRecord.ENDDATE.slice(4,6)}-${fullRecord.ENDDATE.slice(6,8)}T${fullRecord.ENDTIME.slice(0,2)}:${fullRecord.ENDTIME.slice(2,4)}:${fullRecord.ENDTIME.slice(4,6)}`);

    const matchedRate = this.getRate(countryCode, false);
    const totalCharges = this.calculateCharges(ansDateTime, endDateTime, parseInt(fullRecord.CONVERSATIONTIME, 10), matchedRate);

    const parsedRecord = {
      NETTYPE: fullRecord.NETTYPE,
      BILLTYPE: fullRecord.BILLTYPE,
      SUBSCRIBER: fullRecord.CALLERNUMBER,
      DESTINATION: fullRecord.CALLEDNUMBER,
      TYPE: this.getCallType(fullRecord.CALLEDADDRESSNATURE),
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
  private getCountryCode(calledNumber: string): number | 'default' {
    if (!calledNumber || !calledNumber.startsWith('00')) {
      return 'default';
    }
    const numberWithoutPrefix = calledNumber.substring(2);
    for (let i = 4; i >= 1; i--) {
      const potentialDialCode = numberWithoutPrefix.substring(0, i);
      const matchedRates = this.cdrRates.filter(rate => rate.dialPlan === potentialDialCode);
      if (matchedRates.length === 1 || (matchedRates.length > 1 && matchedRates.every(rate => rate.countryCode === matchedRates[0].countryCode))) {
        return matchedRates[0].countryCode;
      }
    }
    return 'default';
  }


  private getRate(countryCode: number | 'default' | null, economic: boolean | null): CdrRate {
    const defaultNonEconomicRate: CdrRate = {
      rateId: 'default-non-economic',
      countryCode: 0,
      standardRate: 0.1,
      reducedRate: 0.05,
      description: 'Default Non-Economic Rate',
      dialPlan: '',
      chargingBlockId: '',
      accessCode: '0',
      economic: false
    };
  
    const defaultEconomicRate: CdrRate = {
      rateId: 'default-economic',
      countryCode: 0,
      standardRate: 0.08,
      reducedRate: 0.04,
      description: 'Default Economic Rate',
      dialPlan: '',
      chargingBlockId: '',
      accessCode: '95',
      economic: true
    };
  
    if (countryCode === null) {
      return economic ? defaultEconomicRate : defaultNonEconomicRate;
    }
  
  
    const matchedRates = this.cdrRates.filter(rate => rate.countryCode === countryCode);
  
    if (matchedRates.length === 1) {
      return matchedRates[0];
    }
  
    if (matchedRates.length > 1) {
      if (economic) {
        const economicRate = matchedRates.find(rate => rate.accessCode === "95");
        if (economicRate) {
          return economicRate;
        }
      }
  
      const standardRate = matchedRates.find(rate => rate.accessCode === "0");
      if (standardRate) {
        return standardRate;
      }
    }
  
    return defaultNonEconomicRate;
  }
  

  private calculateCharges(ansDateTime: Date, endDateTime: Date, conversationTimeInSeconds: number, rate: CdrRate): number {
    const startHour = ansDateTime.getHours();
    const endHour = endDateTime.getHours();
    
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
    
    const roundedStandardSeconds = this.roundUpToMinute(standardSeconds);
    const roundedReducedSeconds = this.roundUpToMinute(reducedSeconds);
    
    const standardCharge = (roundedStandardSeconds / 60) * rate.standardRate;
    const reducedCharge = (roundedReducedSeconds / 60) * rate.reducedRate;
    
    return Number((standardCharge + reducedCharge).toFixed(2));
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
}