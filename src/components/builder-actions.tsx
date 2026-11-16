import { useState } from "react";
import { Clock, Facebook, Globe, Instagram, Mail, MapPin, MessageCircle, Phone, Plus, Trash2, Youtube, MousePointerClick, Settings2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useSite } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function safeBuilderLink(value: string): string | undefined {
  const link = value.trim();
  if (!link || /[\s\\\u0000-\u001f]/.test(link)) return undefined;
  if (link.startsWith("#") || (link.startsWith("/") && !link.startsWith("//"))) return link;
  try {
    const url = new URL(link);
    if (["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) return link;
  } catch { /* Invalid or unsupported link. */ }
  return undefined;
}

const anchorAliases: Record<string, string[]> = {
  prica: ["story", "section"], story: ["story", "section"], mlijeko: ["milk"], milk: ["milk"],
  edukacije: ["education"], education: ["education"], posjete: ["visits"], visits: ["visits"],
  apartmani: ["apartments"], apartments: ["apartments"], galerija: ["gallery"], gallery: ["gallery"],
  kontakt: ["contact"], contact: ["contact"], chat: ["chat"], asistent: ["chat"],
};

/** Finds the page element for a hash such as #prica, #galerija, #kontakt or #section-<id>. */
export function findAnchorTarget(hash: string): HTMLElement | null {
  const name = decodeURIComponent(hash.replace(/^#/, "")).trim();
  if (!name) return null;
  const direct = document.getElementById(name) ?? document.getElementById(`section-${name}`);
  if (direct) return direct;
  const lower = name.toLowerCase();
  const named = document.querySelector<HTMLElement>(`[data-anchor="${CSS.escape(lower)}"]`);
  if (named) return named;
  for (const type of anchorAliases[lower] ?? [lower]) {
    const el = document.querySelector<HTMLElement>(`[data-block-type="${CSS.escape(type)}"]`);
    if (el) return el;
  }
  const slug = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "dj").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const wanted = slug(name);
  // Menu labels: "#kontakt" matches the menu item named "Kontakt".
  for (const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="#section-"]'))) {
    if (slug(link.textContent ?? "") === wanted) {
      const el = document.getElementById(link.hash.slice(1));
      if (el) return el;
    }
  }
  // Section headings: "#prenocite" matches "Prenoćite na farmi".
  for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-menu-section]"))) {
    const words = slug(el.querySelector("h1,h2,h3")?.textContent ?? "").split("-");
    if (words.includes(wanted) || slug(el.querySelector("h1,h2,h3")?.textContent ?? "").startsWith(wanted)) return el;
  }
  return null;
}

export function scrollToAnchor(hash: string): boolean {
  const target = findAnchorTarget(hash);
  if (!target) return false;
  target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  history.replaceState(null, "", `#${hash.replace(/^#/, "")}`);
  return true;
}

type ButtonSettings = { sr: string; en: string; action: "link" | "chat" | "scroll"; target: string; newTab: boolean; variant: "default" | "outline" | "secondary" | "hero" | "heroGhost"; hideMobile?: boolean; hideTablet?: boolean };
const buttonDefaults: ButtonSettings = { sr: "Novo dugme", en: "New button", action: "link", target: "", newTab: false, variant: "default" };

