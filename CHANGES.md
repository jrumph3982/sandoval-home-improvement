# Sandoval Home Improvement — Site Change Log

## Phase 4 Updates (April 2026)

### Logo Replacement
- Replaced `assets/sandoval.png` with `assets/logo.png` across all 6 HTML pages
- Applies to: favicon `<link rel="icon">`, header nav logo, footer logo (3 references per page)
- New logo: 3D bronze/gold house with saw blade roofline, bold "SANDOVAL HOME IMPROVEMENT" text

### Contact Information
- Phone: `(555) 123-4567` → `703-937-7579`
- Tel href: `tel:+15551234567` → `tel:+17039377579`
- Email: `info@sandovalhome.com` → `sandovalhomeimprovement@yahoo.com`
- Updated in all 6 pages: float-call button, header CTA, mid-page CTAs, footer contact column

### Service Area
- All service area references updated to: **"Northern Virginia, DC, Maryland area"**
- `index.html` service area section text updated
- `index.html` city pills replaced: San Antonio/Austin/etc → Arlington, Alexandria, Fairfax, Falls Church, McLean, Reston, Herndon, Bethesda
- `contact.html` service area info card updated
- Footer location span updated on `index.html` and `services.html`
- Meta descriptions updated on `index.html`, `about.html`, `contact.html`
- `about.html` body copy updated ("San Antonio region" → "Northern Virginia, DC, and Maryland area")

### About Us Page — Photo Strip
- Replaced 3 Unsplash stock photos with owner's actual assets:
  - Slot 1: `assets/family.jpg` — owner's family photo (Bass Pro Shops Christmas)
  - Slot 2: `assets/sal.png` — owner portrait at construction site
  - Slot 3: `assets/fence.png` — owner installing fence (professional action shot)
- CSS classes, container sizes, and layout preserved exactly (`grid grid-cols-3 h-52 sm:h-72`)

### Home Page Services Section
- Removed "8" from button: `"View All 8 Services"` → `"View All Services"`
- Replaced all 6 service card Unsplash images with local `images/` folder files:
  - Handyman → `images/handyman.jpg`
  - Home Repairs → `images/home_repairs.jpg`
  - Landscaping → `images/landscaping.png`
  - Painting → `images/painting.png`
  - Flooring → `images/flooring.png`
  - Fence & Deck → `images/Deck.jpg`

### Services Page — Service Images
- Replaced 7 of 8 service card Unsplash images with local `images/` folder files:
  - Handyman → `images/handyman.jpg`
  - Home Repairs → `images/home_repairs.jpg`
  - Landscaping → `images/landscaping.png`
  - Painting → `images/painting.png`
  - Flooring → `images/flooring.png`
  - Fence & Deck → `images/Deck.jpg`
  - General Maintenance → `images/general_maintenance.jpg`
  - Drywall → kept existing Unsplash URL (no local image available)

### Social Media Links — Footer
- Added Facebook and Instagram icon buttons to footer contact column on all 6 pages
- Styled as small circular icon buttons (`w-8 h-8 rounded-full bg-slate-800`)
- Hover state: `hover:bg-orange-600` (matches site orange accent)
- All hrefs set to `#` as placeholders — replace with real URLs when accounts are ready
- Positioned after the email entry in the Contact column of each footer

---

## Asset Inventory (as of April 2026)

### `assets/` folder
| File | Description | Usage |
|------|-------------|-------|
| `logo.png` | 3D bronze/gold house logo, white background | Favicon, header nav, footer (all pages) |
| `sandoval.png` | Original black line drawing logo (backup) | Replaced by logo.png |
| `family.jpg` | Owner's family Christmas photo (Bass Pro) | About page photo strip slot 1 |
| `sal.png` | Owner portrait at framing construction site | About page photo strip slot 2 |
| `addon.png` | Framing/room addition construction photo | Available for future use |
| `fence.png` | Owner installing wood fence with drill | About page photo strip slot 3 |

### `images/` folder
| File | Service |
|------|---------|
| `handyman.jpg` | Handyman Services |
| `home_repairs.jpg` | Home Repairs |
| `landscaping.png` | Landscaping |
| `painting.png` | Painting |
| `flooring.png` | Flooring |
| `Deck.jpg` | Fence & Deck |
| `general_maintenance.jpg` | General Maintenance |
| `customer.jpg` | Available (testimonials / other) |

---

## Site Architecture

- **Stack**: Pure static HTML/CSS/JS — no build pipeline
- **CSS**: Tailwind v3 Play CDN (`cdn.tailwindcss.com`) + `css/styles.css` (pure CSS, no @apply)
- **JS**: `js/script.js` — vanilla JS for nav toggle, carousel, lightbox, gallery filter, forms
- **Pages**: index.html, services.html, about.html, gallery.html, contact.html, request-quote.html
- **Color palette**: Navy `#0f172a` (header/stats), Orange `#ea580c` (CTAs/accents), Dark `#020817` (footer)
- **Git remote**: https://github.com/jrumph3982/sandoval-home-improvement.git

## Pending
- Replace social media `href="#"` placeholders with real Facebook/Instagram URLs once accounts are set up
