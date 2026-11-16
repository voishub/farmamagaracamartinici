import { createFileRoute } from "@tanstack/react-router";

// Serves an uploaded site image (stored as a data URL) as a cacheable binary file.
// Public on purpose: site images are already publicly readable content. Only `img:` keys are allowed.
export const Route = createFileRoute("/api/public/img/$key")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params.key;
        if (!key.startsWith("img:") || key.length > 200) return new Response("Not found", { status: 404 });
        const apiKey = process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
        const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
        if (!apiKey || !url) return new Response("Not configured", { status: 500 });
        const res = await fetch(`${url}/rest/v1/site_content?select=value&key=eq.${encodeURIComponent(key)}`, { headers: { apikey: apiKey } });
        if (!res.ok) return new Response("Error", { status: 502 });
        const rows = (await res.json()) as { value: string }[];
        const match = /^data:(image\/[a-z+.-]+);base64,(.*)$/s.exec(rows[0]?.value ?? "");
        if (!match?.[1] || !match[2]) return new Response("Not found", { status: 404 });
        const bin = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
        return new Response(bin, {
          headers: {
            "Content-Type": match[1] === "image/svg+xml" ? "application/octet-stream" : match[1],
            // URLs carry ?v=<updated_at>, so a changed image gets a new URL.
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
