import { PermissionMatrix } from '@/components/admin/permission-matrix'
import { AdminCard, RoleBadge, Select, SectionCheckboxes } from '@/components/admin/ui'
import { SubmitButton } from '@/components/admin/submit-button'
import { ActionForm } from '@/components/admin/action-form'
import { removeUserAccessAction, updateUserAccessAction } from './actions'
import type { AppUser } from '@/lib/cms/types'

export function UserDetail({ user, isSelf }: { user: AppUser; isSelf: boolean }) {
  return (
    <AdminCard
      title={user.full_name || user.email}
      description={`${user.email} · joined ${new Date(user.created_at).toLocaleDateString()}`}
      action={
        <div className="flex items-center gap-3">
          <RoleBadge role={user.role} />
          {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Current access</p>
          <PermissionMatrix role={user.role} sections={user.sections} />
        </div>

        {!isSelf && (
          <div className="border-t border-border pt-5">
            <p className="mb-3 text-sm font-medium text-foreground">Edit access</p>
            <ActionForm action={updateUserAccessAction.bind(null, user.id)} successMessage="Permissions updated" className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label htmlFor={`role-${user.id}`} className="text-sm font-medium text-foreground">Role</label>
                <Select id={`role-${user.id}`} name="role" defaultValue={user.role} className="w-36">
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
              <SectionCheckboxes defaultValue={user.sections} />
              <div>
                <SubmitButton pendingText="Saving…">Save permissions</SubmitButton>
              </div>
            </ActionForm>

            <div className="mt-5 border-t border-border pt-5">
              <ActionForm action={removeUserAccessAction.bind(null, user.id)} successMessage="Access removed">
                <SubmitButton variant="danger" className="!px-3 !py-1.5 text-xs" pendingText="Removing…">Remove access</SubmitButton>
              </ActionForm>
            </div>
          </div>
        )}
      </div>
    </AdminCard>
  )
}