export function BuilderButton({ id, fallback, className, size }: { id: string; fallback?: Partial<ButtonSettings>; className?: string; size?: "default" | "lg" }) {
  const { json, save, editMode, lang, setChatOpen } = useSite();
  const key = `button:${id}`;
  const settings = { ...buttonDefaults, ...fallback, ...json<Partial<ButtonSettings>>(key, {}) };
  const [draft, setDraft] = useState(settings);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sections, setSections] = useState<{ id: string; label: string }[]>([]);
  const openDialog = () => {
    setSections(Array.from(document.querySelectorAll<HTMLElement>('[id^="section-"]')).map((el, i) => ({ id: el.id, label: `${i + 1}. ${el.querySelector("h1,h2,h3")?.textContent?.trim().slice(0, 50) || el.id}` })));
    setDraft(settings); setOpen(true);
  };
  const change = (patch: Partial<ButtonSettings>) => setDraft((old) => ({ ...old, ...patch }));
  const label = settings[lang] || settings.sr || settings.en;
  const href = settings.action === "link" ? safeBuilderLink(settings.target) : undefined;
  const run = () => {
    if (settings.action === "chat") setChatOpen(true);
    if (settings.action === "scroll") {
      if (!scrollToAnchor(settings.target)) toast.error(lang === "sr" ? "Sekcija nije pronađena" : "Section not found");
    }
  };
  const persist = async () => {
    if (!draft.sr.trim() && !draft.en.trim()) { toast.error("Upišite tekst dugmeta"); return; }
    if (draft.action === "link" && !safeBuilderLink(draft.target)) { toast.error("Unesite ispravan link (https://, /, #, mailto: ili tel:)"); return; }
    if (draft.action === "scroll" && !/^[\w-]+$/.test(draft.target.replace(/^#/, ""))) { toast.error("Unesite ankor, npr. #prica, #galerija ili #kontakt"); return; }
    setBusy(true);
    try { await save({ [key]: JSON.stringify(draft) }); setOpen(false); toast.success("Dugme sačuvano"); }
    catch { toast.error("Dugme nije sačuvano"); }
    finally { setBusy(false); }
  };
  // Visitors: hidden below 768px (phones) and/or 768–1023px (tablets). Editors still see it, dimmed.
  const visibility = editMode
    ? (settings.hideMobile || settings.hideTablet ? "opacity-60" : "")
    : `${settings.hideMobile ? "max-md:hidden" : ""} ${settings.hideTablet ? "md:max-lg:hidden" : ""}`;
  return <>
    <div className={`flex min-w-0 flex-wrap items-center gap-2 ${visibility}`}>
      {href ? <Button asChild variant={settings.variant} size={size} className={`h-auto min-h-9 max-w-full whitespace-normal break-words ${className ?? ""}`}><a href={href} onClick={(e) => { if (href.startsWith("#") && !settings.newTab) { e.preventDefault(); if (!scrollToAnchor(href)) toast.error(lang === "sr" ? "Sekcija nije pronađena" : "Section not found"); } }} target={settings.newTab ? "_blank" : undefined} rel={settings.newTab ? "noopener noreferrer" : undefined}>{label}</a></Button>
        : <Button variant={settings.variant} disabled={settings.action === "link"} size={size} className={`h-auto min-h-9 max-w-full whitespace-normal break-words ${className ?? ""}`} onClick={run}>{label}</Button>}
      {editMode && <Button variant="outline" size="icon-sm" aria-label="Podesi dugme" title="Podesi dugme" onClick={openDialog}><Settings2 /></Button>}
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Podešavanje dugmeta</DialogTitle></DialogHeader>
      <Label className="flex flex-col gap-2">Tekst dugmeta (ME)<Input value={draft.sr} onChange={(e) => change({ sr: e.target.value })} /></Label>
      <Label className="flex flex-col gap-2">Tekst dugmeta (EN)<Input value={draft.en} onChange={(e) => change({ en: e.target.value })} /></Label>
      <Label>Na klik</Label><Select value={draft.action} onValueChange={(action: ButtonSettings["action"]) => change({ action })}><SelectTrigger aria-label="Na klik"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="link">Otvori link</SelectItem><SelectItem value="chat">Otvori chatbot</SelectItem><SelectItem value="scroll">Idi do sekcije</SelectItem></SelectContent></Select>
      {draft.action === "scroll" && sections.length > 0 && <Label className="flex flex-col gap-2">Sekcija na stranici<Select value={sections.some((s) => s.id === draft.target.replace(/^#/, "")) ? draft.target.replace(/^#/, "") : ""} onValueChange={(target) => change({ target })}><SelectTrigger aria-label="Sekcija na stranici"><SelectValue placeholder="Izaberite sekciju" /></SelectTrigger><SelectContent>{sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></Label>}
      {draft.action !== "chat" && <Label className="flex flex-col gap-2">{draft.action === "link" ? "Link ili ankor (npr. #prica, #galerija, #kontakt)" : "Ili upišite ankor (npr. #prica, #galerija, #kontakt)"}<Input value={draft.target} placeholder={draft.action === "link" ? "https://… ili #kontakt" : "#kontakt"} onChange={(e) => change({ target: e.target.value })} /></Label>}
      {draft.action === "link" && <Label className="flex items-center justify-between gap-3">Otvori u novoj kartici<Switch checked={draft.newTab} onCheckedChange={(newTab) => change({ newTab })} /></Label>}
      <Label>Izgled dugmeta</Label><Select value={draft.variant} onValueChange={(variant: ButtonSettings["variant"]) => change({ variant })}><SelectTrigger aria-label="Izgled dugmeta"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="default">Puno</SelectItem><SelectItem value="outline">Sa okvirom</SelectItem><SelectItem value="secondary">Blago</SelectItem><SelectItem value="hero">Glavno (naglašeno)</SelectItem><SelectItem value="heroGhost">Prozirno</SelectItem></SelectContent></Select>
      <Label className="flex items-center justify-between gap-3">Sakrij na mobilnim telefonima<Switch checked={!!draft.hideMobile} onCheckedChange={(hideMobile) => change({ hideMobile })} /></Label>
      <Label className="flex items-center justify-between gap-3">Sakrij na tabletima<Switch checked={!!draft.hideTablet} onCheckedChange={(hideTablet) => change({ hideTablet })} /></Label>
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Otkaži</Button><Button disabled={busy} onClick={persist}><MousePointerClick />Sačuvaj</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}

function TikTokIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M16.7 2h-3.5v13.6a3 3 0 1 1-2.6-3V9a6.7 6.7 0 1 0 6.1 6.6V8.7a9 9 0 0 0 5.1 1.6V6.8A5.2 5.2 0 0 1 16.7 2Z" /></svg>;
}
const networks: { id: string; name: string; Icon: LucideIcon | typeof TikTokIcon }[] = [
  { id: "facebook", name: "Facebook", Icon: Facebook }, { id: "instagram", name: "Instagram", Icon: Instagram },
  { id: "tiktok", name: "TikTok", Icon: TikTokIcon }, { id: "youtube", name: "YouTube", Icon: Youtube },
];

export function BuilderSocialLinks({ id }: { id: string }) {
  const { json, save, editMode } = useSite();
  const key = `social:${id}`;
  const settings = json<Record<string, string>>(key, {});
  const [draft, setDraft] = useState(settings);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const persist = async () => {
    for (const network of networks) {
      const value = draft[network.id]?.trim();
      if (value && (!safeBuilderLink(value) || !/^https?:\/\//i.test(value))) { toast.error(`Unesite ispravan https:// link za ${network.name}`); return; }
    }
    setBusy(true);
    try { await save({ [key]: JSON.stringify(draft) }); setOpen(false); toast.success("Linkovi sačuvani"); }
    catch { toast.error("Linkovi nisu sačuvani"); }
    finally { setBusy(false); }
  };
  return <>
    <div className="flex flex-wrap items-center gap-2">
      {networks.map(({ id: networkId, name, Icon }) => {
        const href = safeBuilderLink(settings[networkId] ?? "");
        if (href) return <Button key={networkId} asChild variant="ghost" size="icon-lg"><a href={href} target="_blank" rel="noopener noreferrer" aria-label={name} title={name}><Icon className="size-5" /></a></Button>;
        return editMode ? <span key={networkId} className="flex size-10 items-center justify-center text-muted-foreground" title={name}><Icon className="size-5" /></span> : null;
      })}
      {editMode && <Button variant="outline" size="icon-sm" aria-label="Podesi društvene mreže" title="Podesi društvene mreže" onClick={() => { setDraft(settings); setOpen(true); }}><Settings2 /></Button>}
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Društvene mreže</DialogTitle></DialogHeader>
      {networks.map(({ id: networkId, name, Icon }) => <Label key={networkId} className="flex flex-col gap-2"><span className="flex items-center gap-2"><Icon className="size-4" />{name}</span><Input type="url" placeholder="https://…" value={draft[networkId] ?? ""} onChange={(e) => setDraft((old) => ({ ...old, [networkId]: e.target.value }))} /></Label>)}
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Otkaži</Button><Button disabled={busy} onClick={persist}>Sačuvaj</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}

type ContactItem = { icon: string; sr: string; en: string; link: string };
const contactIcons: { id: string; name: string; Icon: LucideIcon }[] = [
  { id: "pin", name: "Lokacija", Icon: MapPin },
  { id: "phone", name: "Telefon", Icon: Phone },
  { id: "mail", name: "Mejl", Icon: Mail },
  { id: "clock", name: "Radno vrijeme", Icon: Clock },
  { id: "globe", name: "Web sajt", Icon: Globe },
  { id: "message", name: "Poruka", Icon: MessageCircle },
];

export function BuilderContact({ id }: { id: string }) {
  const { json, save, editMode, lang } = useSite();
  const key = `contact:${id}`;
  const settings = json<ContactItem[]>(key, []);
  const [draft, setDraft] = useState<ContactItem[]>(settings);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const changeItem = (index: number, patch: Partial<ContactItem>) => setDraft((old) => old.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const persist = async () => {
    const items = draft.filter((item) => item.sr.trim() || item.en.trim());
    if (!items.length) { toast.error("Dodajte barem jedan podatak"); return; }
    for (const item of items) {
      const link = item.link.trim();
      if (link && !safeBuilderLink(link)) { toast.error("Unesite ispravan link (https://, /, #, mailto: ili tel:)"); return; }
    }
    setBusy(true);
    try { await save({ [key]: JSON.stringify(items) }); setOpen(false); toast.success("Info ikone sačuvane"); }
    catch { toast.error("Info ikone nisu sačuvane"); }
    finally { setBusy(false); }
  };
  return <>
    {settings.length > 0 && <ul className="flex min-w-0 flex-col gap-3">
      {settings.map((item, index) => {
        const Icon = contactIcons.find((c) => c.id === item.icon)?.Icon ?? MapPin;
        const label = item[lang] || item.sr || item.en;
        const href = safeBuilderLink(item.link ?? "");
        const content = <span className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary"><Icon className="size-5" /></span><span className="min-w-0 break-words">{label}</span></span>;
        return <li key={index} className="min-w-0">{href ? <a href={href} className="flex min-w-0 items-center hover:underline">{content}</a> : content}</li>;
      })}
    </ul>}
    {editMode && <Button variant="outline" size="icon-sm" className="self-start" aria-label="Podesi info ikone" title="Podesi info ikone" onClick={() => { setDraft(settings.length ? settings : [{ icon: "pin", sr: "Novi podatak", en: "New item", link: "" }]); setOpen(true); }}><Settings2 /></Button>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Info ikone</DialogTitle></DialogHeader>
      {draft.map((item, index) => <div key={index} className="space-y-2 rounded-lg border p-3">
        <div className="flex items-end gap-2">
          <Label className="flex min-w-0 flex-1 flex-col gap-2">Ikona<Select value={item.icon} onValueChange={(icon) => changeItem(index, { icon })}><SelectTrigger aria-label="Ikona"><SelectValue /></SelectTrigger><SelectContent>{contactIcons.map(({ id: iconId, name, Icon: ItemIcon }) => <SelectItem key={iconId} value={iconId}><span className="flex items-center gap-2"><ItemIcon className="size-4" />{name}</span></SelectItem>)}</SelectContent></Select></Label>
          <Button variant="outline" size="icon-sm" title="Obriši podatak" aria-label="Obriši podatak" onClick={() => setDraft((old) => old.filter((_, i) => i !== index))}><Trash2 /></Button>
        </div>
        <Label className="flex flex-col gap-2">Tekst (ME)<Input value={item.sr} onChange={(e) => changeItem(index, { sr: e.target.value })} /></Label>
        <Label className="flex flex-col gap-2">Tekst (EN)<Input value={item.en} onChange={(e) => changeItem(index, { en: e.target.value })} /></Label>
        <Label className="flex flex-col gap-2">Link (nije obavezno)<Input value={item.link} placeholder="https://, mailto: ili tel:" onChange={(e) => changeItem(index, { link: e.target.value })} /></Label>
      </div>)}
      <Button variant="outline" className="self-start" onClick={() => setDraft((old) => [...old, { icon: "pin", sr: "Novi podatak", en: "New item", link: "" }])}><Plus />Dodaj podatak</Button>
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Otkaži</Button><Button disabled={busy} onClick={persist}>Sačuvaj</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}