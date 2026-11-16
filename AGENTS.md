<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Page texts/images live in `site_content` (keys `t:<key>:<sr|en>`, `img:<key>`); defaults in `src/lib/content-defaults.ts`. Why: mini page builder edits overrides only.
- Images are stored as compressed data URLs in the database (public storage buckets are blocked) but served to browsers as cacheable files via /api/public/img/$key?v=<updated_at>. Why: keep page data small so pages render fast.
- Editable images and gallery thumbnails use intrinsic sizing constrained by their container, and upload compression keeps pixel dimensions unchanged. Why: replacements must not be cropped, stretched, or automatically enlarged.
- Header image bounds come from the image, with content overlaid and editor outer spacing suppressed; logo upload controls sit outside navigation links and file inputs stop click propagation. Why: avoid image background bands and navigation interrupting uploads.
- Admin = `user_roles` row; first signup becomes admin via trigger. Why: single-owner site.
- Chatbot knowledge is one row in `knowledge_base`, injected whole into the system prompt in `src/lib/ai/chat.server.ts`. Why: single document, no retrieval needed.
- Page layouts are JSON block lists in site_content (`layout:<slug>`, page list in `pages`, gallery lists in `gal:<id>`), rendered by src/components/page-builder.tsx. Why: reuse the single content table for the page builder.
- Section menu entries live under `menu:<slug>` and target stable `section-<block id>` wrapper anchors, with scroll clearance measured from the header. Why: section reordering, replacements and different menu heights must not break navigation.
- Flexible sections store nested columns/elements under `section:<id>` and appearance under `section-style:<id>` / `text-style:<key>`; gap-aware wrapping flex rows align partial groups and stack on mobile. Columns carry per-side margins (marginTop/Right/Bottom/Left, negative allowed). Why: preserve percentage widths while allowing centered rows and free positioning without schema changes.
- Button and social elements use `button:<id>` and `social:<id>` content overrides, rendered by builder-actions with allowlisted URL schemes and predefined click actions. Why: keep editable interactions persistent without allowing arbitrary script execution.
