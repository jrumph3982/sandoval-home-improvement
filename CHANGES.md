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

## Phase 5 Updates (April 2026)

### Individual Service Pages (8 new pages)
Created a dedicated page for each service using a consistent template (page banner, two-column detail section, CTA, footer with individual service links):
- `handyman.html` — banner: `images/handyman.jpg`
- `painting.html` — banner: `images/painting.png`
- `flooring.html` — banner: `images/flooring.png`
- `landscaping.html` — banner: `images/landscaping.png`
- `home-repairs.html` — banner: `images/home_repairs.jpg`
- `drywall.html` — banner: `images/home_repairs.jpg`
- `fence-deck.html` — banner: `images/Deck.jpg`
- `general-maintenance.html` — banner: `images/general_maintenance.jpg`

Each page includes: header/nav, page banner with overlay, bullet list of included services, two-column layout with image + service area box, orange CTA section, footer, and mobile sticky call bar.

### Footer Services Column — All Pages
Updated footer Services column links on all 6 existing pages (index, about, services, gallery, contact, request-quote) to point to individual service pages instead of `services.html`.

### Hero Section (`index.html`)
- Added tagline line: `"Home Improvement in Northern Virginia / DMV"` (orange, uppercase, above h1)
- Trust pill updated to: `"Licensed & Insured in VA, DC, MD"`

### Service Area Cities (`index.html`)
- Added city pills: Woodbridge, Manassas, Rockville, Silver Spring

### Testimonials (`index.html`)
- Updated reviewer locations: Arlington VA / Fairfax VA / McLean VA (replaced Texas references)

### Experience Statement (`about.html`)
- Added highlighted box after body paragraphs: Sal Sandoval — 10+ years hands-on experience, personally oversees every project

### Learn More Hover Animation (`css/styles.css`)
- Added `.learn-more-link` class: `inline-flex`, arrow SVG slides right 4px on hover (`translateX(4px)`)

### Mobile Sticky Call Bar (`css/styles.css` + all pages)
- Added `#mobile-call-sticky`: full-width fixed bar at bottom of screen, orange background, phone number
- Visible only on mobile (`max-width: 767px`); hidden on desktop
- Existing `#float-call` round button hidden on mobile to avoid overlap
- Body gets `padding-bottom: 58px` on mobile to prevent content overlap

### Services Page (`services.html`)
- Removed individual "Get a Quote" buttons from all 8 service cards
- Added single "Get a Free Quote" CTA button below the services grid
- Added "Learn More" links to each service card pointing to individual service pages

### Gallery Page (`gallery.html`)
- Added Before/After project photo section below the gallery grid
- 4 project pairs shown side-by-side with "Before" / "After" badges:
  - Fence Installation (Woodbridge VA)
  - Room Addition (Fairfax VA)
  - Flooring Upgrade (Alexandria VA)
  - Interior Painting (Reston VA)

### Contact Page (`contact.html`)
- Updated Google Maps embed from San Antonio, TX to Fairfax, VA (Northern Virginia)

### Logo Size (`all pages`)
- Header logo increased: `h-10` → `h-12` across all pages

### Footer Legal Links (all pages)
- Removed "Privacy Policy" and "Terms of Service" links from all footers
- Replaced with simple centered copyright line — no empty containers left behind

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
- **Pages**: index.html, services.html, about.html, gallery.html, contact.html, request-quote.html, handyman.html, painting.html, flooring.html, landscaping.html, home-repairs.html, drywall.html, fence-deck.html, general-maintenance.html
- **Color palette**: Navy `#0f172a` (header/stats), Orange `#ea580c` (CTAs/accents), Dark `#020817` (footer)
- **Git remote**: https://github.com/jrumph3982/sandoval-home-improvement.git

## Pending
- Replace social media `href="#"` placeholders with real Facebook/Instagram URLs once accounts are set up
