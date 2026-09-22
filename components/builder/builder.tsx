'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import {
  ArrowLeft, ChevronDown, Cloud, CloudOff, ExternalLink, Eye, EyeOff, Palette as PaletteIcon, Save, History, LayoutTemplate, Layers as LayersIcon, Monitor, MoreHorizontal, Plus,
  Redo2, RefreshCw, Settings2, Smartphone, Tablet, Undo2,
} from 'lucide-react'
import type { RenderData } from '@/components/builder-render/context'
import {
  deleteReusableBlockAction, getPageStateAction, publishPageAction, reimportLegacyPageAction, saveReusableBlockAction, savePageDraftAction, saveSettingAction, saveTemplateAction,
  unpublishPageAction, updateReusableBlockAction,
} from '@/lib/builder/actions'
import { BLOCKS, makeNode } from '@/lib/builder/blocks'
import { BUILTIN_TEMPLATES } from '@/lib/builder/templates'
import { cloneDocWithNewIds, findNode, findParent, ROOT_ID } from '@/lib/builder/tree'
import type { BuilderNode, Device, PageDoc, PageTemplateRow, ReusableBlock, ThemeSettings } from '@/lib/builder/types'
import { Canvas } from './canvas'
import { Inspector } from './inspector'
import { PagesContext, type PageOption } from './link-field'
import { HistoryDialog, PageSettingsDialog, PublishDialog, type PageMeta } from './page-dialogs'
import { Layers, Palette, resolveInsert, type InsertTarget } from './panels'
import { copyToClipboard, initState, readClipboard, reducer, setProp, setStyle } from './store'
import { TemplatePicker } from './template-picker'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './menu'
import { THEME_PRESETS, applyPreset } from '@/lib/builder/theme-presets'
import { Btn, ConfirmProvider, Dialog, FieldRow, IconBtn, Segmented, Spinner, StatusBadge, Toggle, cx, inputClass, useConfirm } from './ui'

type SaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict'

export type BuilderProps = {
  mode: 'page' | 'block'
  page?: PageMeta & { version: number; updated_at: string }
  block?: { id: string; name: string; is_global: boolean; updated_at: string; wrapped: boolean; version: number }
  initialDoc: PageDoc
  data: RenderData
  theme: ThemeSettings
  pages: PageOption[]
  savedBlocks: ReusableBlock[]
  templates: PageTemplateRow[]
  siteUrl: string
  canPublish: boolean
  seoOnly: boolean
  // Theme quick-switch (needs the Theme permission).
  canDesign?: boolean
  themeVersion?: number
}

const AUTOSAVE_MS = 2500

function backupKey(id: string) {
  return `pb-backup-${id}`
}

function isTyping(el: Element | null) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable
}

export function Builder(props: BuilderProps) {
  return (
    <ConfirmProvider>
      <PagesContext.Provider value={props.pages}>
        <Toaster position="bottom-right" richColors closeButton />
        <BuilderInner {...props} />
      </PagesContext.Provider>
    </ConfirmProvider>
  )
}

