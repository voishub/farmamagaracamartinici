import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useSite } from "@/lib/site-content";
import { EditableImage, EditableText } from "@/components/editable";
import { Button } from "@/components/ui/button";

export type PostInfo = { slug: string; date: string; hidden?: boolean };

export const POSTS_KEY = "posts";
export const postLayoutSlug = (slug: string) => `post-${slug}`;

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "dj")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function usePosts() {
  const { json } = useSite();
  return json<PostInfo[]>(POSTS_KEY, []);
}

export function PostsBlock({ id }: { id: string }) {
  const { editMode, save, lang } = useSite();
  const all = usePosts();
  const posts = [...all.filter((p) => !p.hidden), ...all.filter((p) => p.hidden)];
  const shown = editMode ? posts : posts.filter((p) => !p.hidden);

  const create = async () => {
    const name = prompt("Naslov nove objave:");
    if (!name?.trim()) return;
    let slug = slugify(name) || Math.random().toString(36).slice(2, 8);
    while (posts.some((p) => p.slug === slug)) slug += "-1";
    try {
      await save({
        [POSTS_KEY]: JSON.stringify([{ slug, date: new Date().toISOString() }, ...posts]),
        [`t:post.${slug}.title:sr`]: name.trim(),
        [`t:post.${slug}.title:en`]: name.trim(),
        [`t:post.${slug}.excerpt:sr`]: "Kratak opis objave…",
        [`t:post.${slug}.excerpt:en`]: "Short post summary…",
      });
      toast.success("Objava kreirana — kliknite na naslov da otvorite i uredite tekst");
    } catch (e) { toast.error((e as Error).message); }
  };
  const persist = (next: PostInfo[]) => save({ [POSTS_KEY]: JSON.stringify(next) }).catch((e) => toast.error(e.message));
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= posts.length) return;
    const next = [...posts]; [next[i], next[j]] = [next[j]!, next[i]!]; persist(next);
  };
  const toggle = (slug: string) => {
    const cur = posts.find((p) => p.slug === slug); if (!cur) return;
    const rest = posts.filter((p) => p.slug !== slug);
    const updated = { ...cur, hidden: !cur.hidden };
    // Hidden (draft) posts go after all published ones; republished posts return to the end of the published list.
    const pub = rest.filter((p) => !p.hidden), drafts = rest.filter((p) => p.hidden);
    persist(updated.hidden ? [...pub, ...drafts, updated] : [...pub, updated, ...drafts]);
    toast.success(updated.hidden ? "Objava sakrivena (draft)" : "Objava ponovo prikazana");
  };
  const remove = (slug: string) => { if (confirm("Obrisati ovu objavu?")) persist(posts.filter((p) => p.slug !== slug)); };

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <EditableText k={`blk.${id}.title`} as="h2" className="mb-10 font-display text-4xl font-semibold" />
      {editMode && <Button className="mb-8" onClick={create}><Plus /> Nova objava</Button>}
      {shown.length === 0 && <p className="text-muted-foreground">{lang === "en" ? "No news yet." : "Još nema objava."}</p>}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p, i) => (
          <article key={p.slug} className={"relative" + (p.hidden ? " opacity-60" : "") + " overflow-hidden rounded-2xl border bg-card shadow-sm"}>
            {p.hidden && <span className="absolute right-3 top-3 z-20 rounded-full bg-edit px-3 py-1 text-xs font-medium text-edit-foreground">Skriveno (draft)</span>}
            <EditableImage k={`post.${p.slug}`} alt="" wrapperClassName="w-full" className="w-full" />
            <div className="space-y-3 p-6">
              <time className="text-xs uppercase tracking-wide text-muted-foreground">{new Date(p.date).toLocaleDateString(lang === "en" ? "en-GB" : "sr-Latn-ME")}</time>
              <h3 className="font-display text-2xl font-semibold leading-tight">
                <Link to="/novosti/$slug" params={{ slug: p.slug }} className="hover:underline">
                  <EditableText k={`post.${p.slug}.title`} />
                </Link>
              </h3>
              <EditableText k={`post.${p.slug}.excerpt`} as="p" className="text-muted-foreground" />
              {editMode && (
                <div className="flex gap-1 pt-2">
                  <Button size="icon-sm" variant="outline" onClick={() => move(i, -1)} aria-label="Lijevo"><ArrowLeft /></Button>
                  <Button size="icon-sm" variant="outline" onClick={() => move(i, 1)} aria-label="Desno"><ArrowRight /></Button>
                  <Button size="sm" variant="outline" onClick={() => toggle(p.slug)}>{p.hidden ? <><Eye /> Prikaži</> : <><EyeOff /> Sakrij</>}</Button>
                  <Button size="icon-sm" variant="outline" onClick={() => remove(p.slug)} aria-label="Obriši"><Trash2 /></Button>
                  <Button size="sm" variant="ghost" asChild><Link to="/novosti/$slug" params={{ slug: p.slug }}>Otvori</Link></Button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PostIntro({ slug }: { slug: string }) {
  const { lang, isAdmin } = useSite();
  const post = usePosts().find((p) => p.slug === slug);
  if (post?.hidden && !isAdmin)
    return <p className="mx-auto max-w-3xl px-6 py-32 text-center text-muted-foreground">{lang === "en" ? "This post is not available." : "Ova objava nije dostupna."}</p>;
  return (
    <article className="mx-auto max-w-3xl px-6 pt-16 pb-8">
      {post && <time className="text-sm uppercase tracking-wide text-muted-foreground">{new Date(post.date).toLocaleDateString(lang === "en" ? "en-GB" : "sr-Latn-ME")}</time>}
      <EditableText k={`post.${slug}.title`} as="h1" className="mt-2 block font-display text-4xl font-semibold sm:text-5xl" />
      <EditableImage k={`post.${slug}`} alt="" wrapperClassName="mt-8 w-full" className="w-full" />
      <EditableText k={`post.${slug}.body`} as="div" className="mt-8 block whitespace-pre-line text-lg leading-relaxed" />
    </article>
  );
}
