export interface SearchableService {
  name: string;
  slug: string;
}

/**
 * Case-insensitive substring match against name or slug. A pure function
 * so the matching rule itself is unit-testable without a database - the
 * page just calls this on whatever listServicesWithActiveDeploy returned.
 */
export function filterServicesByQuery<T extends SearchableService>(services: T[], query: string): T[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === "") return services;
  return services.filter(
    (service) => service.name.toLowerCase().includes(trimmed) || service.slug.toLowerCase().includes(trimmed)
  );
}
