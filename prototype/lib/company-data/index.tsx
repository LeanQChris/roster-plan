// Barrel re-export — keeps `@/lib/company-data` resolving to this directory
// with zero import-path changes for existing consumers.
export * from "./types";
export { CompanyProvider, useCompany } from "./context";
