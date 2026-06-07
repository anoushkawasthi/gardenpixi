/**
 * EmailJS (browser) — TRD §11.1. Use `NEXT_PUBLIC_*` so values are available in the static client bundle.
 * Create a template with keys: `from_name`, `reply_to`, `message`, `source` (see `.docs/DEPENDENCIES_AND_SETUP.md`).
 */
export function getEmailJsPublicConfig(): {
  serviceId: string;
  templateId: string;
  publicKey: string;
} | null {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.trim() ?? "";
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID?.trim() ?? "";
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim() ?? "";
  if (!serviceId || !templateId || !publicKey) return null;
  return { serviceId, templateId, publicKey };
}

/** Optional `mailto:` target when EmailJS is not configured (Phase 9 mailbox fallback). */
export function getContactMailto(): string | null {
  const raw = process.env.NEXT_PUBLIC_CONTACT_MAILTO?.trim() ?? "";
  if (!raw) return null;
  return raw.replace(/^mailto:/i, "");
}
