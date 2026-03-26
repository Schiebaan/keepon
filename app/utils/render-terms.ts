/**
 * Replaces {{placeholder}} tokens in a template string with values from a record.
 * Falls back to [placeholder] if no value is found.
 */
export function renderTerms(template: string, placeholders: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return placeholders[key] || `[${key}]`
  })
}
