import { createFileRoute } from "@tanstack/react-router";
import { SiteProvider, contentQuery } from "@/lib/site-content";
import { SitePage } from "@/components/page-builder";
import { postLayoutSlug } from "@/components/posts";

export const Route = createFileRoute("/novosti/$slug")({
  loader: async ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  head: ({ params, loaderData }) => {
    const name = loaderData?.[`t:post.${params.slug}.title:sr`] ?? params.slug;
    const excerpt = loaderData?.[`t:post.${params.slug}.excerpt:sr`] ?? "Novosti sa farme magarica.";
    const title = `${name} — Farma Magarica`;
    return {
      meta: [
        { title },
        { name: "description", content: excerpt },
        { property: "og:title", content: title },
        { property: "og:description", content: excerpt },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: PostRoute,
});

function PostRoute() {
  const { slug } = Route.useParams();
  return (
    <SiteProvider>
      <SitePage key={slug} slug={postLayoutSlug(slug)} />
    </SiteProvider>
  );
}
