export type CallerDetailRecord = {
  answerDateTime: Date;
  endDateTime: Date;
  calledNumber: number;
};

export type CdrRate = {
  countryCode: number;
  standardRate: number;
  reducedRate: number;
};

export type ChargeDetail = {
  chargeAmount: number;
};

export class Decoder {
  decode(
    callerDetailRecords: CallerDetailRecord[],
    cdrRates: CdrRate[]
  ): ChargeDetail[] {
    return callerDetailRecords.map((r) => {
      const conversationTime = this.calculateConversationTime(
        r.endDateTime,
        r.answerDateTime
      );

      const rate: number = this.getRate(r, cdrRates);

      const chargeAmount: number = conversationTime * rate;

      return {
        chargeAmount,
      };
    });
  }

  private calculateConversationTime(
    endDateTime: Date,
    answerDateTime: Date
  ): number {
    // need to confirm if need to handle extra seconds
    return (
      (endDateTime.getHours() - answerDateTime.getHours()) * 60 +
      (endDateTime.getMinutes() - answerDateTime.getMinutes())
    );
  }

  private getRate(record: CallerDetailRecord, cdrRates: CdrRate[]): number {
    // need to handle for economic and non economic call
    const rateDetail = cdrRates.find((r) =>
      // need to verify if using includes is sufficient
      record.calledNumber.toString().includes(r.countryCode.toString())
    );

    // need to double check how to handle unlisted rate detail
    if (rateDetail == undefined) {
      return 1;
    }

    return rateDetail.standardRate;
  }
}
