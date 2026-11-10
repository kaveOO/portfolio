import { getCollection, type CollectionEntry } from 'astro:content';
import { url } from './paths';

export type Project = CollectionEntry<'projects'>;

/** Published case studies in `order`. Drafts are included in dev only. */
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects', ({ data }) => import.meta.env.DEV || !data.draft);
  return projects.sort((a, b) => a.data.order - b.data.order);
}

export const projectUrl = (project: Project) => url(`/work/${project.id}/`);
