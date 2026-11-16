import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowDown, ArrowUp, Baby, ChevronLeft, ChevronRight, Clock, Droplets, FilePlus2, GripVertical, Heart, ImagePlus, Loader2, Mail, MapPin,
  Phone, Plus, Trash2, X,
  Menu,
} from "lucide-react";
import { useSite } from "@/lib/site-content";
import { EditableImage, EditableText, RadiusButton, useImageRadius } from "@/components/editable";
import { AdminBar } from "@/components/admin-bar";
import { ChatWidget } from "@/components/chat-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import logo from "@/assets/donkey-logo.png";
import { FlexibleSection, SectionSettingsButton, sectionStyle, type SectionSettings } from "@/components/section-editor";
import { BuilderButton, BuilderSocialLinks } from "@/components/builder-actions";
import { PostIntro, PostsBlock } from "@/components/posts";
import { MenuEditor, type MenuTarget } from "@/components/menu-editor";
import { availableSectionLinks, defaultSectionLinks, sectionAnchor, type SectionMenuLink } from "@/lib/menu-links";

export type Block = { id: string; type: string };
export type PageInfo = { slug: string; inMenu?: boolean };

const BUILTIN: Record<string, string> = {
  hero: "Glavna slika (naslovna)",
  story: "Naša priča",
  milk: "Mlijeko",
  education: "Edukacije",
  visits: "Posjete",
  apartments: "Apartmani",
  chat: "Asistent (chat)",
  contact: "Kontakt",
};
const CUSTOM: Record<string, string> = {
  section: "Sekcija 100% sa blokovima",
  text: "Tekst",
  textImage: "Tekst sa slikom",
  gallery: "Galerija slika",
  posts: "Novosti / objave",
};
const HOME_DEFAULT: Block[] = Object.keys(BUILTIN).map((t) => ({ id: t, type: t }));

const newId = () => Math.random().toString(36).slice(2, 10);
export const layoutKey = (slug: string) => `layout:${slug}`;

async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Slika se ne može obraditi");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

