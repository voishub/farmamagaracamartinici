import { Newspaper } from "lucide-react";
import { PostsBlock } from "@/components/posts";
import { useState, type CSSProperties, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Columns3, Image, Images, Plus, Settings2, Trash2, Type, AlignLeft, AlignCenter, AlignRight, MousePointerClick, Share2, Phone, MoveVertical, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useSite } from "@/lib/site-content";
import { EditableImage, EditableText } from "@/components/editable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BuilderButton, BuilderContact, BuilderSocialLinks } from "@/components/builder-actions";

type ElementKind = "title" | "text" | "image" | "gallery" | "button" | "social" | "contact" | "spacer" | "collapsible" | "posts";
type Device = "d" | "t" | "m";
type Sides = { top: number; right: number; bottom: number; left: number };
const zero: Sides = { top: 0, right: 0, bottom: 0, left: 0 };
const px = (v: number | undefined) => (v === undefined ? undefined : `${v}px`);
type SectionElement = { id: string; type: ElementKind; margin: number; padding: number; width?: 25 | 33 | 50 | 66 | 75 | 100 | undefined; marginTablet?: number | undefined; marginMobile?: number | undefined; height?: number | undefined; heightTablet?: number | undefined; heightMobile?: number | undefined };
type Column = { id: string; width: 25 | 33 | 50 | 66 | 75 | 100; padding: number; gap: number; marginTop?: number; marginRight?: number; marginBottom?: number; marginLeft?: number; marginsTablet?: Sides | undefined; marginsMobile?: Sides | undefined; elements: SectionElement[] };
export type SectionSettings = { background: string; customColor?: string; paddingY: number; paddingX: number; marginTop: number; marginBottom: number; gap: number; alignment?: "left" | "center" | "right"; anchor?: string };
const defaults: SectionSettings = { background: "background", paddingY: 64, paddingX: 24, marginTop: 0, marginBottom: 0, gap: 24 };
const uid = () => crypto.randomUUID().slice(0, 8);
const backgrounds = [
  { id: "background", label: "Osnovna", color: "bg-background" },
  { id: "card", label: "Svijetla", color: "bg-card" },
  { id: "secondary", label: "Blaga", color: "bg-secondary" },
  { id: "olive", label: "Maslinasta", color: "bg-olive" },
  { id: "primary", label: "Terakota", color: "bg-primary" },
  { id: "foreground", label: "Tamna", color: "bg-foreground" },
];
export function NumberSetting({ label, value, onChange, max = 240, min = 0 }: { label: string; value: number; onChange: (value: number) => void; max?: number; min?: number }) {
  return <Label className="flex min-w-0 flex-col gap-2"><span>{label} (px)</span><Input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))} /></Label>;
}
export function sectionStyle(settings: SectionSettings): CSSProperties {
  const background = settings.background === "custom" ? settings.customColor : `var(--${settings.background})`;
  let foreground = "var(--foreground)";
  if (["olive", "primary", "foreground"].includes(settings.background)) foreground = "var(--hero-foreground)";
  if (settings.background === "custom" && /^#[0-9a-f]{6}$/i.test(settings.customColor ?? "")) {
    const color = settings.customColor ?? "";
    const luminance = parseInt(color.slice(1, 3), 16) * 0.299 + parseInt(color.slice(3, 5), 16) * 0.587 + parseInt(color.slice(5, 7), 16) * 0.114;
    foreground = luminance < 145 ? "var(--hero-foreground)" : "var(--foreground)";
  }
  return { "--section-background": background, "--section-foreground": foreground, "--section-padding-y": `${settings.paddingY}px`, "--section-padding-x": `${settings.paddingX}px`, marginTop: settings.marginTop, marginBottom: settings.marginBottom } as CSSProperties;
}
export function SectionSettingsButton({ id }: { id: string }) {
  const { json, save } = useSite();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(defaults);
  const key = `section-style:${id}`;
  const change = (patch: Partial<SectionSettings>) => setDraft((old) => ({ ...old, ...patch }));
  return <>
    <Button size="icon-xs" variant="ghost" title="Izgled sekcije" aria-label="Izgled sekcije" onClick={() => { setDraft(json(key, defaults)); setOpen(true); }}><Settings2 /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Izgled sekcije</DialogTitle></DialogHeader>
      <Label className="flex flex-col gap-2">Ankor naziv sekcije (za linkove, npr. kontakt → #kontakt)<Input value={draft.anchor ?? ""} placeholder="kontakt" onChange={(e) => change({ anchor: e.target.value.replace(/^#/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} /></Label>
      <Label>Boja pozadine</Label><div className="flex flex-wrap gap-2">{backgrounds.map((bg) => <Button key={bg.id} variant="outline" size="icon" title={bg.label} aria-label={bg.label} aria-pressed={draft.background === bg.id} className={draft.background === bg.id ? "ring-2 ring-edit" : ""} onClick={() => change({ background: bg.id })}><span className={`size-6 rounded border ${bg.color}`} /></Button>)}</div>
      <Label className="flex items-center justify-between">Prilagođena boja<Input type="color" aria-label="Prilagođena boja" className="h-10 w-20 p-1" value={draft.customColor ?? "#ffffff"} onChange={(e) => change({ background: "custom", customColor: e.target.value })} /></Label>
      <div className="grid grid-cols-2 gap-4"><NumberSetting label="Unutrašnji razmak gore/dolje" value={draft.paddingY} onChange={(paddingY) => change({ paddingY })} /><NumberSetting label="Unutrašnji razmak lijevo/desno" value={draft.paddingX} onChange={(paddingX) => change({ paddingX })} /><NumberSetting label="Margina iznad" value={draft.marginTop} onChange={(marginTop) => change({ marginTop })} min={-240} /><NumberSetting label="Margina ispod" value={draft.marginBottom} onChange={(marginBottom) => change({ marginBottom })} min={-240} /><NumberSetting label="Razmak između blokova" value={draft.gap} onChange={(gap) => change({ gap })} /></div>
      <Label>Poravnanje blokova u redu</Label><div className="flex gap-2">{([{ value: "left", label: "Lijevo", Icon: AlignLeft }, { value: "center", label: "Centrirano", Icon: AlignCenter }, { value: "right", label: "Desno", Icon: AlignRight }] as const).map(({ value, label, Icon }) => <Button key={value} variant="outline" size="icon" aria-label={label} title={label} aria-pressed={(draft.alignment ?? "left") === value} className={(draft.alignment ?? "left") === value ? "ring-2 ring-edit" : ""} onClick={() => change({ alignment: value })}><Icon /></Button>)}</div>
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Otkaži</Button><Button disabled={busy} onClick={async () => { setBusy(true); try { await save({ [key]: JSON.stringify(draft) }); setOpen(false); toast.success("Izgled sačuvan"); } catch { toast.error("Izgled nije sačuvan"); } finally { setBusy(false); } }}>Sačuvaj</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
const kinds: { type: ElementKind; label: string; icon: typeof Type }[] = [{ type: "title", label: "Naslov", icon: Type }, { type: "text", label: "Tekst", icon: AlignLeft }, { type: "image", label: "Slika", icon: Image }, { type: "gallery", label: "Galerija", icon: Images }, { type: "button", label: "Dugme", icon: MousePointerClick }, { type: "social", label: "Društvene mreže", icon: Share2 }, { type: "contact", label: "Info ikone", icon: Phone }, { type: "spacer", label: "Razmak", icon: MoveVertical }, { type: "collapsible", label: "Sklopivi tekst", icon: ChevronDown }, { type: "posts", label: "Objave", icon: Newspaper }];
const widthOptions = [25, 33, 50, 66, 75, 100] as const;
const widthLabel = (w: number) => (w === 33 ? "33%" : w === 66 ? "66%" : `${w}%`);
export function FlexibleSection({ id, renderGallery }: { id: string; renderGallery: (id: string) => ReactNode }) {
  const { json, save, editMode } = useSite();
  const key = `section:${id}`;
  const columns = json<Column[]>(key, []);
  const settings = json<SectionSettings>(`section-style:${id}`, defaults);
  const [selected, setSelected] = useState<{ column: string; element?: string } | null>(null);
  const [padding, setPadding] = useState(0);
  const [gap, setGap] = useState(16);
  const [margins, setMargins] = useState<Record<Device, Sides>>({ d: zero, t: zero, m: zero });
  const [elMargins, setElMargins] = useState<Record<Device, number>>({ d: 0, t: 0, m: 0 });
  const [heights, setHeights] = useState<Record<Device, number>>({ d: 40, t: 40, m: 40 });
  const [device, setDevice] = useState<Device>("d");
  const selectedEl = selected?.element ? columns.find((c) => c.id === selected.column)?.elements.find((e) => e.id === selected.element) : undefined;
  const [busy, setBusy] = useState(false);
  const [newWidth, setNewWidth] = useState<Column["width"]>(50);
  const persist = async (next: Column[], extra: Record<string, string> = {}) => { setBusy(true); try { await save({ [key]: JSON.stringify(next), ...extra }); return true; } catch { toast.error("Promjena nije sačuvana"); return false; } finally { setBusy(false); } };
  const update = (cid: string, patch: Partial<Column>) => persist(columns.map((c) => c.id === cid ? { ...c, ...patch } : c));
  const addColumn = (width: Column["width"], after?: string) => {
    const next = [...columns];
    const index = after ? columns.findIndex((c) => c.id === after) + 1 : columns.length;
    next.splice(index, 0, { id: uid(), width, padding: 16, gap: 16, elements: [] });
    persist(next);
  };
  const addElement = (c: Column, type: ElementKind) => {
    const eid = uid();
    const extra: Record<string, string> = {};
    if (type === "title" || type === "text") { extra[`t:element.${eid}:sr`] = type === "title" ? "Novi naslov" : "Novi tekst"; extra[`t:element.${eid}:en`] = type === "title" ? "New title" : "New text"; }
    if (type === "collapsible") { extra[`t:element.${eid}.title:sr`] = "Kliknite za više"; extra[`t:element.${eid}.title:en`] = "Click for more"; extra[`t:element.${eid}:sr`] = "Skriveni tekst koji se otvara klikom."; extra[`t:element.${eid}:en`] = "Hidden text revealed on click."; }
    persist(columns.map((col) => col.id === c.id ? { ...col, elements: [...col.elements, { id: eid, type, margin: 0, padding: 0, ...(type === "spacer" ? { height: 40 } : {}) }] } : col), extra);
  };
  const reorder = <T,>(items: T[], index: number, direction: number) => { const next = [...items]; const target = index + direction; const current = next[index]; const other = next[target]; if (current === undefined || other === undefined) return items; next[index] = other; next[target] = current; return next; };
  const moveColumn = (index: number, direction: number) => persist(reorder(columns, index, direction));
  return <section className="builder-section w-full" data-section-id={id} style={sectionStyle(settings)}>
    <fieldset disabled={busy} className="min-w-0">
    <div className={`builder-columns min-w-0 ${settings.alignment === "center" ? "justify-center" : settings.alignment === "right" ? "justify-end" : "justify-start"}`} style={{ "--block-gap": `${settings.gap}px` } as CSSProperties}>
      {columns.map((c, index) => <div key={c.id} className={`builder-column min-w-0 ${editMode ? "border border-dashed border-edit" : ""}`} style={{ padding: c.padding, "--cmt-d": px(c.marginTop ?? 0), "--cmr-d": px(c.marginRight ?? 0), "--cmb-d": px(c.marginBottom ?? 0), "--cml-d": px(c.marginLeft ?? 0), "--cmt-t": px(c.marginsTablet?.top), "--cmr-t": px(c.marginsTablet?.right), "--cmb-t": px(c.marginsTablet?.bottom), "--cml-t": px(c.marginsTablet?.left), "--cmt-m": px(c.marginsMobile?.top), "--cmr-m": px(c.marginsMobile?.right), "--cmb-m": px(c.marginsMobile?.bottom), "--cml-m": px(c.marginsMobile?.left), "--block-width": c.width === 33 ? 1 / 3 : c.width === 66 ? 2 / 3 : c.width / 100 } as CSSProperties} data-column-width={c.width}>
        {editMode && <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-edit/30 pb-2 text-foreground"><span className="mr-auto flex items-center gap-1 text-xs"><Columns3 className="size-4" /> Blok {index + 1}</span><Select value={String(c.width)} onValueChange={(v) => update(c.id, { width: Number(v) as Column["width"] })}><SelectTrigger aria-label={`Širina bloka ${index + 1}`} className="w-24 bg-background"><SelectValue /></SelectTrigger><SelectContent>{widthOptions.map((w) => <SelectItem key={w} value={String(w)}>{widthLabel(w)}</SelectItem>)}</SelectContent></Select><Button variant="outline" size="icon-sm" title="Pomjeri blok lijevo" aria-label="Pomjeri blok lijevo" disabled={index === 0} onClick={() => moveColumn(index, -1)}><ArrowLeft /></Button><Button variant="outline" size="icon-sm" title="Pomjeri blok desno" aria-label="Pomjeri blok desno" disabled={index === columns.length - 1} onClick={() => moveColumn(index, 1)}><ArrowRight /></Button><Button variant="outline" size="icon-sm" title="Razmaci bloka" aria-label="Razmaci bloka" onClick={() => { setSelected({ column: c.id }); setPadding(c.padding); setGap(c.gap); setMargins({ d: { top: c.marginTop ?? 0, right: c.marginRight ?? 0, bottom: c.marginBottom ?? 0, left: c.marginLeft ?? 0 }, t: c.marginsTablet ?? zero, m: c.marginsMobile ?? zero }); setDevice("d"); }}><Settings2 /></Button><Button variant="outline" size="icon-sm" title="Obriši unutrašnji blok" aria-label="Obriši unutrašnji blok" onClick={() => { if (confirm("Obrisati blok sa svim sadržajem?")) persist(columns.filter((col) => col.id !== c.id)); }}><Trash2 /></Button></div>}
        <div className="flex min-w-0 flex-wrap" style={{ gap: c.gap }}>{c.elements.map((el, i) => { const elWidth = el.width ?? 100; const elFactor = elWidth === 33 ? 1 / 3 : elWidth === 66 ? 2 / 3 : elWidth / 100; return <div key={el.id} className="builder-element min-w-0" style={{ padding: el.padding, "--mt-d": px(el.margin), "--mt-t": px(el.marginTablet), "--mt-m": px(el.marginMobile), "--el-width": elFactor, "--el-gap": `${c.gap}px` } as CSSProperties}>
          {editMode && <div className="mb-2 flex flex-wrap items-center gap-1 text-foreground"><span className="mr-auto text-xs">{kinds.find((k) => k.type === el.type)?.label}</span><Select value={String(elWidth)} onValueChange={(v) => update(c.id, { elements: c.elements.map((item) => item.id === el.id ? { ...item, width: Number(v) as SectionElement["width"] } : item) })}><SelectTrigger aria-label="Širina objekta" className="h-6 w-20 bg-background text-xs"><SelectValue /></SelectTrigger><SelectContent>{widthOptions.map((w) => <SelectItem key={w} value={String(w)}>{widthLabel(w)}</SelectItem>)}</SelectContent></Select><Button size="icon-xs" variant="outline" title="Pomjeri objekat gore" aria-label="Pomjeri objekat gore" disabled={i === 0} onClick={() => update(c.id, { elements: reorder(c.elements, i, -1) })}><ArrowUp /></Button><Button size="icon-xs" variant="outline" title="Pomjeri objekat dolje" aria-label="Pomjeri objekat dolje" disabled={i === c.elements.length - 1} onClick={() => update(c.id, { elements: reorder(c.elements, i, 1) })}><ArrowDown /></Button><Button size="icon-xs" variant="outline" title="Razmaci objekta" aria-label="Razmaci objekta" onClick={() => { setSelected({ column: c.id, element: el.id }); setPadding(el.padding); setElMargins({ d: el.margin, t: el.marginTablet ?? 0, m: el.marginMobile ?? 0 }); setHeights({ d: el.height ?? 40, t: el.heightTablet ?? el.height ?? 40, m: el.heightMobile ?? el.height ?? 40 }); setDevice("d"); }}><Settings2 /></Button><Button size="icon-xs" variant="outline" title="Obriši objekat" aria-label="Obriši objekat" onClick={() => { if (confirm("Obrisati objekat?")) update(c.id, { elements: c.elements.filter((item) => item.id !== el.id) }); }}><Trash2 /></Button></div>}
          {el.type === "title" && <EditableText k={`element.${el.id}`} as="h2" className="break-words text-4xl font-semibold leading-tight" />}
          {el.type === "text" && <EditableText k={`element.${el.id}`} as="p" className="whitespace-pre-line break-words text-lg leading-relaxed" />}
          {el.type === "image" && <EditableImage k={`element.${el.id}`} alt="" />}
          {el.type === "gallery" && renderGallery(el.id)}
          {el.type === "button" && <BuilderButton id={el.id} />}
          {el.type === "social" && <BuilderSocialLinks id={el.id} />}
          {el.type === "contact" && <BuilderContact id={el.id} />}
          {el.type === "spacer" && <div aria-hidden className={`builder-spacer ${editMode ? "border border-dashed border-edit/50 text-center text-xs text-muted-foreground" : ""}`} style={{ "--sp-d": px(el.height ?? 40), "--sp-t": px(el.heightTablet), "--sp-m": px(el.heightMobile) } as CSSProperties}>{editMode ? `${el.height ?? 40}px` : null}</div>}
          {el.type === "posts" && <PostsBlock id={el.id} embedded />}
          {el.type === "collapsible" && (editMode ? <div className="rounded-md border border-border p-4"><EditableText k={`element.${el.id}.title`} as="h3" className="text-xl font-semibold" /><EditableText k={`element.${el.id}`} as="p" className="mt-3 whitespace-pre-line text-lg leading-relaxed" /></div> : <details className="group rounded-md border border-border p-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-semibold"><EditableText k={`element.${el.id}.title`} as="span" /><ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" /></summary><EditableText k={`element.${el.id}`} as="p" className="mt-3 whitespace-pre-line text-lg leading-relaxed" /></details>)}
        </div>; })}</div>
        {editMode && <div className="mt-4 flex flex-wrap gap-2">{kinds.map(({ type, label, icon: Icon }) => <Button key={type} variant="outline" size="sm" onClick={() => addElement(c, type)}><Icon />{label}</Button>)}</div>}
        {editMode && <Button variant="ghost" size="sm" className="mt-3" onClick={() => addColumn(newWidth, c.id)}><Plus />Dodaj blok pored</Button>}
      </div>)}
    </div>
    {editMode && <div className="mt-6 flex flex-wrap items-center gap-3 text-foreground"><Label htmlFor={`new-width-${id}`}>Širina novog bloka</Label><Select value={String(newWidth)} onValueChange={(v) => setNewWidth(Number(v) as Column["width"])}><SelectTrigger id={`new-width-${id}`} aria-label="Širina novog bloka" className="w-24 bg-background"><SelectValue /></SelectTrigger><SelectContent>{widthOptions.map((w) => <SelectItem key={w} value={String(w)}>{widthLabel(w)}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => addColumn(newWidth)}><Plus />Dodaj unutrašnji blok</Button></div>}
    </fieldset>
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{selected?.element ? "Razmaci objekta" : "Razmaci bloka"}</DialogTitle></DialogHeader>
      <NumberSetting label="Unutrašnji razmak" value={padding} onChange={setPadding} />
      {!selected?.element && <NumberSetting label="Razmak između objekata" value={gap} onChange={setGap} />}
      <Label>Ekran</Label><div className="flex flex-wrap gap-2">{([["d", "Veliki ekran"], ["t", "Tablet"], ["m", "Mobilni"]] as const).map(([d, label]) => <Button key={d} size="sm" variant={device === d ? "default" : "outline"} aria-pressed={device === d} onClick={() => setDevice(d)}>{label}</Button>)}</div>
      <p className="text-xs text-muted-foreground">Margine važe samo za izabrani ekran (tablet od 768px, veliki od 1024px).</p>
      {selected?.element ? <>
        <NumberSetting label="Margina iznad objekta" value={elMargins[device]} onChange={(v) => setElMargins((m) => ({ ...m, [device]: v }))} min={-240} />
        {selectedEl?.type === "spacer" && <NumberSetting label="Visina razmaka" value={heights[device]} onChange={(v) => setHeights((h) => ({ ...h, [device]: v }))} max={800} />}
      </> : <div className="grid grid-cols-2 gap-4">{(["top", "right", "bottom", "left"] as const).map((side) => <NumberSetting key={side} label={{ top: "Margina gore", right: "Margina desno", bottom: "Margina dolje", left: "Margina lijevo" }[side]} value={margins[device][side]} onChange={(v) => setMargins((m) => ({ ...m, [device]: { ...m[device], [side]: v } }))} min={-240} />)}</div>}
      <DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Otkaži</Button><Button disabled={busy} onClick={async () => { if (!selected) return; const next = columns.map((c) => c.id !== selected.column ? c : selected.element ? { ...c, elements: c.elements.map((el) => el.id === selected.element ? { ...el, padding, margin: elMargins.d, marginTablet: elMargins.t, marginMobile: elMargins.m, ...(el.type === "spacer" ? { height: heights.d, heightTablet: heights.t, heightMobile: heights.m } : {}) } : el) } : { ...c, padding, gap, marginTop: margins.d.top, marginRight: margins.d.right, marginBottom: margins.d.bottom, marginLeft: margins.d.left, marginsTablet: margins.t, marginsMobile: margins.m }); if (await persist(next)) setSelected(null); }}>Sačuvaj</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
