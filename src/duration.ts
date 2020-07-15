export enum DurationUnit {
  Years = "years",
  BiAnnual = "biannual",
  SemiAnnual = "semiannual",
  Quarters = "quarters",
  Months = "months",
  BiMonthly = "bimonthly",
  Days = "days",

  Hours = "hours",
  Minutes = "minutes",
  Seconds = "seconds",

  Weeks = "weeks",
  BiWeekly = "biweekly",
  WeekDays = "weekdays",
}

export const DurationUnitMapping = {
  annual: DurationUnit.Years,
  biannual: DurationUnit.BiAnnual,
  bimonthly: DurationUnit.BiMonthly,
  biweekly: DurationUnit.BiWeekly,
  biyearly: DurationUnit.BiAnnual,
  daily: DurationUnit.Days,
  days: DurationUnit.Days,
  day: DurationUnit.Days,
  d: DurationUnit.Days,
  fortnight: DurationUnit.BiWeekly,
  hours: DurationUnit.Hours,
  hour: DurationUnit.Hours,
  hrs: DurationUnit.Hours,
  hr: DurationUnit.Hours,
  h: DurationUnit.Hours,
  minutes: DurationUnit.Minutes,
  mins: DurationUnit.Minutes,
  min: DurationUnit.Minutes,
  monthly: DurationUnit.Months,
  months: DurationUnit.Months,
  month: DurationUnit.Months,
  mnths: DurationUnit.Months,
  mths: DurationUnit.Months,
  mth: DurationUnit.Months,
  mos: DurationUnit.Months,
  mo: DurationUnit.Months,
  quarterly: DurationUnit.Quarters,
  quarters: DurationUnit.Quarters,
  qrtrs: DurationUnit.Quarters,
  qtrs: DurationUnit.Quarters,
  qtr: DurationUnit.Quarters,
  q: DurationUnit.Quarters,
  seconds: DurationUnit.Seconds,
  secs: DurationUnit.Seconds,
  sec: DurationUnit.Seconds,
  s: DurationUnit.Seconds,
  semiannual: DurationUnit.SemiAnnual,
  sennight: DurationUnit.BiWeekly,
  weekdays: DurationUnit.WeekDays,
  weekly: DurationUnit.Weeks,
  weeks: DurationUnit.Weeks,
  week: DurationUnit.Weeks,
  wks: DurationUnit.Weeks,
  wk: DurationUnit.Weeks,
  w: DurationUnit.Weeks,
  Years: DurationUnit.Years,
  years: DurationUnit.Years,
  year: DurationUnit.Years,
  yrs: DurationUnit.Years,
  yr: DurationUnit.Years,
  y: DurationUnit.Years,
};

export class Duration {
  private count: number;
  private unit: keyof typeof DurationUnitMapping;

  public constructor(quantity: number, unit: DurationUnit | keyof typeof DurationUnitMapping) {
    this.count = quantity;
    this.unit = unit;
  }

  public get quantity(): number {
    return this.count;
  }

  public get units(): DurationUnit {
    return DurationUnitMapping[this.unit];
  }

  public get rawUnits(): keyof typeof DurationUnitMapping {
    return this.unit;
  }
}