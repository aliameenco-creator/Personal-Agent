import { DescriptionTemplate } from '../../types/youtube';

const STORAGE_KEY = 'brandify_yt_templates';

export function getTemplates(profileId?: string): DescriptionTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const templates: DescriptionTemplate[] = stored ? JSON.parse(stored) : [];
    if (profileId) {
      return templates.filter(t => t.profileId === profileId);
    }
    return templates;
  } catch {
    return [];
  }
}

export function saveTemplate(template: DescriptionTemplate): void {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === template.id);
  if (index >= 0) {
    templates[index] = { ...template, updatedAt: Date.now() };
  } else {
    templates.push(template);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}
