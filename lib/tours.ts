// Guided tours of the admin and page builder (see /admin/tours). Each step
// points at a real control on the screen; the tour runner dims everything
// else and explains what that control does.

export type TourTarget =
  // CSS selector of the element to highlight
  | string
  // A card on the screen, found by its heading text
  | { heading: string }

export type TourStep = {
  title: string
  body: string
  // Nothing to highlight: the step is shown as a centred card.
  target?: TourTarget
  // Clicked before the step is shown (e.g. select a block so its settings open).
  click?: string
  // Short hands-on suggestion shown under the explanation.
  tryIt?: string
}

export type Tour = {
  id: string
  title: string
  description: string
  group: 'Get started' | 'Build pages' | 'Design' | 'Content'
  // Where the tour runs. "builder" opens the homepage in the page builder.
  href: string | 'builder'
  steps: TourStep[]
}

export const TOURS: Tour[] = [
  {
    id: 'admin-basics',
    title: 'Find your way around',
    description: 'The menu, search and shortcuts you’ll use every day.',
    group: 'Get started',
    href: '/admin',
    steps: [
      { title: 'Welcome to the PEARL admin', body: 'This is where you manage everything on the website: pages, design, content and messages. This quick tour shows you where things live.' },
      { target: '[data-tour="sidebar"]', title: 'The main menu', body: 'Every area of the admin is listed here, grouped by what it does. The highlighted item shows where you are.' },
      { target: '[data-tour="nav-group-website"]', title: 'Website', body: 'Pages, navigation, media, theme, header & footer and site settings — everything that shapes how the site looks.' },
      { target: '[data-tour="nav-group-content"]', title: 'Content', body: 'Research areas, projects, team members, values and partner logos. Pages show these through data blocks, so editing them here updates every page that uses them.' },
      { target: '[data-tour="quick-search"]', title: 'Jump anywhere', body: 'Type the name of any admin screen to go straight to it.', tryIt: 'Press Ctrl + K from anywhere in the admin.' },
      { target: '[data-tour="view-site"]', title: 'See the live website', body: 'Opens the public site in a new tab, so you can check your published changes.' },
      { target: '[data-tour="account-menu"]', title: 'Your account', body: 'Update your profile or sign out. Administrators also manage users and access here.' },
      { target: '[data-tour="nav-tours"]', title: 'Come back any time', body: 'All guided tours live under Help → Guided tours. Pick another topic whenever you’re ready.' },
    ],
  },
  {
    id: 'manage-pages',
    title: 'Create and manage pages',
    description: 'Add pages, find them quickly and publish when ready.',
    group: 'Build pages',
    href: '/admin/pages',
    steps: [
      { target: '[data-tour="pages-status"]', title: 'Pages at a glance', body: 'See how many pages are published, still drafts or scheduled. Click a tile to filter the list.' },
      { target: '[data-tour="pages-filters"]', title: 'Search and filter', body: 'Find a page by name or URL, or filter by status and whether it appears in the menu.' },
      { target: '[data-tour="pages-create"]', title: 'Create a page', body: 'Start from a blank page or a ready-made template, choose its URL, and optionally add it to the menu.' },
      { target: '[data-tour="pages-row"]', title: 'Each page', body: 'The name opens the page builder. Underneath is the page’s web address; next to it, its status and when it was last changed.' },
      { target: '[data-tour="pages-row-actions"]', title: 'Page actions', body: 'Preview, edit and delete, plus more options: publish or unpublish, change the URL, SEO settings and duplicate.' },
    ],
  },
  {
    id: 'page-builder',
    title: 'Design a page in the builder',
    description: 'Add blocks, edit them on the page, then save and publish.',
    group: 'Build pages',
    href: 'builder',
    steps: [
      { title: 'The page builder', body: 'Build and edit pages visually. Everything you change is saved as a draft — visitors only see it after you publish.' },
      { target: '[data-tour="builder-add"]', title: 'Add blocks and sections', body: 'Blocks are single pieces like headings, images and buttons. Sections are ready-made layouts. Saved holds blocks you’ve reused.', tryIt: 'Drag a block onto the page, or click it to add it below the selected block.' },
      { target: '[data-tour="builder-canvas"]', title: 'Edit right on the page', body: 'Click any block to select it. Double-click text to type directly. Drag the handle to move a block.' },
      { click: '[data-tour="builder-canvas"] [data-node-type="heading"]', target: '[data-tour="builder-inspector"]', title: 'Block settings', body: 'Settings for the selected block: Content (text, links, images), Style (colours, spacing, size), Animate (entrance and hover effects) and Advanced.' },
      { target: '[data-tour="builder-device"]', title: 'Check every screen size', body: 'Switch between desktop, tablet and mobile. Style changes you make while on tablet or mobile only apply to that size.' },
      { target: '[data-tour="builder-undo"]', title: 'Undo and redo', body: 'Step backwards or forwards through your changes.', tryIt: 'Ctrl + Z to undo, Ctrl + Shift + Z to redo.' },
      { target: '[aria-label="Version history"]', title: 'Version history', body: 'Every save and publish is kept. Open history to compare or restore an earlier version of the page.' },
      { target: '[aria-label="Page settings & SEO"]', title: 'Page settings & SEO', body: 'Change the page name and URL, and how it appears in search results and when shared on social media.' },
      { target: '[data-tour="builder-preview"]', title: 'Preview', body: 'See the draft exactly as visitors will, before it goes live.' },
      { target: '[data-tour="builder-save"]', title: 'Save your draft', body: 'Your work autosaves as you go. Save draft makes a named checkpoint in version history.' },
      { target: '[data-tour="builder-publish"]', title: 'Publish', body: 'Make the draft live now, or schedule it for later. You can unpublish at any time.' },
    ],
  },
  {
    id: 'animations',
    title: 'Add motion to a block',
    description: 'Entrance animations and hover effects, without code.',
    group: 'Design',
    href: 'builder',
    steps: [
      { click: '[data-tour="builder-canvas"] [data-node-type="heading"]', target: '[data-tour="builder-inspector"]', title: 'Select a block', body: 'Animations belong to a block. We’ve selected a heading so its settings are open on the right.' },
      { click: '[data-tour="builder-inspector"] [data-value="animate"]', target: '[data-tour="builder-inspector"]', title: 'The Animate tab', body: 'Choose how the block appears when it scrolls into view — fade, slide, zoom and more — with its speed, delay and easing.', tryIt: 'Give cards in a row increasing delays (0, 100, 200 ms) for a gentle cascade.' },
      { target: '[data-tour="builder-inspector"]', title: 'Hover effects', body: 'Further down, add a hover effect such as Lift or Grow. Keep motion subtle — visitors who prefer reduced motion automatically see the page without it.' },
      { target: '[data-tour="builder-preview"]', title: 'See it in action', body: 'Animations play in Preview and on the live site as visitors scroll.' },
    ],
  },
  {
    id: 'theme',
    title: 'Change the website’s look',
    description: 'Colours, fonts, buttons and spacing for the whole site.',
    group: 'Design',
    href: '/admin/theme',
    steps: [
      { target: { heading: 'Theme presets' }, title: 'Start from a preset', body: 'Apply a complete colour and font combination in one click. You can fine-tune it afterwards.' },
      { target: { heading: 'Colours' }, title: 'Brand colours', body: 'Set the primary, accent and background colours used across every page.' },
      { target: { heading: 'Typography' }, title: 'Fonts and text', body: 'Pick heading and body fonts, base text size and line height.' },
      { target: { heading: 'Buttons, cards & forms' }, title: 'Shapes', body: 'Control corner rounding, shadows and borders for buttons, cards and form fields.' },
      { target: { heading: 'Layout & spacing' }, title: 'Layout', body: 'Set how wide page content can get and the spacing between sections.' },
    ],
  },
  {
    id: 'header-footer',
    title: 'Edit the header and footer',
    description: 'The logo bar and footer shown on every page.',
    group: 'Design',
    href: '/admin/header-footer',
    steps: [
      { target: { heading: 'Header' }, title: 'Header', body: 'Choose the header style and its call-to-action button. The menu links themselves are edited under Navigation.' },
      { target: { heading: 'Footer' }, title: 'Footer', body: 'Edit the footer columns, links, tagline and copyright line.' },
      { target: '[data-tour="nav-navigation"]', title: 'Navigation', body: 'To change the menu links at the top of the site, open Navigation.' },
    ],
  },
  {
    id: 'content',
    title: 'Update team members',
    description: 'Photos, roles, bios and profile links on the Team page.',
    group: 'Content',
    href: '/admin/team',
    steps: [
      { target: '[data-tour="page-header"]', title: 'Content collections', body: 'Team members are shared content: the Team block shows them on any page you add it to.' },
      { target: '[name="name"]', title: 'Name and role', body: 'Edit how each person is named and described. Click Save on that card to update the site.' },
      { target: '[name="profile_url"]', title: 'Profile link', body: 'Add a page address such as /portfolio and the person’s name on the Team page becomes a link to it.' },
      { target: '[name="bio"]', title: 'Bio', body: 'Separate paragraphs with a blank line.' },
      { target: '[data-tour="nav-group-content"]', title: 'Other collections', body: 'Research areas, projects, values and partner logos work the same way.' },
    ],
  },
  {
    id: 'blog',
    title: 'Publish a blog post',
    description: 'Write a post, publish it, and see how it’s read.',
    group: 'Content',
    href: '/admin/blog',
    steps: [
      { target: '[data-tour="insights"]', title: 'How your posts perform', body: 'Published posts, views and the most-read story. Views are counted anonymously, and search-engine bots are ignored.' },
      { target: '[aria-label="New post title"]', title: 'Start a post', body: 'Type a title and press New post. The post is created as a draft that only admins can see.' },
      { target: '[data-tour="post-list"]', title: 'Your posts', body: 'Open any post to write it, add a cover image and category, and press Publish. Published posts appear on the Blogs page straight away.' },
    ],
  },
  {
    id: 'jobs',
    title: 'Post a job and review applicants',
    description: 'Open a position, then read applications and résumés.',
    group: 'Content',
    href: '/admin/jobs',
    steps: [
      { target: '[data-tour="insights"]', title: 'Hiring at a glance', body: 'Open positions, applications, job page views and how many viewers apply.' },
      { target: '[aria-label="New position title"]', title: 'Add a position', body: 'Name the role and press New position, then describe it and choose Open for applications.' },
      { target: '[data-tour="job-list"]', title: 'Applications per position', body: 'Each position shows how many people applied. Open it to read applications and download résumés.' },
      { target: '[data-tour="page-header"]', title: 'Privacy built in', body: 'Applications and résumés are deleted automatically 7 days after they arrive — download anything you need to keep.' },
    ],
  },
  {
    id: 'messages',
    title: 'Read form messages',
    description: 'Messages sent through the website’s forms.',
    group: 'Content',
    href: '/admin/submissions',
    steps: [
      { target: '[aria-label="Search messages"]', title: 'Find a message', body: 'Search by name, email or text.' },
      { target: '[aria-label="Filter by form"]', title: 'Filter by form', body: 'Each form on the site (Contact, Careers, Newsletter…) is listed separately.' },
      { target: '[data-tour="page-header"]', title: 'Email notifications', body: 'Use Email settings to choose who is notified when a new message arrives.' },
    ],
  },
]

export const TOUR_GROUPS: Tour['group'][] = ['Get started', 'Build pages', 'Design', 'Content']

// Per-browser tour state (a convenience only — losing it just restarts tours).
export const TOUR_ACTIVE_KEY = 'pearl-tour-active'
export const TOUR_DONE_KEY = 'pearl-tours-done'

export function readDone(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(TOUR_DONE_KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function markDone(id: string) {
  try {
    localStorage.setItem(TOUR_DONE_KEY, JSON.stringify([...new Set([...readDone(), id])]))
  } catch {}
}

export function setActiveTour(id: string, step = 0) {
  try {
    sessionStorage.setItem(TOUR_ACTIVE_KEY, JSON.stringify({ id, step }))
  } catch {}
}
