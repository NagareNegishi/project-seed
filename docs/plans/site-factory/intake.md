# site-factory: content intake

Maturity: 🤖 ai-audited(fable-5) — merged from two agent proposals under
challenge 2026-07-17; no human review yet. This is decision 2 in
[decisions.md](decisions.md).

Principle: a Zod schema per section/pattern is the single source of truth for
what content exists. Everything else is a projection of it: the client-facing
questionnaire mirrors it field for field, and the build validates against it
through Astro's content layer. Non-technical clients never touch the schema;
the operator's transcription is the bridge, kept cheap because questionnaire
headings mirror schema keys one to one.

## Client-facing side

- A questionnaire template (Google Doc class, copied per client): one heading
  per chosen section, one labeled line per slot, using the same names as the
  tables in [catalog.md](catalog.md). The operator deletes unused headings
  before sending, so clients never see fields they don't need.
- An image checklist: which images, minimum size, preferred orientation, and
  a shared folder (Drive class) for images and brand assets (logo, fonts).
- Later option, not v1: generate the questionnaire from the chosen patterns
  ([ideas.md](ideas.md) §2.4) and move it to a form tool once it has
  survived a few real clients.
- Process rules around intake (stall rule, chase sequence):
  [operations.md](operations.md) §1.

## Repo side

```
intake/
  site.yaml            # singleton sections; one top-level key per section
  copy/                # long-form text, referenced from site.yaml by filename
    about.md
    legal-privacy.md   # only when the client supplies lawyer-reviewed text
  assets/
    logo.svg           # svg preferred, png accepted
    logo-dark.svg      # optional variant for dark backgrounds
    favicon.png        # optional; derived from logo when absent
    fonts/             # only when the brand uses a licensed font file
    images/
      hero.jpg
      gallery/01-shopfront.jpg
      team/jane.jpg
site.config.yaml       # operator wiring: form-endpoint key, embed URLs,
                       # analytics, tier, deploy target — never client content
```

`site.yaml` example (abridged):

```yaml
business:
  name: "Harbor Lane Bakery"
  phone: "+64 3 555 0142"
  email: "hello@harborlane.nz"
  address: "12 Harbor Lane, Lyttelton"

brand:
  colors:
    primary: "#7A4B2A"     # omit -> theme default
    accent: "#E8B84B"
  font: "default"          # or a Google Fonts family, or fonts/<file>

sections: [hero, services, gallery, hours, faq, contact]   # order = page order

hero:
  headline: "Bread worth crossing town for"
  subline: "Baked before sunrise, often sold out by noon."
  image: images/hero.jpg
  cta: { label: "See this week's range", target: "#services" }

hours:
  mon-fri: "07:00-14:00"
  sat: "08:00-12:00"
  sun: closed
  note: "Closed public holidays"

about:
  title: "Who we are"
  body: copy/about.md

faq:
  - q: "Do you take cake orders?"
    a: "Yes, with 48 hours notice."
```

Mechanics on the Astro side: `site.yaml` feeds singleton sections through a
content-layer file loader; repeated entries with their own files (gallery
images, FAQ items if they outgrow the YAML, testimonials) can use per-folder
collections. Both paths validate against the same Zod schemas, so a missing
required slot, wrong image path, or unknown key fails the build with a named
error. That check is what makes "fill in content" near-mechanical: copy
`intake/` in, run the build, fix what the errors list.

## Rejected alternatives

- Clients fill `site.yaml` directly: YAML indentation errors from
  non-technical clients cost more than transcription saves.
- Pure folder-of-markdown, no schema: mapping prose to slots is judgment work
  every time and can't be validated.
- Form tool from day one: viable later, premature before the questionnaire
  stabilizes.
