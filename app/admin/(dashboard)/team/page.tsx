import { PageHeader } from '@/components/admin/page-header'
import { CorePageNotice } from '@/components/admin/core-page-notice'
import { Users2 } from 'lucide-react'
import { getAllTeamMembers, getPageContent, getUserDirectory, text } from '@/lib/cms/queries'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { AdminCard, Field, LastEdited, TextArea, TextInput } from '@/components/admin/ui'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmitButton } from '@/components/admin/submit-button'
import { ImageField } from '@/components/admin/image-field'
import { ActionForm } from '@/components/admin/action-form'
import type { TeamGroupKey, TeamMember, UserDirectory } from '@/lib/cms/types'
import {
  addTeamMemberAction,
  deleteTeamMemberAction,
  updateTeamMemberAction,
  updateTeamMemberImageAction,
  updateTeamTextAction,
} from './actions'

const GROUPS: { key: TeamGroupKey; label: string }[] = [
  { key: 'leadership', label: 'Leadership & coordination' },
  { key: 'tfs', label: 'Transforming Food Systems team' },
  { key: 'ift', label: 'Inter-Facility Transfer System team' },
  { key: 'past', label: 'Past contributors' },
]

function MemberCard({ member, users }: { member: TeamMember; users: UserDirectory }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-col gap-6 sm:flex-row">
        <ImageField
          label="Photo"
          currentUrl={member.image_url}
          currentKey={member.image_key}
          onUpload={updateTeamMemberImageAction.bind(null, member.id)}
          aspect="aspect-[4/5]"
        />
        <ActionForm action={updateTeamMemberAction.bind(null, member.id)} className="flex flex-1 flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" htmlFor={`name-${member.id}`}>
              <TextInput id={`name-${member.id}`} name="name" defaultValue={member.name} />
            </Field>
            <Field label="Role" htmlFor={`role-${member.id}`}>
              <TextInput id={`role-${member.id}`} name="role" defaultValue={member.role} />
            </Field>
          </div>
          <Field label="Bio" htmlFor={`bio-${member.id}`} hint="Separate paragraphs with a blank line.">
            <TextArea id={`bio-${member.id}`} name="bio" rows={5} defaultValue={member.bio_paragraphs.join('\n\n')} />
          </Field>
          <div className="flex flex-wrap items-start gap-4">
            <Field label="Sort order" htmlFor={`sort-${member.id}`}>
              <TextInput id={`sort-${member.id}`} name="sort_order" type="number" defaultValue={member.sort_order} className="w-24" />
            </Field>
            <label className="mt-[26px] flex h-[42px] items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="active" defaultChecked={member.active} className="switch" />
              Visible on site
            </label>
          </div>
          <div className="flex items-center justify-between">
            <LastEdited at={member.updated_at} by={member.updated_by} users={users} />
            <SubmitButton>Save</SubmitButton>
          </div>
        </ActionForm>
      </div>
      <ActionForm action={deleteTeamMemberAction.bind(null, member.id)} className="mt-2 flex justify-end">
        <SubmitButton variant="danger" className="!px-3 !py-1.5 text-xs">Delete</SubmitButton>
      </ActionForm>
    </div>
  )
}

export default async function TeamAdminPage() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'team')) return <NoSectionAccess label="the Team page" />

  const [content, members, users] = await Promise.all([getPageContent('team'), getAllTeamMembers(), getUserDirectory()])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader group="Core pages" title="Team page" description="The Team page text and every member: photos, roles and bios." icon={<Users2 />} />
      <CorePageNotice legacyKey="team" label="Team" />

      <ActionForm action={updateTeamTextAction}>
        <AdminCard title="Team page copy">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Hero kicker" htmlFor="hero_kicker"><TextInput id="hero_kicker" name="hero_kicker" defaultValue={text(content, 'hero_kicker')} /></Field>
            <div />
            <Field label="Hero title" htmlFor="hero_title"><TextInput id="hero_title" name="hero_title" defaultValue={text(content, 'hero_title')} /></Field>
            <Field label="Hero intro" htmlFor="hero_intro"><TextArea id="hero_intro" name="hero_intro" rows={2} defaultValue={text(content, 'hero_intro')} /></Field>
            <Field label="Intro eyebrow" htmlFor="intro_eyebrow"><TextInput id="intro_eyebrow" name="intro_eyebrow" defaultValue={text(content, 'intro_eyebrow')} /></Field>
            <Field label="Intro title" htmlFor="intro_title"><TextInput id="intro_title" name="intro_title" defaultValue={text(content, 'intro_title')} /></Field>
            <Field label="Intro body" htmlFor="intro_body" className="col-span-2"><TextArea id="intro_body" name="intro_body" rows={2} defaultValue={text(content, 'intro_body')} /></Field>
            <Field label="Leadership eyebrow" htmlFor="leadership_eyebrow"><TextInput id="leadership_eyebrow" name="leadership_eyebrow" defaultValue={text(content, 'leadership_eyebrow')} /></Field>
            <Field label="Leadership title" htmlFor="leadership_title"><TextInput id="leadership_title" name="leadership_title" defaultValue={text(content, 'leadership_title')} /></Field>
            <Field label="Research team eyebrow" htmlFor="research_team_eyebrow"><TextInput id="research_team_eyebrow" name="research_team_eyebrow" defaultValue={text(content, 'research_team_eyebrow')} /></Field>
            <Field label="Research team title" htmlFor="research_team_title"><TextInput id="research_team_title" name="research_team_title" defaultValue={text(content, 'research_team_title')} /></Field>
            <Field label="CTA eyebrow" htmlFor="cta_eyebrow"><TextInput id="cta_eyebrow" name="cta_eyebrow" defaultValue={text(content, 'cta_eyebrow')} /></Field>
            <Field label="CTA title" htmlFor="cta_title"><TextInput id="cta_title" name="cta_title" defaultValue={text(content, 'cta_title')} /></Field>
          </div>
          <div className="mt-4">
            <SubmitButton>Save</SubmitButton>
          </div>
        </AdminCard>
      </ActionForm>

      {GROUPS.map((group) => {
        const groupMembers = members.filter((m) => m.group_key === group.key)
        return (
          <AdminCard
            key={group.key}
            title={group.label}
            action={<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{groupMembers.length}</span>}
          >
            <div className="flex flex-col gap-4">
              {groupMembers.map((member) => (
                <MemberCard key={member.id} member={member} users={users} />
              ))}
            </div>
            <details className="mt-4 group">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary">+ Add a team member</summary>
              <ActionForm action={addTeamMemberAction.bind(null, group.key)} className="mt-3 flex flex-col gap-3 rounded-lg bg-muted/40 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name" htmlFor={`new-name-${group.key}`}>
                    <TextInput id={`new-name-${group.key}`} name="name" required />
                  </Field>
                  <Field label="Role" htmlFor={`new-role-${group.key}`}>
                    <TextInput id={`new-role-${group.key}`} name="role" required />
                  </Field>
                </div>
                <Field label="Bio" htmlFor={`new-bio-${group.key}`} hint="Separate paragraphs with a blank line. You can add a photo after saving.">
                  <TextArea id={`new-bio-${group.key}`} name="bio" rows={4} />
                </Field>
                <Field label="Sort order" htmlFor={`new-sort-${group.key}`}>
                  <TextInput id={`new-sort-${group.key}`} name="sort_order" type="number" defaultValue={groupMembers.length} className="w-24" />
                </Field>
                <div>
                  <SubmitButton>Add member</SubmitButton>
                </div>
              </ActionForm>
            </details>
          </AdminCard>
        )
      })}
    </div>
  )
}
