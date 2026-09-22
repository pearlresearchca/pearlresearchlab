'use client'

import { useId, useRef, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import type { TeamMember } from '@/lib/cms/types'

// Team members as compact photo cards; the full bio opens in a native <dialog>
// (focus trapping, Esc to close and inert background come for free).
export function TeamGrid({ members, photos }: { members: TeamMember[]; photos: Record<string, React.ReactNode> }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameId = useId()
  const [active, setActive] = useState<TeamMember | null>(null)

  function open(member: TeamMember) {
    setActive(member)
    dialogRef.current?.showModal()
  }

  return (
    <>
      <ul className="team-grid">
        {members.map((member) => (
          <li key={member.id}>
            <button type="button" className="team-card" onClick={() => open(member)} aria-haspopup="dialog">
              <span className="team-card-photo">{photos[member.id]}</span>
              <span className="team-card-body">
                <span className="team-card-role">{member.role}</span>
                <span className="team-card-name">{member.name}</span>
                {member.bio_paragraphs.length > 0 && (
                  <span className="team-card-more">Read bio <ArrowUpRight aria-hidden="true" /></span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="team-dialog"
        aria-labelledby={nameId}
        onClose={() => setActive(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close()
        }}
      >
        {active && (
          <div className="team-dialog-inner">
            <div className="team-dialog-photo">{photos[active.id]}</div>
            <div className="team-dialog-copy">
              <p className="role-tag">{active.role}</p>
              <h2 id={nameId}>{active.name}</h2>
              {active.bio_paragraphs.map((p) => <p key={p}>{p}</p>)}
            </div>
            <button type="button" className="team-dialog-close" onClick={() => dialogRef.current?.close()} aria-label="Close bio">
              <X aria-hidden="true" />
            </button>
          </div>
        )}
      </dialog>
    </>
  )
}
