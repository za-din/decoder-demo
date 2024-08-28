import fs from 'fs/promises';
import path from 'path';

export type CallerDetailRecord = {
  answerDateTime: Date;
  endDateTime: Date;
  calledNumber: number;
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
  async decode(callerDetailRecords: CallerDetailRecord[], cdrRates: CdrRate[]): Promise<ChargeDetail[]> {
    //const cdrFilePath = path.join(__dirname, '../cdr.json');
    //const cdrData = await fs.readFile(cdrFilePath, 'utf-8');
    //const cdrRates: CdrRate[] = JSON.parse(cdrData);

    return callerDetailRecords.map((record) => {
      const rateDetail = this.getRate(record, cdrRates);

      if (!rateDetail) {
        return {
          chargeAmount: this.calculateDefaultCharge(record),
        };
      }

      const conversationTime = this.calculateConversationTime(
        record.endDateTime,
        record.answerDateTime
      );

      const rate = this.getSingleRate(record, rateDetail);
     
    const chargeAmount = conversationTime * rate;
    console.log("RATE ==>",rate, "conversationTime", conversationTime, "chargeAmount:", chargeAmount)

    return {
      chargeAmount,
    };
    });
  }

  private calculateConversationTime(
    endDateTime: Date,
    answerDateTime: Date
  ): number {
    return Math.round((endDateTime.getTime() - answerDateTime.getTime()) / 1000);
  }

  private getRate(
    record: CallerDetailRecord,
    cdrRates: CdrRate[]
  ): CdrRate | undefined {
    return cdrRates.find((rate) =>
      record.calledNumber &&
      record.calledNumber.toString().startsWith(rate.countryCode.toString())
    );
  }

  private getSingleRate(record: CallerDetailRecord, rateDetail: CdrRate): number {
    const callHour = record.answerDateTime.getHours();
    const isEconomic = rateDetail.accessCode === "95";
    
    console.log("Call Hour:", callHour, "Is Economic:", isEconomic);
    console.log("Reduced Rate:", rateDetail.reducedRate, "Standard Rate:", rateDetail.standardRate);
  
    let rate;
    if (isEconomic) {
      rate = rateDetail.reducedRate;
    } else {
      rate = (callHour >= 0 && callHour < 8) ? rateDetail.reducedRate : rateDetail.standardRate;
    }
  
    console.log("Selected Rate:", rate);
    return rate;
  }

  private spansMultipleDays(record: CallerDetailRecord): boolean {
    return record.answerDateTime.getDate() !== record.endDateTime.getDate();
  }

  private spansStandardAndReducedRates(
    record: CallerDetailRecord,
    rateDetail: CdrRate
  ): boolean {
    const startHour = record.answerDateTime.getHours();
    const endHour = record.endDateTime.getHours();
    return (startHour < 8 && endHour >= 8) || (startHour >= 8 && endHour < 8);
  }

  private calculateMultiDayCharge(
    record: CallerDetailRecord,
    rateDetail: CdrRate
  ): number {
    let chargeAmount = 0;

    let currentStart = record.answerDateTime;
    let currentEnd = new Date(currentStart);
    currentEnd.setHours(23, 59, 59, 999);

    while (currentStart.getDate() !== record.endDateTime.getDate()) {
      chargeAmount += this.calculateSpanRateCharge(
        { ...record, endDateTime: currentEnd },
        rateDetail
      );

      currentStart = new Date(currentStart);
      currentStart.setDate(currentStart.getDate() + 1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(currentStart);
      currentEnd.setHours(23, 59, 59, 999);
    }

    chargeAmount += this.calculateSpanRateCharge(
      { ...record, answerDateTime: currentStart },
      rateDetail
    );

    return chargeAmount;
  }

  private calculateSpanRateCharge(
    record: CallerDetailRecord,
    rateDetail: CdrRate
  ): number {
    const startHour = record.answerDateTime.getHours();
    const endHour = record.endDateTime.getHours();
    const conversationTime = this.calculateConversationTime(
      record.endDateTime,
      record.answerDateTime
    );
  
    if (startHour < 8 && endHour < 8) {
      return conversationTime * rateDetail.reducedRate;
    } else if (startHour >= 8 && endHour >= 8) {
      return conversationTime * rateDetail.standardRate;
    } else {
      const reducedRateEnd = new Date(record.answerDateTime);
      reducedRateEnd.setHours(8, 0, 0, 0);
      const reducedTime = this.calculateConversationTime(
        reducedRateEnd,
        record.answerDateTime
      );
      const standardTime = conversationTime - reducedTime;
      return (
        reducedTime * rateDetail.reducedRate +
        standardTime * rateDetail.standardRate
      );
    }
  }
  

  private calculateDefaultCharge(record: CallerDetailRecord): number {
    // Default charge logic here, e.g., apply a default rate per second
    const defaultRate = 1; // This is an example, use your actual default rate
    const conversationTime = this.calculateConversationTime(
      record.endDateTime,
      record.answerDateTime
    );
    return conversationTime * defaultRate;
  }
}