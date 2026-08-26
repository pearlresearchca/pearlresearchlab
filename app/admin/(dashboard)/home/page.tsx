import { getPageContent, text } from '@/lib/cms/queries'
import { AdminCard, Field, TextArea, TextInput } from '@/components/admin/ui'
import { SubmitButton } from '@/components/admin/submit-button'
import { ImageField } from '@/components/admin/image-field'
import { updateHomeFeatureImageAction, updateHomeHeroImageAction, updateHomeTextAction } from './actions'
import Link from 'next/link'

export default async function HomeAdminPage() {
  const content = await getPageContent('home')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Home page</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The five research stream cards are managed on{' '}
          <Link href="/admin/research" className="font-medium text-primary">Research areas</Link>. The partner logo strip is managed on{' '}
          <Link href="/admin/partners" className="font-medium text-primary">Partner logos</Link>.
        </p>
      </div>

      <AdminCard title="Images">
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

      <form action={updateHomeTextAction}>
        <AdminCard title="Hero section">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Eyebrow" htmlFor="hero_eyebrow">
              <TextInput id="hero_eyebrow" name="hero_eyebrow" defaultValue={text(content, 'hero_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="hero_title">
              <TextInput id="hero_title" name="hero_title" defaultValue={text(content, 'hero_title')} />
            </Field>
            <Field label="Intro" htmlFor="hero_intro">
              <TextInput id="hero_intro" name="hero_intro" defaultValue={text(content, 'hero_intro')} />
            </Field>
            <Field label="Hero image caption — line 1" htmlFor="hero_image_caption_1">
              <TextInput id="hero_image_caption_1" name="hero_image_caption_1" defaultValue={text(content, 'hero_image_caption_1')} />
            </Field>
            <Field label="Hero image caption — line 2" htmlFor="hero_image_caption_2">
              <TextInput id="hero_image_caption_2" name="hero_image_caption_2" defaultValue={text(content, 'hero_image_caption_2')} />
            </Field>
          </div>
        </AdminCard>

        <div className="h-6" />

        <AdminCard title="Purpose statement">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Eyebrow" htmlFor="statement_eyebrow">
              <TextInput id="statement_eyebrow" name="statement_eyebrow" defaultValue={text(content, 'statement_eyebrow')} />
            </Field>
            <div />
            <Field label="Statement" htmlFor="statement_title">
              <TextArea id="statement_title" name="statement_title" rows={3} defaultValue={text(content, 'statement_title')} className="col-span-2" />
            </Field>
          </div>
        </AdminCard>

        <div className="h-6" />

        <AdminCard title="Research streams section">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Eyebrow" htmlFor="streams_eyebrow">
              <TextInput id="streams_eyebrow" name="streams_eyebrow" defaultValue={text(content, 'streams_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="streams_title">
              <TextInput id="streams_title" name="streams_title" defaultValue={text(content, 'streams_title')} />
            </Field>
            <Field label="Body" htmlFor="streams_body">
              <TextArea id="streams_body" name="streams_body" rows={2} defaultValue={text(content, 'streams_body')} />
            </Field>
          </div>
        </AdminCard>

        <div className="h-6" />

        <AdminCard title="Featured project section">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Eyebrow" htmlFor="feature_eyebrow">
              <TextInput id="feature_eyebrow" name="feature_eyebrow" defaultValue={text(content, 'feature_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="feature_title">
              <TextInput id="feature_title" name="feature_title" defaultValue={text(content, 'feature_title')} />
            </Field>
            <Field label="Text" htmlFor="feature_text">
              <TextArea id="feature_text" name="feature_text" rows={2} defaultValue={text(content, 'feature_text')} />
            </Field>
          </div>
        </AdminCard>

        <div className="h-6" />

        <AdminCard title="Partners & call to action">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Partners strip eyebrow" htmlFor="partners_eyebrow">
              <TextInput id="partners_eyebrow" name="partners_eyebrow" defaultValue={text(content, 'partners_eyebrow')} />
            </Field>
            <div />
            <Field label="CTA eyebrow" htmlFor="cta_eyebrow">
              <TextInput id="cta_eyebrow" name="cta_eyebrow" defaultValue={text(content, 'cta_eyebrow')} />
            </Field>
            <div />
            <Field label="CTA title" htmlFor="cta_title">
              <TextInput id="cta_title" name="cta_title" defaultValue={text(content, 'cta_title')} />
            </Field>
            <Field label="CTA text" htmlFor="cta_text">
              <TextArea id="cta_text" name="cta_text" rows={2} defaultValue={text(content, 'cta_text')} />
            </Field>
          </div>
        </AdminCard>

        <div className="mt-6">
          <SubmitButton>Save changes</SubmitButton>
        </div>
      </form>
    </div>
  )
}
