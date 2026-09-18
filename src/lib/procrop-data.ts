/**
 * ProCrop Data Layer (Compatibility Re-export Barrel)
 *
 * Modularized Architecture:
 * - Domain Models & Interfaces: `@/types`
 * - Static Mock Datasets:       `@/data`
 * - Agronomy & Data Services:   `@/services`
 * - Utility Formatters:         `@/utils`
 *
 * This barrel guarantees that any existing imports from `@/lib/procrop-data`
 * continue to function without breakage while new code imports directly
 * from their dedicated domain modules.
 */

export * from "@/types";
export * from "@/data";
export * from "@/services";
export * from "@/utils";
