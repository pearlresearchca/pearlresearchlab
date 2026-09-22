import { PageHeader } from '@/components/admin/page-header'
import { CorePageNotice } from '@/components/admin/core-page-notice'
import Link from 'next/link'
import { Home as HomeIcon, Image as ImageIcon, Sparkles, Users } from 'lucide-react'
import { getPageContent, getUserDirectory, latestEdit, text } from '@/lib/cms/queries'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { AdminCard, Field, LastEdited, TextArea, TextInput } from '@/components/admin/ui'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmitButton } from '@/components/admin/submit-button'
import { ImageField } from '@/components/admin/image-field'
import { ActionForm } from '@/components/admin/action-form'
import { updateHomeFeatureImageAction, updateHomeHeroImageAction, updateHomeTextAction } from './actions'

export default async function HomeAdminPage() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'home')) return <NoSectionAccess label="the Home page" />

  const [content, users] = await Promise.all([getPageContent('home'), getUserDirectory()])
  const edited = (keys: string[]) => {
    const e = latestEdit(content, keys)
    return <LastEdited at={e?.at} by={e?.by} users={users} />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader group="Core pages" title="Home page" description="Text and images of the homepage. Research cards come from Research areas; logos from Partner logos." icon={<HomeIcon />} />
      <CorePageNotice legacyKey="home" label="Home" />

      <AdminCard title="Images" icon={<ImageIcon className="size-4" aria-hidden="true" />}>
        <div className="flex flex-wrap gap-8">
          <ImageField
            label="Hero image"
            currentUrl={content.hero_image?.value ?? null}
            currentKey={content.hero_image?.image_key ?? null}
            onUpload={updateHomeHeroImageAction}
          />
          <ImageField
            label="Featured project image"
            currentUrl={content.feature_image?.value ?? null}
            currentKey={content.feature_image?.image_key ?? null}
            onUpload={updateHomeFeatureImageAction}
          />
        </div>
      </AdminCard>

      <ActionForm action={updateHomeTextAction} className="flex flex-col gap-6">
        <AdminCard title="Hero section" icon={<Sparkles className="size-4" aria-hidden="true" />} action={edited(['hero_eyebrow', 'hero_title', 'hero_intro', 'hero_image_caption_1', 'hero_image_caption_2'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Eyebrow" htmlFor="hero_eyebrow">
              <TextInput id="hero_eyebrow" name="hero_eyebrow" defaultValue={text(content, 'hero_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="hero_title" className="col-span-2">
              <TextInput id="hero_title" name="hero_title" defaultValue={text(content, 'hero_title')} />
            </Field>
            <Field label="Intro" htmlFor="hero_intro" className="col-span-2">
              <TextArea id="hero_intro" name="hero_intro" rows={2} defaultValue={text(content, 'hero_intro')} />
            </Field>
            <Field label="Hero image caption — line 1" htmlFor="hero_image_caption_1">
              <TextInput id="hero_image_caption_1" name="hero_image_caption_1" defaultValue={text(content, 'hero_image_caption_1')} />
            </Field>
            <Field label="Hero image caption — line 2" htmlFor="hero_image_caption_2">
              <TextInput id="hero_image_caption_2" name="hero_image_caption_2" defaultValue={text(content, 'hero_image_caption_2')} />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Purpose statement" action={edited(['statement_eyebrow', 'statement_title'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Eyebrow" htmlFor="statement_eyebrow">
              <TextInput id="statement_eyebrow" name="statement_eyebrow" defaultValue={text(content, 'statement_eyebrow')} />
            </Field>
            <div />
            <Field label="Statement" htmlFor="statement_title" className="col-span-2">
              <TextArea id="statement_title" name="statement_title" rows={3} defaultValue={text(content, 'statement_title')} />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Research streams section" action={edited(['streams_eyebrow', 'streams_title', 'streams_body'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Eyebrow" htmlFor="streams_eyebrow">
              <TextInput id="streams_eyebrow" name="streams_eyebrow" defaultValue={text(content, 'streams_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="streams_title" className="col-span-2">
              <TextInput id="streams_title" name="streams_title" defaultValue={text(content, 'streams_title')} />
            </Field>
            <Field label="Body" htmlFor="streams_body" className="col-span-2">
              <TextArea id="streams_body" name="streams_body" rows={2} defaultValue={text(content, 'streams_body')} />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Featured project section" action={edited(['feature_eyebrow', 'feature_title', 'feature_text'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Eyebrow" htmlFor="feature_eyebrow">
              <TextInput id="feature_eyebrow" name="feature_eyebrow" defaultValue={text(content, 'feature_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="feature_title" className="col-span-2">
              <TextInput id="feature_title" name="feature_title" defaultValue={text(content, 'feature_title')} />
            </Field>
            <Field label="Text" htmlFor="feature_text" className="col-span-2">
              <TextArea id="feature_text" name="feature_text" rows={2} defaultValue={text(content, 'feature_text')} />
            </Field>
          </div>
        </AdminCard>

        <AdminCard
          title="Partners & call to action"
          icon={<Users className="size-4" aria-hidden="true" />}
          action={edited(['partners_eyebrow', 'cta_eyebrow', 'cta_title', 'cta_text'])}
        >
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Partners strip eyebrow" htmlFor="partners_eyebrow">
              <TextInput id="partners_eyebrow" name="partners_eyebrow" defaultValue={text(content, 'partners_eyebrow')} />
            </Field>
            <div />
            <Field label="CTA eyebrow" htmlFor="cta_eyebrow">
              <TextInput id="cta_eyebrow" name="cta_eyebrow" defaultValue={text(content, 'cta_eyebrow')} />
            </Field>
            <div />
            <Field label="CTA title" htmlFor="cta_title" className="col-span-2">
              <TextInput id="cta_title" name="cta_title" defaultValue={text(content, 'cta_title')} />
            </Field>
            <Field label="CTA text" htmlFor="cta_text" className="col-span-2">
              <TextArea id="cta_text" name="cta_text" rows={2} defaultValue={text(content, 'cta_text')} />
            </Field>
          </div>
        </AdminCard>

        <div className="sticky bottom-4 z-10 ml-auto flex w-fit items-center gap-4 rounded-xl border border-border bg-surface py-2 pl-4 pr-2 shadow-[0_12px_32px_-12px_rgba(15,23,42,.35)]">
          <span className="hidden text-xs text-muted-foreground sm:inline">Saves every section above</span>
          <SubmitButton>Save changes</SubmitButton>
        </div>
      </ActionForm>
    </div>
  )
}
