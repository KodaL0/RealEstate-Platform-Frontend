import type { Developer, Project } from "../types";

/**
 * Generate a URL-friendly slug from a developer name
 */
export function generateDeveloperSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

export function generateProjectSlug(name: string): string {
  return generateDeveloperSlug(name);
}

/**
 * Generate the developer detail URL
 * Supports both ID-based and name-based URLs
 */
export function getDeveloperUrl(developer: Developer): string {
  // Use slug from API if available, otherwise generate from name
  const slug = developer.slug || generateDeveloperSlug(developer.name);
  return `/developers/${slug}`;
}

/**
 * Generate the developer detail URL with ID fallback
 */
export function getDeveloperUrlWithId(developer: Developer): string {
  const slug = generateDeveloperSlug(developer.name);
  return `/developers/${slug}`;
}

/**
 * Generate project URL under developer
 */
export function getProjectUrl(developer: Developer, project: Project): string {
  const orgSlug = developer.slug || generateDeveloperSlug(developer.name);
  const projectSlug = (project as { slug?: string }).slug || generateProjectSlug(project.name);
  return `/developers/${orgSlug}/${projectSlug}`;
}
