import { describe, expect, it } from "vitest";
import { estimateFleetMonthlyCost, estimateMonthlyCost, PRICING } from "./estimate";

describe("estimateMonthlyCost", () => {
  it("computes cpu and memory cost independently and sums them", () => {
    // 1 vCPU, 1 GB, for a full average month
    const estimate = estimateMonthlyCost(1000, 1024);
    const expectedCpu = Math.round(1 * PRICING.usdPerVCpuHour * PRICING.hoursPerMonth * 100) / 100;
    const expectedMem = Math.round(1 * PRICING.usdPerGbMemoryHour * PRICING.hoursPerMonth * 100) / 100;
    expect(estimate.cpuCostUsd).toBeCloseTo(expectedCpu, 2);
    expect(estimate.memoryCostUsd).toBeCloseTo(expectedMem, 2);
    expect(estimate.totalUsd).toBeCloseTo(expectedCpu + expectedMem, 2);
  });

  it("scales linearly with the declared request", () => {
    const small = estimateMonthlyCost(250, 512);
    const double = estimateMonthlyCost(500, 1024);
    expect(double.totalUsd).toBeCloseTo(small.totalUsd * 2, 1);
  });

  it("is zero for a zero request", () => {
    const estimate = estimateMonthlyCost(0, 0);
    expect(estimate).toEqual({ cpuCostUsd: 0, memoryCostUsd: 0, totalUsd: 0 });
  });

  it("rounds to the nearest cent", () => {
    const estimate = estimateMonthlyCost(37, 91);
    expect(Number.isInteger(estimate.totalUsd * 100)).toBe(true);
  });
});

describe("estimateFleetMonthlyCost", () => {
  it("sums cost across multiple services", () => {
    const services = [
      { cpuRequestMilli: 250, memoryRequestMb: 512 },
      { cpuRequestMilli: 500, memoryRequestMb: 1024 },
    ];
    const fleet = estimateFleetMonthlyCost(services);
    const individual = services.map((s) => estimateMonthlyCost(s.cpuRequestMilli, s.memoryRequestMb));
    const expectedTotal = individual.reduce((sum, e) => sum + e.totalUsd, 0);
    expect(fleet.totalUsd).toBeCloseTo(expectedTotal, 2);
  });

  it("returns all zeros for an empty fleet", () => {
    expect(estimateFleetMonthlyCost([])).toEqual({ cpuCostUsd: 0, memoryCostUsd: 0, totalUsd: 0 });
  });
});