function BuilderInner({ mode, page: initialPage, block, initialDoc, data: initialData, theme: initialTheme, savedBlocks: initialSaved, templates, siteUrl, canPublish, seoOnly, canDesign = false, themeVersion = 0 }: BuilderProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const [state, dispatch] = useReducer(reducer, initialDoc, initState)
  const [data, setData] = useState(initialData)
  const [theme, setTheme] = useState(initialTheme)
  const themeVersionRef = useRef(themeVersion)
  const [page, setPage] = useState(initialPage)
  const version = useRef(initialPage?.version ?? block?.version ?? 0)
  const [backupFailed, setBackupFailed] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const savedRevision = useRef(0)
  const saving = useRef(false)
  const [leftTab, setLeftTab] = useState<'add' | 'layers'>('add')
  const [insertTarget, setInsertTarget] = useState<InsertTarget>(null)
  const [saved, setSaved] = useState(initialSaved)
  const [dialog, setDialog] = useState<null | 'settings' | 'seo' | 'history' | 'publish' | 'template' | 'reusable' | 'conflict' | 'templates' | 'backup'>(null)
  const [reusableNode, setReusableNode] = useState<BuilderNode | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [backup, setBackup] = useState<{ doc: PageDoc; at: number } | null>(null)
  // Rich text toolbars dock here, above the canvas.
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null)
  const id = mode === 'page' ? page!.id : block!.id
  const { doc, selectedId, device } = state
  const selected = selectedId ? findNode(doc, selectedId) : null
  const stateRef = useRef(state)
  stateRef.current = state
  const saveRef = useRef<(reason?: 'save' | 'autosave', force?: boolean) => Promise<boolean>>(async () => false)
  const globalNames = useMemo(() => Object.fromEntries(Object.entries(data.globalBlocks ?? {}).map(([k, v]) => [k, v.name])), [data.globalBlocks])

  // ------------------------------------------------------------------ saving
  const save = useCallback(
    async (reason: 'save' | 'autosave' = 'autosave', force = false): Promise<boolean> => {
      if (saving.current) return false
      const revision = stateRef.current.revision
      if (!force && revision === savedRevision.current && reason === 'autosave') return true
      saving.current = true
      setSaveState('saving')
      try {
        const current = stateRef.current
        if (mode === 'block') {
          const root = current.doc.sections[0]
          const node = block!.wrapped ? root?.children?.[0] : root
          if (!node) throw new Error('A reusable block can’t be empty.')
          const res = await updateReusableBlockAction(block!.id, { block: node }, version.current)
          if ('error' in res) throw new Error(res.error)
          if (res.conflict) {
            setSaveState('conflict')
            toast.error('Someone else changed this block while you were editing. Your changes are kept on this device — reload to see theirs.')
            return false
          }
          version.current = res.version
        } else {
          const res = await savePageDraftAction(page!.id, current.doc, version.current, reason)
          if ('error' in res) throw new Error(res.error)
          if (res.conflict) {
            setSaveState('conflict')
            setDialog('conflict')
            return false
          }
          version.current = res.version
        }
        savedRevision.current = revision
        setLastSaved(new Date())
        const newer = stateRef.current.revision !== revision
        setSaveState(newer ? 'dirty' : 'saved')
        // Edits made while this save was in flight get their own save.
        if (newer) setTimeout(() => saveRef.current('autosave'), 400)
        try {
          localStorage.removeItem(backupKey(id))
        } catch {}
        return true
      } catch (err) {
        setSaveState('error')
        toast.error(`Page could not be saved. Your changes are kept on this device. ${err instanceof Error ? err.message : ''}`)
        return false
      } finally {
        saving.current = false
      }
    },
    [state.revision, state.doc, mode, block, page, id]
  )
  saveRef.current = save

  // Local backup of every change + debounced autosave.
  useEffect(() => {
    if (state.revision === savedRevision.current) return
    setSaveState((s) => (s === 'conflict' ? s : 'dirty'))
    try {
      localStorage.setItem(backupKey(id), JSON.stringify({ doc: state.doc, at: Date.now() }))
      if (backupFailed) setBackupFailed(false)
    } catch {
      // Storage full or blocked: say so, since we promise a local copy.
      if (!backupFailed) {
        setBackupFailed(true)
        toast.warning('This browser can’t keep a backup copy of your changes (storage is full or blocked). Save often.')
      }
    }
    if (saveState === 'conflict') return
    const t = setTimeout(() => save('autosave'), AUTOSAVE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.revision])

  // Offer to restore unsaved local changes from a previous session.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(backupKey(id))
      if (!raw) return
      const b = JSON.parse(raw) as { doc: PageDoc; at: number }
      const serverAt = new Date(page?.updated_at ?? block?.updated_at ?? 0).getTime()
      if (b.at > serverAt && JSON.stringify(b.doc) !== JSON.stringify(initialDoc)) {
        setBackup(b)
        setDialog('backup')
      } else localStorage.removeItem(backupKey(id))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dirty = saveState === 'dirty' || saveState === 'error' || saveState === 'saving' || saveState === 'conflict'

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirty])

  async function leave(href: string) {
    if (dirty) {
      const ok = await confirm({ title: 'You have unsaved changes', body: 'Leave without saving? Your latest edits will be lost.', confirmLabel: 'Leave', cancelLabel: 'Stay', danger: true })
      if (!ok) return
      try {
        localStorage.removeItem(backupKey(id))
      } catch {}
    }
    router.push(href)
  }

  async function reloadLatest() {
    const r = await getPageStateAction(page!.id)
    if ('error' in r) return toast.error(r.error)
    version.current = r.version
    dispatch({ type: 'set-doc', doc: r.doc, resetHistory: true })
    savedRevision.current = state.revision
    setSaveState('saved')
    setDialog(null)
    toast.success('Loaded the latest version')
  }

  async function overwrite() {
    const r = await getPageStateAction(page!.id)
    if ('error' in r) return toast.error(r.error)
    version.current = r.version
    setSaveState('dirty')
    setDialog(null)
    await save('save', true)
  }

  async function publish(opts: { status: 'published' | 'scheduled' | 'private'; scheduledAt?: string }) {
    setPublishing(true)
    const res = await publishPageAction(page!.id, { doc: state.doc, version: version.current, ...opts })
    setPublishing(false)
    if ('error' in res) return toast.error(res.error)
    if (res.conflict) {
      setDialog('conflict')
      return
    }
    version.current = res.version
    savedRevision.current = state.revision
    setSaveState('saved')
    setLastSaved(new Date())
    setPage({ ...page!, status: res.status, published_at: new Date().toISOString() })
    setDialog(null)
    try {
      localStorage.removeItem(backupKey(id))
    } catch {}
    toast.success(opts.status === 'scheduled' ? 'Page scheduled' : 'Page published — changes are live')
  }

  async function unpublish() {
    const ok = await confirm({ title: 'Unpublish this page?', body: page?.legacy_key ? 'Visitors will see the original version of this page again.' : 'Visitors will no longer be able to see this page.', confirmLabel: 'Unpublish', danger: true })
    if (!ok) return
    const res = await unpublishPageAction(page!.id)
    if ('error' in res) return toast.error(res.error)
    setPage({ ...page!, status: 'unpublished' })
    toast.success('Page unpublished')
  }

  async function preview() {
    if (dirty && !(await save('save', true))) return
    window.open(`/admin/preview/${page!.id}`, '_blank', 'noopener')
  }

  // ------------------------------------------------------------------ keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      const typing = isTyping(document.activeElement)
      const st = stateRef.current
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save('save', true).then((ok) => ok && toast.success('Saved'))
        return
      }
      if (typing || document.querySelector('dialog[open]')) return
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' })
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        dispatch({ type: 'redo' })
      } else if (st.selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault()
        dispatch({ type: 'remove', id: st.selectedId })
      } else if (st.selectedId && mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        dispatch({ type: 'duplicate', id: st.selectedId })
      } else if (st.selectedId && mod && e.key.toLowerCase() === 'c' && !window.getSelection()?.toString()) {
        const node = findNode(st.doc, st.selectedId)
        if (node) {
          copyToClipboard(node)
          toast.success('Block copied')
        }
      } else if (mod && e.key.toLowerCase() === 'v') {
        const node = readClipboard()
        if (!node) return
        e.preventDefault()
        const where = resolveInsert(st.doc, st.selectedId, node.type, null) ?? (node.type !== 'section' ? null : { parentId: ROOT_ID, index: st.doc.sections.length })
        if (where) dispatch({ type: 'insert', ...where, node })
        else toast.error('Select a section or column to paste this block into.')
      } else if (e.key === 'Escape') {
        dispatch({ type: 'select', id: null })
      } else if (st.selectedId && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        const loc = findParent(st.doc, st.selectedId)
        if (!loc) return
        e.preventDefault()
        dispatch({ type: 'move', id: st.selectedId, parentId: loc.parentId, index: e.key === 'ArrowUp' ? Math.max(0, loc.index - 1) : loc.index + 2 })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save])

  // ------------------------------------------------------------------ helpers
  const requestAdd = useCallback((parentId: string, index: number) => {
    setInsertTarget({ parentId, index })
    setLeftTab('add')
    dispatch({ type: 'select', id: parentId === ROOT_ID ? null : parentId })
  }, [])

  function applyTemplate(key: string) {
    let next: PageDoc
    if (key.startsWith('tpl:')) {
      const t = templates.find((x) => `tpl:${x.id}` === key)
      if (!t) return
      next = cloneDocWithNewIds(t.content)
    } else next = BUILTIN_TEMPLATES.find((t) => t.key === key)?.build() ?? { version: 1, sections: [] }
    dispatch({ type: 'set-doc', doc: next })
    setDialog(null)
    toast.success('Template applied — click any part to edit it. Undo with Ctrl+Z.')
  }

  const saveLabel =
    saveState === 'saving' ? 'Saving…' : saveState === 'dirty' ? 'Unsaved changes' : saveState === 'error' ? (backupFailed ? 'Save failed — not backed up, retry' : 'Save failed — kept on this device') : saveState === 'conflict' ? 'Updated elsewhere' : lastSaved ? `Saved ${Math.max(0, Math.round((Date.now() - lastSaved.getTime()) / 1000)) < 10 ? 'just now' : lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'All changes saved'
  const SaveIcon = saveState === 'error' || saveState === 'conflict' ? CloudOff : Cloud

  const emptyState = (
    <div className="flex min-h-[70vh] items-center justify-center p-8">
      <div className="max-w-lg rounded-xl border border-dashed border-border bg-surface p-8 text-center font-sans">
        <LayoutTemplate className="mx-auto mb-3 size-8 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Your page is empty.</h2>
        <p className="mt-1 text-sm text-muted-foreground">Start from scratch or choose a ready-made design — you can change everything afterwards.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Btn onClick={() => dispatch({ type: 'insert', parentId: ROOT_ID, index: 0, node: makeNode('section') })}><Plus className="size-4" /> Blank page</Btn>
          <Btn variant="primary" onClick={() => setDialog('templates')}><LayoutTemplate className="size-4" /> Choose template</Btn>
        </div>
      </div>
    </div>
  )

  const title = mode === 'page' ? page!.title : block!.name

  return (
    <div className="admin-ui pb-builder-root flex h-dvh flex-col bg-background text-foreground">
      {/* ------------------------------------------------------------ top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-2 sm:px-3">
        <Btn variant="ghost" size="sm" onClick={() => leave(mode === 'page' ? '/admin/pages' : '/admin/blocks')} aria-label={mode === 'page' ? 'Back to pages' : 'Back to reusable blocks'}>
          <ArrowLeft className="size-4" /> <span className="hidden sm:inline">{mode === 'page' ? 'Pages' : 'Blocks'}</span>
        </Btn>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="flex items-center gap-2 truncate text-sm font-semibold">
            <span className="truncate">{title}</span>
            {mode === 'page' ? <StatusBadge status={page!.status} /> : block!.is_global && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">Global block</span>}
          </span>
          <span className={cx('flex items-center gap-1 text-[11px]', saveState === 'error' || saveState === 'conflict' ? 'text-red-600' : 'text-muted-foreground')} aria-live="polite">
            {saveState === 'saving' ? <Spinner className="size-3" /> : <SaveIcon className="size-3" aria-hidden="true" />} {saveLabel}
            {saveState === 'error' && (
              <button type="button" className="ml-1 font-semibold underline" onClick={() => save('save', true)}>Retry</button>
            )}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden items-center md:flex">
            <IconBtn label="Undo (Ctrl+Z)" onClick={() => dispatch({ type: 'undo' })} disabled={state.past.length === 0}><Undo2 /></IconBtn>
            <IconBtn label="Redo (Ctrl+Shift+Z)" onClick={() => dispatch({ type: 'redo' })} disabled={state.future.length === 0}><Redo2 /></IconBtn>
          </div>
          <div className="mx-1 hidden w-36 sm:block">
            <Segmented<Device>
              size="sm"
              label="Preview device"
              value={device}
              onChange={(d) => dispatch({ type: 'device', device: d })}
              options={[
                { value: 'desktop', label: <Monitor />, title: 'Desktop' },
                { value: 'tablet', label: <Tablet />, title: 'Tablet' },
                { value: 'mobile', label: <Smartphone />, title: 'Mobile' },
              ]}
            />
          </div>
          {canDesign && (
            <Menu
              label="Website theme"
              width={300}
              trigger={(t) => (
                <button type="button" {...t} className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-muted md:inline-flex" aria-label="Change website theme">
                  <PaletteIcon className="size-4" /> Theme
                </button>
              )}
            >
              <MenuLabel>Website colour theme</MenuLabel>
              <p className="px-2.5 pb-2 text-[11px] text-slate-500">Applies to every page on the site right away.</p>
              {THEME_PRESETS.map((p) => (
                <MenuItem
                  key={p.key}
                  icon={<span className="flex gap-0.5">{[p.colors.primary, p.colors.accent, p.colors.tint].map((c, i) => <span key={i} className="size-3 rounded-full border border-black/10" style={{ background: c }} />)}</span>}
                  onSelect={async () => {
                    if (!(await confirm({ title: `Switch the website to “${p.name}”?`, body: 'Colours, fonts and button shapes change on every page of the live website. You can switch back any time under Theme.', confirmLabel: 'Apply theme' }))) return
                    const next = applyPreset(theme, p, true)
                    const r = await saveSettingAction('theme', next, themeVersionRef.current)
                    if ('error' in r) return toast.error(r.error)
                    themeVersionRef.current = r.version
                    setTheme(next)
                    toast.success(`Theme “${p.name}” applied to the website`)
                  }}
                >
                  {p.name}
                </MenuItem>
              ))}
              <MenuSeparator />
              <MenuItem href="/admin/theme" icon={<Settings2 />}>Customise theme…</MenuItem>
            </Menu>
          )}
          {mode === 'page' && (
            <>
              <IconBtn label="Version history" onClick={() => setDialog('history')}><History /></IconBtn>
              <IconBtn label="Page settings & SEO" onClick={() => setDialog(seoOnly ? 'seo' : 'settings')}><Settings2 /></IconBtn>
              <Menu label="More page actions" width={250} trigger={(t) => <IconBtn label="More actions" {...t}><MoreHorizontal /></IconBtn>}>
                <MenuItem icon={<LayoutTemplate />} onSelect={() => setDialog('templates')}>Apply a template…</MenuItem>
                <MenuItem icon={<Save />} onSelect={() => setDialog('template')}>Save page as template…</MenuItem>
                <MenuItem icon={<ExternalLink />} href={'/' + page!.slug} external>Open live page</MenuItem>
                {page!.legacy_key && (
                  <MenuItem
                    icon={<RefreshCw />}
                    onSelect={async () => {
                      if (!(await confirm({ title: 'Re-import from the original page?', body: 'Your current draft will be replaced with the latest content from the classic editor. The current draft stays in version history.', confirmLabel: 'Re-import' }))) return
                      const r = await reimportLegacyPageAction(page!.id)
                      if ('error' in r) return toast.error(r.error)
                      version.current = r.version
                      dispatch({ type: 'set-doc', doc: r.doc })
                      toast.success('Re-imported')
                    }}
                  >
                    Re-import from original page
                  </MenuItem>
                )}
                {(page!.status === 'published' || page!.status === 'scheduled' || page!.status === 'private') && (
                  <>
                    <MenuSeparator />
                    <MenuItem danger icon={<EyeOff />} onSelect={unpublish}>Unpublish</MenuItem>
                  </>
                )}
              </Menu>
              <Btn size="sm" onClick={preview} className="hidden sm:inline-flex"><Eye className="size-4" /> Preview</Btn>
            </>
          )}
          <Btn size="sm" onClick={() => save('save', true).then((ok) => ok && toast.success(mode === 'block' ? 'Block saved — pages using it are updated' : 'Draft saved'))} disabled={saveState === 'saving'}>
            {mode === 'block' ? 'Save block' : 'Save draft'}
          </Btn>
          {mode === 'page' && canPublish && (
            <Btn size="sm" variant="primary" onClick={() => setDialog('publish')}>
              Publish <ChevronDown className="size-3.5" />
            </Btn>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------------ body */}
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex" aria-label="Add blocks and page structure">
          <div className="border-b border-border p-2">
            <Segmented size="sm" label="Left panel" value={leftTab} onChange={setLeftTab} options={[{ value: 'add', label: <><Plus /> Add</> }, { value: 'layers', label: <><LayersIcon /> Layers</> }]} />
          </div>
          <div className="min-h-0 flex-1">
            {leftTab === 'add' ? (
              <Palette
                doc={doc}
                selectedId={selectedId}
                target={insertTarget}
                dispatch={dispatch}
                saved={saved}
                allowSections
                onAdded={() => setInsertTarget(null)}
                onDeleteSaved={async (bid) => {
                  if (!(await confirm({ title: 'Delete this saved block?', body: 'Copies already placed on pages stay. Pages using it as a global block will show nothing in its place.', confirmLabel: 'Delete', danger: true }))) return
                  const r = await deleteReusableBlockAction(bid)
                  if ('error' in r) return toast.error(r.error)
                  setSaved((s) => s.filter((b) => b.id !== bid))
                }}
              />
            ) : (
              <Layers doc={doc} selectedId={selectedId} dispatch={dispatch} globalNames={globalNames} />
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col" aria-label="Page canvas">
          <div ref={setToolbarSlot} className="z-20 shrink-0 border-b border-border bg-surface px-3 py-2 shadow-sm empty:hidden [&>div]:mx-auto [&>div]:max-w-5xl" aria-label="Text formatting" />
          <div className="min-h-0 flex-1">
          <Canvas
            toolbarSlot={toolbarSlot}
            state={state}
            dispatch={dispatch}
            data={data}
            theme={theme}
            pageId={mode === 'page' ? page!.id : ''}
            onRequestAdd={requestAdd}
            onCopy={(node) => {
              copyToClipboard(node)
              toast.success('Block copied — paste with Ctrl+V')
            }}
            onSaveReusable={(node) => {
              setReusableNode(node)
              setDialog('reusable')
            }}
            empty={mode === 'page' ? emptyState : undefined}
          />
          </div>
        </main>

        <aside className="hidden w-80 shrink-0 border-l border-border bg-surface lg:block" aria-label="Block settings">
          {selected ? (
            <Inspector
              key={selected.id}
              doc={doc}
              node={selected}
              device={device}
              onSelect={(sid) => dispatch({ type: 'select', id: sid })}
              onProp={(k, v) => dispatch(setProp(selected.id, k, v))}
              onProps={(patch) => dispatch({ type: 'update-node', id: selected.id, fn: (n) => ({ ...n, props: { ...n.props, ...patch } }) })}
              onStyle={(d, patch) => dispatch(setStyle(selected.id, d, patch))}
              onNode={(fn, key) => dispatch({ type: 'update-node', id: selected.id, fn, key })}
              globalName={selected.type === 'global' ? globalNames[selected.props.blockId] : undefined}
              editingId={state.editingId}
              onEditGlobal={(bid) => leave(`/admin/builder/block/${bid}`)}
            />
          ) : (
            <div className="flex flex-col gap-3 p-5 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Nothing selected</p>
              <p>Click any part of the page to edit its content and style. Double-click text to type directly on the page.</p>
              <ul className="list-disc space-y-1 pl-4 text-xs">
                <li>Drag blocks from the left panel onto the page</li>
                <li>Use the toolbar above a selected block to move, duplicate or delete it</li>
                <li>Switch to tablet or mobile at the top to adjust those layouts</li>
                <li>Ctrl+Z undo · Ctrl+Shift+Z redo · Ctrl+S save · Delete removes a block</li>
              </ul>
              {mode === 'page' && (
                <Btn size="sm" onClick={() => setDialog('templates')}><LayoutTemplate className="size-4" /> Browse page templates</Btn>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ------------------------------------------------------------ dialogs */}
      {mode === 'page' && (
        <>
          <PageSettingsDialog
            open={dialog === 'settings' || dialog === 'seo'}
            defaultTab={dialog === 'seo' ? 'seo' : 'general'}
            seoOnly={seoOnly}
            onClose={() => setDialog(null)}
            page={page!}
            siteUrl={siteUrl}
            onSaved={(p) => {
              setPage({ ...page!, ...p })
              version.current += 1
              router.refresh()
            }}
          />
          <HistoryDialog
            open={dialog === 'history'}
            onClose={() => setDialog(null)}
            pageId={page!.id}
            data={data}
            onRestored={(d, v) => {
              version.current = v
              dispatch({ type: 'set-doc', doc: d })
              savedRevision.current = state.revision + 1
              setSaveState('saved')
            }}
          />
          <PublishDialog open={dialog === 'publish'} onClose={() => setDialog(null)} onPublish={publish} status={page!.status} busy={publishing} />
          <Dialog
            open={dialog === 'templates'}
            onClose={() => setDialog(null)}
            title="Choose a page template"
            description={doc.sections.length ? 'Applying a template replaces the current page content. You can undo it with Ctrl+Z.' : 'Pick a design to start from. Everything can be edited afterwards.'}
            size="xl"
          >
            <TemplatePicker value="" onChange={async (k) => {
              if (doc.sections.length && !(await confirm({ title: 'Replace the current content?', body: 'The page content will be replaced by the template. You can undo this.', confirmLabel: 'Apply template' }))) return
              applyTemplate(k)
            }} custom={templates} theme={theme} data={data} />
          </Dialog>
          <SaveTemplateDialog open={dialog === 'template'} onClose={() => setDialog(null)} doc={doc} />
        </>
      )}

      <SaveReusableDialog
        open={dialog === 'reusable'}
        node={reusableNode}
        onClose={() => setDialog(null)}
        onSaved={(b, replace) => {
          setSaved((s) => [b, ...s])
          if (replace && reusableNode && b.is_global) {
            setData((d) => ({ ...d, globalBlocks: { ...(d.globalBlocks ?? {}), [b.id]: { name: b.name, block: b.block } } }))
            dispatch({ type: 'update-node', id: reusableNode.id, fn: () => makeNode('global', { props: { blockId: b.id } }) })
          }
        }}
      />

      <Dialog
        open={dialog === 'conflict'}
        onClose={() => setDialog(null)}
        title="This page has been updated elsewhere"
        description="Someone (or another browser tab) saved a newer version. Your changes are kept on this device for now."
        size="sm"
        footer={
          <>
            <Btn variant="danger" onClick={overwrite}>Keep mine (overwrite)</Btn>
            <Btn variant="primary" onClick={reloadLatest}><RefreshCw className="size-4" /> Reload latest version</Btn>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">Reloading discards your unsaved edits. Overwriting replaces the other changes — they remain available in version history.</p>
      </Dialog>

      <Dialog
        open={dialog === 'backup'}
        onClose={() => {
          setDialog(null)
          try {
            localStorage.removeItem(backupKey(id))
          } catch {}
        }}
        title="Restore unsaved changes?"
        description={backup ? `Changes from ${new Date(backup.at).toLocaleString()} on this device were never saved.` : ''}
        size="sm"
        footer={
          <>
            <Btn onClick={() => { setDialog(null); try { localStorage.removeItem(backupKey(id)) } catch {} }}>Discard them</Btn>
            <Btn variant="primary" onClick={() => { if (backup) dispatch({ type: 'set-doc', doc: backup.doc }); setDialog(null) }}>Restore my changes</Btn>
          </>
        }
      />

    </div>
  )
}

function SaveTemplateDialog({ open, onClose, doc }: { open: boolean; onClose: () => void; doc: PageDoc }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Save as template"
      description="Reuse this page’s layout when creating new pages (Create page → Templates → My templates)."
      size="sm"
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" disabled={busy || !name.trim()} onClick={async () => {
            setBusy(true)
            const r = await saveTemplateAction(name, desc, doc)
            setBusy(false)
            if ('error' in r) return toast.error(r.error)
            toast.success('Template saved')
            setName('')
            setDesc('')
            onClose()
          }}>Save template</Btn>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FieldRow label="Template name" htmlFor="tpl-name"><input id="tpl-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Project page" /></FieldRow>
        <FieldRow label="Description (optional)" htmlFor="tpl-desc"><input id="tpl-desc" className={inputClass} value={desc} onChange={(e) => setDesc(e.target.value)} /></FieldRow>
      </div>
    </Dialog>
  )
}

function SaveReusableDialog({ open, node, onClose, onSaved }: { open: boolean; node: BuilderNode | null; onClose: () => void; onSaved: (b: ReusableBlock, replace: boolean) => void }) {
  const [name, setName] = useState('')
  const [global, setGlobal] = useState(false)
  const [replace, setReplace] = useState(true)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (open && node) {
      setName(node.type === 'section' && node.props.label ? node.props.label : BLOCKS[node.type]?.label ?? 'Block')
      setGlobal(false)
    }
  }, [open, node])
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Save as reusable block"
      size="sm"
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" disabled={busy || !name.trim() || !node} onClick={async () => {
            setBusy(true)
            const r = await saveReusableBlockAction(name, node!, global)
            setBusy(false)
            if ('error' in r) return toast.error(r.error)
            toast.success(global ? 'Global block created' : 'Saved to your blocks')
            onSaved(r.block, replace)
            onClose()
          }}>Save</Btn>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FieldRow label="Name" htmlFor="rb-name"><input id="rb-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main call to action" /></FieldRow>
        <Toggle checked={global} onChange={setGlobal} label="Global block — editing it later updates every page that uses it" />
        {global && <Toggle checked={replace} onChange={setReplace} label="Replace this block on the page with the global version" />}
        <p className="text-xs text-muted-foreground">Find it later under Add → Saved.</p>
      </div>
    </Dialog>
  )
}

