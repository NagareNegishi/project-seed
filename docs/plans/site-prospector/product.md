# Product plan: site-prospector

## Maturity
lowest: 🌱 idea
🌱 idea 10 · 🤖 ai-audited 0 · 👤 human-ok 0 · ✅ settled 0

## about
🌱 idea

A prospecting tool that finds websites which are outdated or broken and turns
them into qualified leads for your web-building/improvement service. It analyzes
candidate sites for signs of age and breakage, scores how good a lead each one is
and records the evidence, then ranks them so the best surface first. It does the
finding and qualifying, not the contacting — outreach is handed to the
promotion-engine or done by you.

## problem / motivation
🌱 idea

The best clients for a web-improvement service are people whose sites are visibly
failing them — but finding those sites by hand is slow and hit-or-miss. This
surfaces concrete, evidence-backed leads ("this site has these specific
problems") so outreach can be specific and honest instead of generic, and so a
steady pipeline exists without manual hunting.

## goal
🌱 idea

Produce a steady stream of qualified leads — sites with real, nameable problems
your service can fix — each backed by evidence and ranked by how worth contacting
it is.

## audience
🌱 idea

One operator: you, generating leads for your own web-building/improvement service.
Not a lead-gen product sold to others.

## requirements
🌱 idea

- When given a candidate site or a source of candidates, the system shall fetch and
  analyze it for signs of age or breakage.
- The system shall detect and record specific issues — broken links, missing
  HTTPS, no mobile responsiveness, slow load, outdated technology, dead or stale
  pages.
- When a site is analyzed, the system shall score it as a lead and store the
  evidence behind the score.
- The system shall rank qualified leads so the most promising surface first.
- The system shall present each lead with the concrete problems found, so outreach
  can cite specifics.
- When a lead is qualified, the system shall make it available to the
  promotion-engine or export for outreach.
- While analyzing a site, the system shall respect robots.txt and rate limits and
  shall run only non-intrusive, publicly observable checks.
- The system shall record which sites were already reviewed, to avoid reprocessing
  and duplicate contact.

## stack
🌱 idea

Built on this seed: React/TypeScript frontend, the seed's backend and database. A
fetcher plus checks for performance, broken links, and technology fingerprinting.
Claude to summarize the issues found and write each lead's rationale. A scheduler
(cron/loop) for periodic scans — the same backbone the other two projects use.
How candidate sites are discovered and how contact info is found are still open.

## target device / platform
🌱 idea

Web dashboard, desktop-first: the ranked lead list, each lead's evidence, and its
status.

## constraints
🌱 idea

- Single operator; not multi-tenant.
- Must respect robots.txt, rate limits, site terms, and anti-scraping/anti-hacking
  law — only non-intrusive checks on publicly observable pages. No probing or
  vulnerability scanning.
- Contact info is limited to publicly listed business details; anti-spam law
  applies at the outreach step, which this tool hands off rather than performs.
- How candidate sites are discovered is not yet chosen — see open questions.

## non-goals
🌱 idea

- Does not send outreach — that's the promotion-engine's job, or yours.
- Not a security scanner; it does not probe for vulnerabilities or do anything
  intrusive to a site.
- Not a general SEO or site-audit product for third parties.
- Does not harvest personal data beyond publicly listed business contact info.

## open questions
🌱 idea

- How are candidate sites discovered — a seed list you supply, a niche/geography
  filter, directories, search results? Which sources are legally clean?
- What exact signals and thresholds qualify a site as an "old or broken" lead?
- How is business contact info found while staying within privacy and anti-spam
  rules?
- How does handoff to the promotion-engine work — a shared data model, or export?
- How are uninterested owners suppressed so they aren't re-surfaced or re-contacted?
- How often should known sites be re-scanned for changes?
