/**
 * Ballpark pricing modeled after a typical serverless-container price
 * (e.g. AWS Fargate on-demand, us-east-1, as of this writing) - not tied to
 * a live pricing API, but real per-unit rates rather than a made-up round
 * number, so the estimate is at least in the right neighborhood.
 */
export const PRICING = {
  usdPerVCpuHour: 0.04048,
  usdPerGbMemoryHour: 0.004445,
  hoursPerMonth: 730, // 365.25 days / 12 months * 24 hours, the standard "average month" figure
} as const;

export interface CostEstimate {
  cpuCostUsd: number;
  memoryCostUsd: number;
  totalUsd: number;
}

/**
 * Estimates the monthly cost of running one instance of a service
 * continuously at its declared resource request - not actual usage, which
 * this project has no way to measure without a real scheduler. Rounded to
 * cents; this is a planning estimate, not a bill.
 */
export function estimateMonthlyCost(cpuRequestMilli: number, memoryRequestMb: number): CostEstimate {
  const vCpus = cpuRequestMilli / 1000;
  const memoryGb = memoryRequestMb / 1024;

  const cpuCostUsd = round2(vCpus * PRICING.usdPerVCpuHour * PRICING.hoursPerMonth);
  const memoryCostUsd = round2(memoryGb * PRICING.usdPerGbMemoryHour * PRICING.hoursPerMonth);

  return { cpuCostUsd, memoryCostUsd, totalUsd: round2(cpuCostUsd + memoryCostUsd) };
}

export function estimateFleetMonthlyCost(
  services: Array<{ cpuRequestMilli: number; memoryRequestMb: number }>
): CostEstimate {
  return services.reduce<CostEstimate>(
    (total, service) => {
      const estimate = estimateMonthlyCost(service.cpuRequestMilli, service.memoryRequestMb);
      return {
        cpuCostUsd: round2(total.cpuCostUsd + estimate.cpuCostUsd),
        memoryCostUsd: round2(total.memoryCostUsd + estimate.memoryCostUsd),
        totalUsd: round2(total.totalUsd + estimate.totalUsd),
      };
    },
    { cpuCostUsd: 0, memoryCostUsd: 0, totalUsd: 0 }
  );
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
