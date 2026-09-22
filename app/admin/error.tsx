'use client'

// Catches failures in the admin layouts themselves (e.g. the sign-in check
// during an outage), which a segment's own error.tsx can't catch.
export { AdminError as default } from '@/components/admin/admin-error'
