import { expect as jestExpect } from "@jest/globals";
import diff from "jest-diff";
import { DateTime } from "luxon";

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const matchers = {
  toEqualDate(
    this: jest.MatcherContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    received: any,
    expected: DateTime,
  ): jest.CustomMatcherResult {
    if (!(received instanceof DateTime)) {
      received = DateTime.fromISO(received);
    }
    let receivedAsString = received.toUTC().toISO();
    let expectedAsString = expected.toUTC().toISO();

    const pass = receivedAsString == expectedAsString;

    const message = pass ?
      (): string =>
        `${this.utils.matcherHint(".not.toBe")}\n\n` +
          "Expected date to not be same date as:\n" +
          `  ${this.utils.printExpected(expectedAsString)}\n` +
          "Received:\n" +
          `  ${this.utils.printReceived(receivedAsString)}` :
      (): string => {
        const diffString = diff(expectedAsString, receivedAsString, {
          expand: this.expand,
        });
        return `${this.utils.matcherHint(".toBe")}\n\n` +
            "Expected value to be (using ===):\n" +
            `  ${this.utils.printExpected(expectedAsString)}\n` +
            "Received:\n" +
            `  ${this.utils.printReceived(receivedAsString)}${diffString ?
              `\n\nDifference:\n\n${diffString}` :
              ""}`;
      };
    return { message, pass };
  },

  toBeCloseToDate(
    this: jest.MatcherContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    received: any,
    expected: DateTime = DateTime.local(),
    maxOffset: number = 60,
  ): jest.CustomMatcherResult {
    if (!(received instanceof DateTime)) {
      received = DateTime.fromISO(received);
    }
    let receivedAsString = received.toUTC().toISO();
    let expectedAsString = expected.toUTC().toISO();

    const pass = Math.abs(received.toSeconds() - expected.toSeconds()) <= maxOffset;

    const message = pass ?
      (): string =>
        `${this.utils.matcherHint(".not.toBe")}\n\n` +
          "Expected dates to not be close:\n" +
          `  ${this.utils.printExpected(expectedAsString)}\n` +
          "Received:\n" +
          `  ${this.utils.printReceived(receivedAsString)}` :
      (): string => {
        const diffString = diff(expectedAsString, receivedAsString, {
          expand: this.expand,
        });
        return `${this.utils.matcherHint(".toBe")}\n\n` +
            "Expected dates to be close:\n" +
            `  ${this.utils.printExpected(expectedAsString)}\n` +
            "Received:\n" +
            `  ${this.utils.printReceived(receivedAsString)}${diffString ?
              `\n\nDifference:\n\n${diffString}` :
              ""}`;
      };
    return { message, pass };
  },
};

jestExpect.extend(matchers);
export const expect = jestExpect as unknown as jest.ExtendedExpect<typeof matchers>;
