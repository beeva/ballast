import { describe, expect, it } from "vitest";
import { filterServicesByQuery } from "./search";

const services = [
  { name: "Checkout API", slug: "checkout-api" },
  { name: "Sample Service", slug: "sample-service" },
  { name: "Failing Service", slug: "failing-service" },
];

describe("filterServicesByQuery", () => {
  it("returns every service for an empty query", () => {
    expect(filterServicesByQuery(services, "")).toEqual(services);
  });

  it("returns every service for a whitespace-only query", () => {
    expect(filterServicesByQuery(services, "   ")).toEqual(services);
  });

  it("matches by name, case-insensitively", () => {
    expect(filterServicesByQuery(services, "CHECKOUT")).toEqual([services[0]]);
  });

  it("matches by slug", () => {
    expect(filterServicesByQuery(services, "sample-serv")).toEqual([services[1]]);
  });

  it("matches a substring in the middle, not just a prefix", () => {
    expect(filterServicesByQuery(services, "service")).toEqual([services[1], services[2]]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterServicesByQuery(services, "does-not-exist")).toEqual([]);
  });
});
