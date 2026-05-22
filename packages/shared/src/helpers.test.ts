import { describe, expect, it } from "vitest";
import {
  calculateRemainingAmount,
  formatMoneyMinor,
  getAppointmentComputedStatus,
  isSalaryAppointment,
  sumSalary
} from "./helpers.js";

const now = new Date("2026-05-22T10:00:00.000Z");

describe("appointment helpers", () => {
  it("computes scheduled, completed and cancelled statuses", () => {
    expect(getAppointmentComputedStatus({ status: "scheduled", startsAt: "2026-05-23T10:00:00.000Z" }, now)).toBe("scheduled");
    expect(getAppointmentComputedStatus({ status: "scheduled", startsAt: "2026-05-21T10:00:00.000Z" }, now)).toBe("completed");
    expect(getAppointmentComputedStatus({ status: "cancelled", startsAt: "2026-05-21T10:00:00.000Z" }, now)).toBe("cancelled");
  });

  it("includes only completed work appointments in salary", () => {
    expect(isSalaryAppointment({ type: "work", status: "scheduled", startsAt: "2026-05-21T10:00:00.000Z", sessionAmount: 100000 }, now)).toBe(true);
    expect(isSalaryAppointment({ type: "personal", status: "scheduled", startsAt: "2026-05-21T10:00:00.000Z", sessionAmount: 100000 }, now)).toBe(false);
    expect(isSalaryAppointment({ type: "work", status: "cancelled", startsAt: "2026-05-21T10:00:00.000Z", sessionAmount: 100000 }, now)).toBe(false);
  });

  it("calculates remaining amount without storing it", () => {
    expect(calculateRemainingAmount({ sessionAmount: 120000, prepaymentAmount: 50000 })).toBe(70000);
    expect(calculateRemainingAmount({ sessionAmount: 120000, prepaymentAmount: 120000 })).toBe(0);
  });

  it("sums salary in minor units", () => {
    expect(
      sumSalary(
        [
          { type: "work", status: "scheduled", startsAt: "2026-05-21T10:00:00.000Z", sessionAmount: 100000 },
          { type: "personal", status: "scheduled", startsAt: "2026-05-21T10:00:00.000Z", sessionAmount: 100000 },
          { type: "work", status: "scheduled", startsAt: "2026-05-23T10:00:00.000Z", sessionAmount: 100000 }
        ],
        now
      )
    ).toBe(100000);
  });

  it("formats minor money amounts", () => {
    expect(formatMoneyMinor(150000)).toContain("1");
  });
});

