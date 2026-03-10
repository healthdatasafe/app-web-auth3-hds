/**
 * Load app settings from deploy-time settings.json, with env var override.
 * SERVICE_INFO_URL env var (set in .env.local) takes precedence.
 */
export async function loadSettings (): Promise<{ serviceInfoUrl: string }> {
  const envUrl = import.meta.env.SERVICE_INFO_URL || import.meta.env.VITE_SERVICE_INFO_URL;
  if (envUrl) return { serviceInfoUrl: envUrl };
  try {
    const res = await fetch('/settings.json');
    return await res.json();
  } catch {
    return { serviceInfoUrl: 'https://demo.datasafe.dev/reg/service/info' };
  }
}