export function SitePage({ slug }: { slug: string }) {
  const { json, save, editMode } = useSite();
  const blocks = json<Block[]>(layoutKey(slug), slug === "home" ? HOME_DEFAULT : slug.startsWith("post-") ? [{ id: `postintro-${slug.slice(5)}`, type: "postIntro" }] : []);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const persist = async (next: Block[]) => {
    try {
      await save({ [layoutKey(slug)]: JSON.stringify(next) });
    } catch (e) {
      toast.error("Greška: " + (e as Error).message);
    }
  };
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [b] = next.splice(from, 1);
    if (!b) return;
    next.splice(to, 0, b);
    persist(next);
  };
  const remove = (i: number) => {
    if (!confirm("Obrisati ovaj blok?")) return;
    persist(blocks.filter((_, j) => j !== i));
  };
  const add = (type: string) => {
    const id = BUILTIN[type] ? type : newId();
    persist([...blocks, { id, type }]);
    toast.success("Blok dodat na dno stranice");
  };

  const heroFirst = blocks[0]?.type === "hero";

  return (
    <div className="min-h-screen">
      <SiteHeader overlay={heroFirst} slug={slug} blocks={blocks} />
      {blocks.map((b, i) => (
        <div
          key={b.id}
          id={sectionAnchor(b.id)}
          data-menu-section
          data-block-type={b.type}
          data-anchor={json<SectionSettings | null>(`section-style:${b.id}`, null)?.anchor || undefined}
          className={cn("relative", json<SectionSettings | null>(`section-style:${b.id}`, null) && b.type !== "section" && "builder-configured", editMode && "group/block", dragOver === i && dragFrom !== i && "ring-4 ring-edit ring-inset")}
          style={(() => { const settings = json<SectionSettings | null>(`section-style:${b.id}`, null); return settings && b.type !== "section" ? sectionStyle(settings) : undefined; })()}
          onDragOver={(e) => {
            if (dragFrom === null) return;
            e.preventDefault();
            setDragOver(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragFrom !== null) move(dragFrom, i);
            setDragFrom(null);
            setDragOver(null);
          }}
        >
          {editMode && (
            <div className={cn("absolute left-4 z-40 flex items-center gap-1 rounded-full bg-edit p-1 text-edit-foreground shadow-lg", heroFirst && i === 0 ? "top-24" : "top-4")}>
              <span
                draggable
                onDragStart={(e) => {
                  setDragFrom(i);
                  const el = e.currentTarget.closest(".group\\/block") as HTMLElement | null;
                  if (el) e.dataTransfer.setDragImage(el, 20, 20);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
                className="flex cursor-grab items-center gap-1 rounded-full px-2 py-1 text-xs font-medium active:cursor-grabbing"
                title="Prevuci da promijeniš redosled"
              >
                <GripVertical className="size-4" /> {BUILTIN[b.type] ?? CUSTOM[b.type] ?? b.type}
              </span>
              <IconBtn title="Pomjeri gore" onClick={() => move(i, i - 1)} disabled={i === 0}><ArrowUp className="size-4" /></IconBtn>
              <IconBtn title="Pomjeri dolje" onClick={() => move(i, i + 1)} disabled={i === blocks.length - 1}><ArrowDown className="size-4" /></IconBtn>
              <SectionSettingsButton id={b.id} />
              <IconBtn title="Obriši blok" onClick={() => remove(i)}><Trash2 className="size-4" /></IconBtn>
            </div>
          )}
          <RenderBlock block={b} />
        </div>
      ))}

      {editMode && (
        <div className="mx-auto flex max-w-6xl justify-center px-6 py-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" className="bg-edit text-edit-foreground hover:bg-edit/90">
                <Plus /> Dodaj novi blok
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Novi blok</DropdownMenuLabel>
              {Object.entries(CUSTOM).map(([t, l]) => (
                <DropdownMenuItem key={t} onClick={() => add(t)}>{l}</DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Postojeće sekcije</DropdownMenuLabel>
              {Object.entries(BUILTIN)
                .filter(([t]) => !blocks.some((b) => b.type === t))
                .map(([t, l]) => (
                  <DropdownMenuItem key={t} onClick={() => add(t)}>{l}</DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {blocks.length === 0 && !editMode && <div className="py-40" />}

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <EditableText k="footer.text" />
        </span>
        <BuilderSocialLinks id="footer" />
      </footer>
      <ChatWidget />
      <AdminBar />
    </div>
  );
}

function IconBtn({ children, ...p }: { children: ReactNode; title: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" {...p} className="rounded-full p-1.5 hover:bg-edit-foreground/20 disabled:opacity-40">
      {children}
    </button>
  );
}

function SiteHeader({ overlay, slug, blocks }: { overlay: boolean; slug: string; blocks: Block[] }) {
  const { lang, setLang, editMode, save, json, t, textFor } = useSite();
  const links = availableSectionLinks(json<SectionMenuLink[]>(`menu:${slug}`, defaultSectionLinks(blocks, textFor)), blocks);
  const targets: MenuTarget[] = blocks.map((block, index) => {
    const columns = json<{ elements: { id: string; type: string }[] }[]>(`section:${block.id}`, []);
    const titleElement = columns.flatMap((column) => column.elements).find((el) => el.type === "title");
    const title = block.type === "section" ? (titleElement ? t(`element.${titleElement.id}`) : "") : t(BUILTIN[block.type] ? `${block.type}.title` : `blk.${block.id}.title`);
    return { ...block, label: `${index + 1}. ${title || BUILTIN[block.type] || CUSTOM[block.type] || block.type}` };
  });
  const pages = json<PageInfo[]>("pages", []);
  const [pagesOpen, setPagesOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [overlay]);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const update = () => document.documentElement.style.setProperty("--site-menu-offset", `${header.getBoundingClientRect().height + 16}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty("--site-menu-offset"); };
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const solid = !overlay || scrolled || menuOpen;
  const removeBrand = async () => {
    await save({ "t:brand.name:sr": "", "t:brand.name:en": "" });
    toast.success("Tekst pored logoa obrisan");
  };
  return (
    <header
      ref={headerRef}
      className={cn(
        "inset-x-0 top-0 z-50 transition-[background-color,color,box-shadow,border-color] duration-300",
        overlay ? (scrolled ? "fixed" : "absolute") : "sticky",
        solid ? "border-b border-border/70 bg-menu-background text-menu-foreground shadow-sm" : "text-hero-foreground",
      )}
    >
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 md:py-5">
        <div className="flex min-w-0 items-center gap-2">
          {editMode ? (
            <EditableImage k="logo" alt="Logo" fallback={logo} compact eager wrapperClassName="w-10 shrink-0" />
          ) : (
            <Link to="/" aria-label="Početna stranica" className="w-10 shrink-0">
              <EditableImage k="logo" alt="Logo" fallback={logo} eager />
            </Link>
          )}
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <EditableText k="brand.name" className="truncate font-display text-lg font-semibold sm:text-xl" />
          </Link>
          {editMode && (
            <button type="button" onClick={removeBrand} title="Obriši tekst pored logoa" className="rounded-full bg-edit p-1.5 text-edit-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? "Zatvori meni" : "Otvori meni"} aria-expanded={menuOpen} className="shrink-0 rounded-md p-2 md:hidden">
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
        <div onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setMenuOpen(false); }} className={cn("w-full flex-col items-start gap-4 pb-2 text-base md:flex md:w-auto md:flex-row md:flex-wrap md:items-center md:gap-5 md:pb-0 md:text-sm", menuOpen ? "flex" : "hidden")}>
          {slug !== "home" && <Link to="/"><EditableText k="nav.home" /></Link>}
          {links.map((link) => slug === "home" ? (
            <Link key={link.id} to="/" hash={sectionAnchor(link.sectionId)} className="break-words hover:underline">{link[lang] || link.sr || link.en}</Link>
          ) : (
            <Link key={link.id} to="/p/$slug" params={{ slug }} hash={sectionAnchor(link.sectionId)} className="break-words hover:underline">{link[lang] || link.sr || link.en}</Link>
          ))}
          {editMode && <MenuEditor slug={slug} links={links} targets={targets} />}
          {pages.filter((p) => p.inMenu !== false).map((p) => (
            <Link key={p.slug} to="/p/$slug" params={{ slug: p.slug }} activeProps={{ className: "underline underline-offset-4" }}>
              <EditableText k={`page.${p.slug}.title`} />
            </Link>
          ))}
          {editMode && (
            <button type="button" onClick={() => setPagesOpen(true)} className="inline-flex items-center gap-1 rounded-full bg-edit px-3 py-1 text-xs font-medium text-edit-foreground">
              <FilePlus2 className="size-3.5" /> Stranice
            </button>
          )}
          <div className={cn("flex rounded-full border p-0.5 text-xs", solid ? "border-border" : "border-hero-foreground/40")}>
            {(["sr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn("rounded-full px-3 py-1 uppercase", lang === l && (solid ? "bg-menu-foreground text-menu-background" : "bg-hero-foreground text-foreground"))}
              >
                {l === "sr" ? "ME" : "EN"}
              </button>
            ))}
          </div>
        </div>
      </nav>
      {editMode && <PagesDialog open={pagesOpen} onOpenChange={setPagesOpen} />}
    </header>
  );
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "dj")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function PagesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { json, save, t } = useSite();
  const navigate = useNavigate();
  const pages = json<PageInfo[]>("pages", []);
  const toggleMenu = (slug: string) =>
    save({ pages: JSON.stringify(pages.map((p) => p.slug === slug ? { ...p, inMenu: p.inMenu === false } : p)) }).catch((e) => toast.error(e.message));
  const [sr, setSr] = useState("");
  const [en, setEn] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    const slug = slugify(sr || en);
    if (!slug) { toast.error("Upišite naziv stranice"); return; }
    if (pages.some((p) => p.slug === slug)) { toast.error("Stranica s tim nazivom već postoji"); return; }
    setBusy(true);
    try {
      await save({
        pages: JSON.stringify([...pages, { slug, inMenu: true }]),
        [`t:page.${slug}.title:sr`]: sr || en,
        [`t:page.${slug}.title:en`]: en || sr,
        [layoutKey(slug)]: JSON.stringify([{ id: newId(), type: "text" }]),
      });
      toast.success("Stranica napravljena i dodata u meni — dodajte blokove i sekcije dugmetom „Dodaj blok”");
      setSr(""); setEn("");
      onOpenChange(false);
      navigate({ to: "/p/$slug", params: { slug } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const del = async (slug: string) => {
    if (!confirm("Obrisati ovu stranicu?")) return;
    await save({ pages: JSON.stringify(pages.filter((p) => p.slug !== slug)) });
    toast.success("Stranica obrisana");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-foreground">
        <DialogHeader><DialogTitle>Stranice</DialogTitle></DialogHeader>
        <ul className="space-y-2">
          <li className="rounded-lg border px-3 py-2 text-sm">Početna (glavna stranica)</li>
          {pages.map((p) => (
            <li key={p.slug} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <Link to="/p/$slug" params={{ slug: p.slug }} onClick={() => onOpenChange(false)} className="hover:underline">
                {t(`page.${p.slug}.title`) || p.slug}
              </Link>
              <label className="ml-auto mr-2 flex items-center gap-2 text-xs"><Switch checked={p.inMenu !== false} onCheckedChange={() => toggleMenu(p.slug)} /> U meniju</label>
              <Button size="icon" variant="ghost" onClick={() => del(p.slug)} title="Obriši"><Trash2 /></Button>
            </li>
          ))}
        </ul>
        <div className="space-y-3 border-t pt-4">
          <p className="font-medium">Nova stranica</p>
          <div className="space-y-1"><Label>Naziv (crnogorski)</Label><Input value={sr} onChange={(e) => setSr(e.target.value)} placeholder="npr. Proizvodi" /></div>
          <div className="space-y-1"><Label>Naziv (English)</Label><Input value={en} onChange={(e) => setEn(e.target.value)} placeholder="e.g. Products" /></div>
        </div>
        <DialogFooter>
          <Button onClick={create} disabled={busy}>{busy && <Loader2 className="animate-spin" />} Dodaj stranicu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "section": return <FlexibleSection id={block.id} renderGallery={(id) => <GalleryBlock id={id} embedded />} />;
    case "hero": return <HeroBlock />;
    case "story": return <StoryBlock />;
    case "milk": return <MilkBlock />;
    case "education": return <InfoBlock id="education" anchor="edukacije" imageAlt="Edukacije na farmi" />;
    case "visits": return <InfoBlock id="visits" anchor="posjete" imageAlt="Posjeta farmi" reverse tinted />;
    case "apartments": return <InfoBlock id="apartments" anchor="apartmani" imageAlt="Apartmani na farmi" />;
    case "chat": return <ChatBlock />;
    case "contact": return <ContactBlock />;
    case "text": return <TextBlock id={block.id} />;
    case "textImage": return <TextImageBlock id={block.id} />;
    case "gallery": return <GalleryBlock id={block.id} />;
    case "posts": return <PostsBlock id={block.id} />;
    case "postIntro": return <PostIntro slug={block.id.replace(/^postintro-/, "")} />;
    default: return null;
  }
}

function HeroBlock() {
  const { textFor } = useSite();
  return (
    <section data-hero className="relative">
      <EditableImage k="hero" alt="Magarci na pašnjaku" eager wrapperClassName="col-start-1 row-start-1 w-full" className="builder-image-full" buttonClassName="z-30 top-24" />
      <div className="pointer-events-none absolute inset-0 hidden bg-hero-overlay sm:block" />
      <div className="relative z-10 mx-auto w-full max-w-6xl bg-olive px-5 py-8 text-olive-foreground sm:absolute sm:inset-x-0 sm:bottom-0 sm:bg-transparent sm:px-6 sm:py-0 sm:pb-10 sm:text-hero-foreground lg:pb-20">
        <EditableText k="hero.eyebrow" as="p" className="mb-2 text-xs uppercase opacity-90 sm:mb-4 sm:text-sm" />
        <EditableText k="hero.title" as="h1" className="max-w-3xl text-3xl font-semibold leading-[1.1] sm:text-5xl lg:text-7xl" />
        <EditableText k="hero.subtitle" as="p" className="mt-3 max-w-xl text-base opacity-90 sm:mt-6 sm:text-lg" />
        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
          <BuilderButton id="hero-cta" size="lg" className="w-full text-sm sm:w-auto sm:min-h-12 sm:px-8 sm:text-base" fallback={{ sr: textFor("hero.cta", "sr"), en: textFor("hero.cta", "en"), action: "chat", variant: "hero" }} />
          <BuilderButton id="hero-cta2" size="lg" className="w-full text-sm sm:w-auto sm:min-h-12 sm:px-8 sm:text-base" fallback={{ sr: textFor("hero.cta2", "sr"), en: textFor("hero.cta2", "en"), action: "link", target: "#prica", variant: "heroGhost" }} />
        </div>
      </div>
    </section>
  );
}

function StoryBlock() {
  return (
    <section id="prica" className="mx-auto grid max-w-6xl scroll-mt-24 gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
      <EditableImage k="story" alt="Ždrijebe na farmi" />
      <div>
        <EditableText k="story.eyebrow" as="p" className="text-sm font-medium uppercase tracking-[0.2em] text-primary" />
        <EditableText k="story.title" as="h2" className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl" />
        <EditableText k="story.p1" as="p" className="mt-6 text-lg leading-relaxed text-muted-foreground" />
        <EditableText k="story.p2" as="p" className="mt-4 text-lg leading-relaxed text-muted-foreground" />
        <div className="mt-10 grid grid-cols-3 gap-4 border-t pt-8">
          {[1, 2, 3].map((n) => (
            <div key={n}>
              <EditableText k={`stat${n}.value`} as="p" className="font-display text-4xl font-semibold text-primary" />
              <EditableText k={`stat${n}.label`} as="p" className="mt-1 text-sm text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MilkBlock() {
  return (
    <section id="mlijeko" className="scroll-mt-24 bg-olive py-24 text-olive-foreground">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:items-center">
        <div>
          <EditableText k="milk.eyebrow" as="p" className="text-sm uppercase tracking-[0.2em] opacity-80" />
          <EditableText k="milk.title" as="h2" className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl" />
          <EditableText k="milk.text" as="p" className="mt-6 text-lg leading-relaxed opacity-90" />
          <div className="mt-10 space-y-6">
            {[{ n: 1, Icon: Heart }, { n: 2, Icon: Droplets }, { n: 3, Icon: Baby }].map(({ n, Icon }) => (
              <div key={n} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-olive-foreground/15"><Icon className="size-5" /></span>
                <div>
                  <EditableText k={`b${n}.title`} as="h3" className="text-xl font-semibold" />
                  <EditableText k={`b${n}.text`} as="p" className="mt-1 opacity-85" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <EditableImage k="milk" alt="Boce magarećeg mlijeka" />
      </div>
    </section>
  );
}

function ChatBlock() {
  const { textFor } = useSite();
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center">
      <EditableImage k="logo" alt="" fallback={logo} wrapperClassName="mx-auto w-24" />
      <EditableText k="chat.title" as="h2" className="mt-6 text-4xl font-semibold" />
      <EditableText k="chat.text" as="p" className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground" />
      <div className="mt-8 flex justify-center"><BuilderButton id="chat-cta" size="lg" fallback={{ sr: textFor("hero.cta", "sr"), en: textFor("hero.cta", "en"), action: "chat", variant: "hero" }} /></div>
    </section>
  );
}

function ContactBlock() {
  return (
    <section id="kontakt" className="scroll-mt-24 bg-secondary py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2">
        <div>
          <EditableText k="contact.eyebrow" as="p" className="text-sm font-medium uppercase tracking-[0.2em] text-primary" />
          <EditableText k="contact.title" as="h2" className="mt-3 text-4xl font-semibold leading-tight" />
          <EditableText k="contact.text" as="p" className="mt-4 text-lg text-muted-foreground" />
        </div>
        <ul className="space-y-5 text-lg">
          {[
            { k: "contact.address", Icon: MapPin },
            { k: "contact.phone", Icon: Phone },
            { k: "contact.email", Icon: Mail },
            { k: "contact.hours", Icon: Clock },
          ].map(({ k, Icon }) => (
            <li key={k} className="flex items-center gap-4">
              <span className="flex size-11 items-center justify-center rounded-full bg-card text-primary"><Icon className="size-5" /></span>
              <EditableText k={k} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function InfoBlock({ id, anchor, imageAlt, reverse = false, tinted = false }: { id: string; anchor: string; imageAlt: string; reverse?: boolean; tinted?: boolean }) {
  return (
    <section id={anchor} className={cn("section-shadow scroll-mt-24 py-24", tinted ? "bg-card" : "bg-background")}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
        <EditableImage k={`${id}.img`} alt={imageAlt} wrapperClassName={cn(reverse && "md:order-2")} />
        <div className={cn(reverse && "md:order-1")}>
          <EditableText k={`${id}.eyebrow`} as="p" className="text-sm font-medium uppercase tracking-[0.2em] text-primary" />
          <EditableText k={`${id}.title`} as="h2" className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl" />
          <EditableText k={`${id}.text`} as="p" className="mt-6 whitespace-pre-line text-lg leading-relaxed text-muted-foreground" />
        </div>
      </div>
    </section>
  );
}

function TextBlock({ id }: { id: string }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <EditableText k={`blk.${id}.eyebrow`} as="p" className="text-sm font-medium uppercase tracking-[0.2em] text-primary" />
      <EditableText k={`blk.${id}.title`} as="h2" className="mt-3 text-4xl font-semibold leading-tight" />
      <EditableText k={`blk.${id}.text`} as="p" className="mt-6 whitespace-pre-line text-lg leading-relaxed text-muted-foreground" />
    </section>
  );
}

function TextImageBlock({ id }: { id: string }) {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center">
      <EditableImage k={`blk.${id}.img`} alt="" />
      <div>
        <EditableText k={`blk.${id}.eyebrow`} as="p" className="text-sm font-medium uppercase tracking-[0.2em] text-primary" />
        <EditableText k={`blk.${id}.title`} as="h2" className="mt-3 text-4xl font-semibold leading-tight" />
        <EditableText k={`blk.${id}.text`} as="p" className="mt-6 whitespace-pre-line text-lg leading-relaxed text-muted-foreground" />
      </div>
    </section>
  );
}

function GalleryBlock({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const { json, img, save, editMode, lang } = useSite();
  const listKey = `gal:${id}`;
  const items = json<string[]>(listKey, []);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<number | null>(null);
  const [limit, setLimit] = useState(9);
  const radius = useImageRadius();

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const entries: Record<string, string> = {};
      const ids: string[] = [];
      for (const f of Array.from(files)) {
        const iid = newId();
        entries[`img:gal.${id}.${iid}`] = await fileToDataUrl(f);
        ids.push(iid);
      }
      entries[listKey] = JSON.stringify([...items, ...ids]);
      await save(entries);
      toast.success("Slike dodate");
    } catch (e) {
      toast.error("Greška: " + (e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  const removeImg = async (iid: string) => {
    await save({ [listKey]: JSON.stringify(items.filter((x) => x !== iid)) });
  };
  const shown = editMode ? items : items.slice(0, limit);
  const go = (d: number) => setView((v) => (v === null ? v : (v + d + items.length) % items.length));

  useEffect(() => {
    if (view === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section className={embedded ? "min-w-0" : "mx-auto max-w-6xl px-6 py-20"}>
      {!embedded && <EditableText k={`blk.${id}.title`} as="h2" className="text-center text-4xl font-semibold" />}
      <div className={cn("columns-2 gap-4", !embedded && "mt-10 md:columns-3")}>
        {shown.map((iid, index) => (
          <GalleryItem key={iid} k={`gal.${id}.${iid}`} src={img(`gal.${id}.${iid}`)} radius={radius} editMode={editMode} onOpen={() => setView(index)} onRemove={() => removeImg(iid)} />
        ))}
        {editMode && (
          <button type="button" onClick={() => input.current?.click()} className="mb-4 flex aspect-square w-full break-inside-avoid flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-edit text-edit">
            {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            <span className="text-sm font-medium">Dodaj slike</span>
          </button>
        )}
      </div>
      {!editMode && items.length > limit && (
        <div className="mt-8 text-center"><Button variant="outline" onClick={() => setLimit((l) => l + 9)}>{lang === "en" ? "Show more" : "Prikaži više"}</Button></div>
      )}
      {editMode && <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />}
      {!editMode && items.length === 0 && <p className="mt-6 text-center text-muted-foreground">—</p>}
      <Dialog open={view !== null} onOpenChange={(v) => !v && setView(null)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
          <DialogHeader className="sr-only"><DialogTitle>Slika</DialogTitle></DialogHeader>
          {view !== null && items[view] && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex w-full items-center justify-center">
                <img src={img(`gal.${id}.${items[view]}`)} alt="" className="mx-auto block h-auto max-h-[80vh] w-auto max-w-full object-contain" />
                {items.length > 1 && <>
                  <Button size="icon" variant="secondary" aria-label="Prethodna slika" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow" onClick={() => go(-1)}><ChevronLeft /></Button>
                  <Button size="icon" variant="secondary" aria-label="Sljedeća slika" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow" onClick={() => go(1)}><ChevronRight /></Button>
                </>}
              </div>
              {items.length > 1 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {items.map((iid, i) => (
                    <button key={iid} type="button" aria-label={`Slika ${i + 1}`} onClick={() => setView(i)} className={cn("size-2.5 rounded-full bg-background/60 transition", i === view && "scale-125 bg-background")} />
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function GalleryItem({ k, src, radius, editMode, onOpen, onRemove }: { k: string; src: string; radius: (k: string) => number; editMode: boolean; onOpen: () => void; onRemove: () => void }) {
  return (
    <div className="relative mb-4 min-w-0 break-inside-avoid">
      <button type="button" className="block w-full" onClick={onOpen}>
        <img src={src} alt="" loading="lazy" className="block h-auto w-full" style={{ borderRadius: radius(k) }} />
      </button>
      {editMode && (
        <div className="absolute right-2 top-2 flex gap-1">
          <RadiusButton k={k} />
          <button type="button" onClick={onRemove} title="Obriši sliku" className="rounded-full bg-edit p-2 text-edit-foreground shadow">
            <Trash2 className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
