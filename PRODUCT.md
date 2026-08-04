# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences of roughly equal priority:

- **Potential clients** — brands and private individuals looking for someone to produce AI-generated visuals. They arrive to judge whether Anro's work fits their project, then reach out to order.
- **Followers / acquaintances** — people coming from her Telegram channel and Instagram to browse the portfolio.

Typical situation: arriving from a social link or word of mouth, on mobile or desktop, scanning the work first and deciding whether (and how) to get in touch. The site replaces her previous Tilda page (anroai.tilda.ws).

## Product Purpose

A personal business-card + portfolio site for the AI creator **Anro** (Анастасия Романова), who creates images and videos with neural networks. It exists to present her work beautifully and convert interest into contact/orders. Success = a visitor understands what she does, sees proof, and messages her.

## Positioning

Anro's difference (all confirmed as binding and true):

- **Directorial approach** — an idea is turned into an intentional visual built for a brief, not "random pictures from a neural network." Direction, aesthetics and meaning lead.
- **Breadth** — both images *and* video, across many formats (covers, mockups, AI photoshoots, tattoo sketches, illustrations, animation, atmospheric reels, ad content, video greetings) and tools (Midjourney, Runway, Kling, Nano Banana, etc.).
- **Verified credentials** — graduate of HUGA Academy; winner of the SYNTX & WORKSHOP neuro-tournament. These are true and may be stated.
- **AI speed & accessibility** — faster and more accessible than classic shoot/design production, via neural networks.

## Operating Context

- **Trilingual RU / EN / BE** with full parity; RU is default, EN at `/en`, BE at `/be`.
- **Content edited by a non-coder** through Sveltia CMS at `/admin` → JSON in `src/content/**` (i18n single-file); media in `public/media/`.
- **Static site** on GitHub Pages, custom apex domain **anroai.art** (no backend/server).
- Sections built so far: Hero (`ANRO` / AI Creator), About, Works (portfolio). Services / Testimonials / Contacts sections are planned but not yet built.
- Contact happens off-site in a messenger, not through an on-site account or checkout.

## Capabilities and Constraints

- Fully static: no backend, database, or server-side logic; anything dynamic must run client-side or at build time (vite-ssg pre-render for SEO).
- Content model is fixed JSON shapes per collection (works, services, testimonials) and page files (hero, about, contacts); each translatable field carries ru/en/be.
- Media lives in the repo (`public/media/`); large original videos are heavy — repo/page weight is a real constraint.
- **Undecided / not yet set (do not fabricate):** on-site pricing (none shown, none decided), an application/brief form (not built), the email address (`contacts.json` email is empty), and the Services/Testimonials/Contacts sections.

## Brand Commitments

- **Name:** brand alias **Anro**; real name **Анастасия Романова**. Role line: **AI Creator**.
- **Voice:** first person, warm and creative, "where creativity meets artificial intelligence."
- **Trilingual is mandatory** — every user-facing string exists in RU, EN, BE.
- **Channels (binding, real):** Telegram DM `t.me/anro_aiart` (primary contact), Instagram `instagram.com/anro_aiart`, Telegram channel `@ANRO_ARTAI`. Domain `anroai.art`.
- **Personal signature:** a private easter egg in the hero (the "1369" code that morphs the particles into a heart) is an intentional personal touch to preserve.

## Evidence on Hand

- Real social channels and domain (above); regalia (HUGA Academy, SYNTX & WORKSHOP win) confirmed true.
- Real portfolio media: 9 works in `src/content/works/` — 6 videos (`public/media/videos/`, original resolution) + 3 photos and their posters (`public/media/works/`, WebP). Source materials in `materials/` (videos, images, transparent avatar/portrait).
- Predecessor site for reference: `anroai.tilda.ws`.
- **Absences future work must not invent:** no client logos, no testimonials yet, no published pricing, no case-study metrics, no email until the owner provides one.

## Product Principles

1. **The work leads.** This is a portfolio first — the visuals earn attention before any copy or CTA.
2. **Two audiences, one path.** Serve both clients and followers, but always leave a single clear way to reach Anro (messenger).
3. **Editable without code.** Anything the owner may change (works, texts, contacts) stays in CMS-editable content, never hardcoded.
4. **Trilingual parity.** No language is a second-class citizen; nothing ships in one language only.
5. **Intentional craft over AI novelty.** Show a directed point of view, not the fact that a tool was used.

## Accessibility & Inclusion

- Trilingual content with `alt` text maintained in all three languages for every work.
- Motion-heavy hero and reveals must honor `prefers-reduced-motion` (already treated as a constraint in the build).
