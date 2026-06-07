"use client";

import { useCallback, useState } from "react";
import { z } from "zod";
import { trackContactError, trackContactSubmit } from "../../analytics/plausible";
import { getContactMailto, getEmailJsPublicConfig } from "../../config/contactEmail";

const schema = z.object({
  fromName: z.string().trim().min(1, "Name is required").max(120),
  replyTo: z.string().trim().email("Valid email required").max(254),
  message: z.string().trim().min(10, "Message — at least a few words").max(8000),
});

type FormStatus = "idle" | "submitting" | "success" | "error";

type Props = {
  onClose: () => void;
};

/** Honeypot field name — leave empty in EmailJS template; bots often fill hidden fields. */
const HONEYPOT_NAME = "company_website";

export function ContactForm({ onClose }: Props) {
  const configured = getEmailJsPublicConfig() !== null;
  const mailtoFallback = getContactMailto();

  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);

  const resetFields = useCallback(() => {
    setFromName("");
    setReplyTo("");
    setMessage("");
    setHoneypot("");
  }, []);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (status === "submitting") return;

      // Honeypot: silent success — no email, no analytics (TRD default).
      if (honeypot.trim() !== "") {
        setStatus("success");
        setErrorText(null);
        resetFields();
        return;
      }

      const parsed = schema.safeParse({ fromName, replyTo, message });
      if (!parsed.success) {
        const first = parsed.error.flatten().fieldErrors;
        const msg =
          first.fromName?.[0] ?? first.replyTo?.[0] ?? first.message?.[0] ?? "Check the form.";
        setErrorText(msg);
        setStatus("error");
        return;
      }

      const cfg = getEmailJsPublicConfig();
      if (!cfg) {
        setErrorText("Contact is not configured yet (missing EmailJS env vars).");
        setStatus("error");
        trackContactError({ reason: "not_configured" });
        return;
      }

      setStatus("submitting");
      setErrorText(null);

      try {
        const emailjs = (await import("@emailjs/browser")).default;
        await emailjs.send(
          cfg.serviceId,
          cfg.templateId,
          {
            from_name: parsed.data.fromName,
            reply_to: parsed.data.replyTo,
            message: parsed.data.message,
            source: "pixel-garden",
          },
          { publicKey: cfg.publicKey },
        );
        trackContactSubmit();
        setStatus("success");
        resetFields();
      } catch (err) {
        console.error(err);
        trackContactError({ reason: "emailjs_send" });
        setStatus("error");
        setErrorText("Could not send right now. Try again later or use your mail client.");
      }
    },
    [fromName, replyTo, message, honeypot, status, resetFields],
  );

  if (status === "success") {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-ui-text/90" role="status">
          Thanks — your message is on its way. I&apos;ll get back to you soon.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="font-pixel rounded border-2 border-ui-text/35 px-3 py-2 text-[8px] text-ui-text hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[9px]"
            onClick={() => {
              setStatus("idle");
              onClose();
            }}
          >
            Close
          </button>
          <button
            type="button"
            className="font-pixel rounded border-2 border-dashed border-ui-text/30 px-3 py-2 text-[8px] text-ui-text/80 hover:border-accent sm:text-[9px]"
            onClick={() => setStatus("idle")}
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="relative space-y-4" onSubmit={submit} noValidate>
      <p className="text-sm leading-relaxed text-ui-text/85">
        Mailbox from the garden — drop a note and I&apos;ll reply by email.
      </p>

      {!configured && (
        <div className="space-y-2 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-ui-text">
          <p>
            EmailJS is not configured (set{" "}
            <code className="rounded bg-ui-text/10 px-1 text-xs">NEXT_PUBLIC_EMAILJS_*</code> in{" "}
            <code className="rounded bg-ui-text/10 px-1 text-xs">.env.local</code>).
          </p>
          {mailtoFallback ? (
            <p>
              <a
                href={`mailto:${mailtoFallback}?subject=${encodeURIComponent("Hello from The Pixel Garden")}`}
                className="font-pixel inline-flex min-h-[44px] items-center rounded border-2 border-ui-text/35 bg-ui-bg px-3 py-2 text-[8px] uppercase tracking-wide text-ui-text underline-offset-2 hover:border-accent hover:underline sm:text-[9px]"
              >
                Open mail — {mailtoFallback}
              </a>
            </p>
          ) : (
            <p className="text-ui-text/85">
              Optionally set <code className="rounded bg-ui-text/10 px-1 text-xs">NEXT_PUBLIC_CONTACT_MAILTO</code>{" "}
              for a one-click mail link here.
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="contact-name" className="block text-xs font-medium text-ui-text/90">
          Name
        </label>
        <input
          id="contact-name"
          name="from_name"
          type="text"
          autoComplete="name"
          required
          disabled={!configured || status === "submitting"}
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          className="w-full rounded border-2 border-ui-text/25 bg-ui-bg px-3 py-2 text-sm text-ui-text outline-none ring-accent/40 focus:border-accent focus:ring-2 disabled:opacity-60"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-email" className="block text-xs font-medium text-ui-text/90">
          Email
        </label>
        <input
          id="contact-email"
          name="reply_to"
          type="email"
          autoComplete="email"
          required
          disabled={!configured || status === "submitting"}
          value={replyTo}
          onChange={(e) => setReplyTo(e.target.value)}
          className="w-full rounded border-2 border-ui-text/25 bg-ui-bg px-3 py-2 text-sm text-ui-text outline-none ring-accent/40 focus:border-accent focus:ring-2 disabled:opacity-60"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="block text-xs font-medium text-ui-text/90">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          disabled={!configured || status === "submitting"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-y rounded border-2 border-ui-text/25 bg-ui-bg px-3 py-2 text-sm text-ui-text outline-none ring-accent/40 focus:border-accent focus:ring-2 disabled:opacity-60"
        />
      </div>

      {/* Honeypot — hidden from users; bots often autofill. */}
      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor={HONEYPOT_NAME}>Company website</label>
        <input
          id={HONEYPOT_NAME}
          name={HONEYPOT_NAME}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {status === "error" && errorText && (
        <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-800" role="alert">
          {errorText}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-ui-text/15 pt-4">
        <button
          type="submit"
          disabled={!configured || status === "submitting"}
          className="font-pixel min-h-[44px] rounded border-2 border-ui-text/35 bg-accent/15 px-4 py-2 text-[8px] uppercase tracking-wide text-ui-text hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 sm:text-[9px]"
        >
          {status === "submitting" ? "Sending…" : "Send message"}
        </button>
        <button
          type="button"
          className="font-pixel min-h-[44px] rounded border-2 border-ui-text/25 px-3 py-2 text-[8px] text-ui-text/80 hover:border-ui-text/50 sm:text-[9px]"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
