export type CallerDetailRecord = {
  answerDateTime: Date;
  endDateTime: Date;
  calledNumber: number;
};

export type CdrRate = {
  countryCode: number;
  standardRate: number;
  reducedRate: number;
  economic: boolean;
};

export type ChargeDetail = {
  chargeAmount: number;
};

export class Decoder {
  decode(
    callerDetailRecords: CallerDetailRecord[],
    cdrRates: CdrRate[]
  ): ChargeDetail[] {
    return callerDetailRecords.map((record) => {
      const rateDetail = this.getRate(record, cdrRates);

      if (!rateDetail) {
        // Handle the case where rateDetail is undefined
        // For example, apply a default rate or return a charge with a default amount
        return {
          chargeAmount: this.calculateDefaultCharge(record),
        };
      }

      const conversationTime = this.calculateConversationTime(
        record.endDateTime,
        record.answerDateTime
      );

      let chargeAmount: number;

      if (this.spansMultipleDays(record)) {
        chargeAmount = this.calculateMultiDayCharge(record, rateDetail);
      } else if (this.spansStandardAndReducedRates(record, rateDetail)) {
        chargeAmount = this.calculateSpanRateCharge(record, rateDetail);
      } else {
        chargeAmount =
          conversationTime * this.getSingleRate(record, rateDetail); // This should correctly use the reduced rate
      }

      return {
        chargeAmount,
      };
    });
  }

  private calculateConversationTime(
    endDateTime: Date,
    answerDateTime: Date
  ): number {
    // Ensure this returns the correct time difference in seconds
    return Math.round(
      (endDateTime.getTime() - answerDateTime.getTime()) / 1000
    );
  }

  private getRate(
    record: CallerDetailRecord,
    cdrRates: CdrRate[]
  ): CdrRate | undefined {
    return cdrRates.find((rate) =>
      record.calledNumber.toString().startsWith(rate.countryCode.toString())
    );
  }

  private getSingleRate(
    record: CallerDetailRecord,
    rateDetail: CdrRate
  ): number {
    const callHour = record.answerDateTime.getHours();
    // Apply reduced rate if within reduced rate hours (e.g., 0:00 - 7:59 AM)
    if (callHour >= 0 && callHour < 8) {
      return rateDetail.reducedRate;
    }
    // Apply standard rate otherwise
    return rateDetail.standardRate;
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
