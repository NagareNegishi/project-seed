#!/usr/bin/env bash
# plan-lint.sh - structural lint for the plan docs under docs/plans/.
# Deterministic checks only: every rule below is decidable by pattern, never by
# judgement. Judgement belongs to the `trim-plan` skill, which this script feeds.
#
# SCOPE: shape, not substance. This checks that entries are shaped like entries
# and that status lives where status belongs. It cannot tell whether a question
# is genuinely open, whether a `Resolved by:` value is honest, or whether a step
# body says anything useful - those stay judgement. A clean run means "nothing
# malformed", never "this doc is in good order".
#
# Every check runs on every doc. A doc written before this format existed is not
# a defect anyone has to repair: the findings are reported, and converting it is
# a choice its owner makes, never work the lint conscripts a trim into.
#
# Checks (findings - exit 1):
#   ENTRY-FORMAT   an open-question / risk entry with no `**Resolved by:**`
#   CONTINUATION   an indented line inside a one-line-per-entry section
#   PROSE          a non-bullet paragraph inside a one-line-per-entry section
#   RESOLVED-INLINE  resolution wording left in a question / risk or on its mark line
#   BUDGET         a volatile section over MAX_ENTRIES entries, prose or not
#   STATUS-IN-HEADER  progress text in `## Maturity` instead of `## Status`
#   MARK-STATUS    a status word on a mark line, where only the maturity and
#                  verification marks belong
#   OPEN-FORMAT    a `- **Open:** …` step-body item with no `**Resolved by:**`
#   MATURITY-SUM   header counts that disagree with the marked entries, in total
#                  or per category
#   MATURITY-LOWEST  `lowest:` that is not the lowest mark present in the file
#
# Notices (reported, never fail):
#   ARCHIVE-READY  a `## Status` table with no `planned` and no `in-flight` rows
#   OPEN-ITEMS     a per-doc rollup of `- **Open:** …` items and the steps holding
#                  them, so scattered obligations still have one place to read
#
# Usage: scripts/plan-lint.sh [path ...]
#   No paths: every *.md under docs/plans/, excluding docs/plans/archive/.
set -euo pipefail

MAX_ENTRIES=10

# Collect targets. Explicit paths are linted as given, archive included - the
# default sweep is what skips archive/, since archived docs are history.
# Relative arguments resolve against the caller's directory, so they must be made
# absolute before the cd to the repo root that the default sweep needs.
files=()
for arg in "$@"; do
  case "$arg" in
    /*) files+=("$arg") ;;
    *)  files+=("$PWD/$arg") ;;
  esac
done

# Only the sweep needs the repo root; explicit paths were made absolute above and
# lint fine from anywhere. `cd ""` returns 0, so a failed rev-parse would leave
# the sweep searching the caller's directory and exiting clean on zero docs.
if [ "${#files[@]}" -eq 0 ]; then
  root="$(git rev-parse --show-toplevel 2>/dev/null)" || root=""
  [ -n "$root" ] || { echo "plan-lint: not inside a git repository." >&2; exit 2; }
  cd "$root"
  mapfile -t files < <(find docs/plans -name '*.md' -not -path 'docs/plans/archive/*' | sort)
fi

[ "${#files[@]}" -eq 0 ] && { echo "plan-lint: no plan docs found."; exit 0; }

findings=0
notices=0

for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "plan-lint: no such file: $f" >&2; exit 2; }

  out="$(awk -v max="$MAX_ENTRIES" '
    # Report a finding; the wrapper counts lines starting with the file path.
    function bad(line, code, msg) {
      printf "%s:%d: %s  %s\n", FILENAME, line, code, msg
    }

    # Resolution wording: an answer recorded where a question belongs. Matching
    # is on grammatical FORM, not vocabulary - a bare "confirmed" or "settled"
    # appears in plenty of legitimately open entries ("is unconfirmed", "should
    # be confirmed"), and flagging those teaches the writer to dodge words
    # instead of landing content.
    #
    # Only the marker token is stripped, not the rest of the line, so a
    # resolution written AFTER `**Resolved by:**` is still caught.

    function resolution_wording(s,   t) {
      t = " " tolower(s) " "
      sub(/\*\*resolved by:\*\*/, "", t)
      # "resolved:" / "settled:" - a statement, not a question
      if (t ~ /[^a-z](resolved|answered|decided|settled|superseded):/) return 1
      # "resolved via", "resolved into", "settled in"
      if (t ~ /[^a-z](resolved|answered|decided|settled|superseded) (via|into|in|to|as|by|per) /) return 1
      # a bullet or heading that opens with the verdict
      if (t ~ /^[ \t]*[-#*]+[ \t*]*(resolved|answered|decided|settled)[^a-z]/) return 1
      # "(decided 2026-08-26)", "(see decisions)"
      if (t ~ /\((resolved|answered|decided|settled|superseded|see decisions)/) return 1
      # "is confirmed", "was resolved" - copula, so "is unconfirmed" is safe
      if (t ~ /[^a-z](is|are|was|were) (confirmed|resolved|settled|decided|answered)[^a-z]/) return 1
      # "three resolved this session"
      if (t ~ /[^a-z](resolved|answered|decided|settled) (this|last) (session|week|pass)[^a-z]/) return 1
      if (t ~ /[^a-z]update:/) return 1
      return 0
    }

    function is_mark(s) { return (s ~ /^(🌱|🤖|👤|✅)/) }

    # CRLF: a trailing carriage return would otherwise land inside `sec`, so
    # `sec == "maturity"` never matches and those checks silently switch off.
    { sub(/\r$/, "") }

    FNR == 1 {
      sec = ""; volatile = 0; entries = 0; sechead = 0
      awaiting_mark = 0; infence = 0
    }

    # Fenced blocks quote the mark vocabulary in some docs; their contents are
    # examples, not entries.
    /^[ \t]*```/ { infence = !infence; next }
    infence { next }

    # Section boundaries. Everything below keys off `sec`. Both passes run this.
    /^##[ \t]+/ {
      flush_budget()
      sec = tolower($0); sub(/^##[ \t]+/, "", sec); sub(/[ \t]+$/, "", sec)
      volatile = (index(sec, "open questions") > 0 || index(sec, "risks") > 0)
      sechead = FNR
      entries = 0
      awaiting_mark = 1
      curstep = ""      # steps belong to the section that declared them
      next
    }

    # Count every entry mark line in the file. The `## Maturity` counts line
    # also starts with an emoji, so it is excluded when the sum is checked.
    is_mark($0) {
      marks++
      # Only the four maturity marks and the two verification marks belong here.
      # `✅` is legal solely as `✅ settled`; status words never are.
      if (sec != "maturity") {
        # Tally the marks actually present, so `lowest:` is checked against the
        # file rather than against the counts line it is meant to be checking.
        if ($0 ~ /^🌱/) actual_counts["1"]++
        else if ($0 ~ /^🤖/) actual_counts["2"]++
        else if ($0 ~ /^👤/) actual_counts["3"]++
        else if ($0 ~ /^✅/) actual_counts["4"]++

        # Test the marks themselves, not the citation payload - a src path or
        # doc URL can legitimately contain "done", "landed" or "completed".
        marktext = tolower($0)
        sub(/→.*$/, "", marktext)
        if (index(marktext, "✅") > 0 && index(marktext, "✅ settled") == 0) {
          bad(FNR, "MARK-STATUS", "invented status mark - use ## Status, and a Note for the caveat")
        } else if (marktext ~ /landed|shipped|completed|[^a-z]done[^a-z]|[^a-z]done$/) {
          bad(FNR, "MARK-STATUS", "status word on a mark line - it belongs in ## Status")
        }
      }
    }

    # Step headings are not section boundaries (`^##[ \t]+` rejects `###`), but
    # an open item needs to name the step holding it.
    /^###[ \t]+/ && !volatile {
      curstep = $0
      sub(/^###[ \t]+/, "", curstep)
      sub(/^[Ss]tep[ \t]*/, "", curstep)
      sub(/[:.].*$/, "", curstep)
      next
    }

    # Open items may appear in any step body. Checking them here is what stops a
    # step body being the cheap place to park an obligation the volatile
    # sections would have flagged.
    /^[ \t]*-[ \t]*\*\*Open:\*\*/ {
      # In a volatile section this is an entry like any other; counting it here
      # and returning would hide it from BUDGET.
      if (volatile) entries++
      open_items++
      if (curstep != "" && !(curstep in seen_step)) {
        seen_step[curstep] = 1
        open_steps = (open_steps == "" ? curstep : open_steps ", " curstep)
      }
      if (index($0, "**Resolved by:**") == 0) {
        bad(FNR, "OPEN-FORMAT", "open item has no **Resolved by:** marker")
      }
      if (resolution_wording($0)) {
        bad(FNR, "RESOLVED-INLINE", "open item reads as already answered; land it and delete the line")
      }
      next
    }

    sec == "maturity" {
      if ($0 ~ /(Landed|Remaining|Progress|In flight|Done so far)[ \t]*:/) {
        bad(FNR, "STATUS-IN-HEADER", "progress text belongs in ## Status, not the Maturity header")
      }
      # The counts line: "🌱 idea 0 · 🤖 ai-audited 10 · 👤 human-ok 1 · ✅ settled 0"
      if (is_mark($0) && index($0, "·") > 0) {
        counts_line = FNR
        counts_seen++
        # Only the last counts line is compared, but every one of them occupies
        # a mark line, so all of them come off the marked-entry total.
        declared = 0
        n = split($0, part, "·")
        for (i = 1; i <= n; i++) {
          if (match(part[i], /[0-9]+[ \t]*$/)) {
            v = substr(part[i], RSTART, RLENGTH) + 0
            declared += v
          }
        }
      }
      if (tolower($0) ~ /^lowest:/) {
        lowest_line = FNR
        if (index($0, "🌱") > 0) lowest_declared = "1"
        else if (index($0, "🤖") > 0) lowest_declared = "2"
        else if (index($0, "👤") > 0) lowest_declared = "3"
        else if (index($0, "✅") > 0) lowest_declared = "4"
      }
      next
    }

    # Status rows: "| 3 | planned | note". Header and separator rows have no
    # state word, so they fall through harmlessly.
    sec == "status" && /^[ \t]*\|/ {
      row = tolower($0)
      # End of line terminates a cell too: a row whose Note is empty and whose
      # trailing pipe was omitted would otherwise be invisible, and a missed
      # `planned` row is what turns ARCHIVE-READY into a false archive offer.
      if (row ~ /\|[ \t]*(planned|in-flight|done|dropped)[ \t]*(\||$)/) {
        status_rows++
        if (row ~ /\|[ \t]*(planned|in-flight)[ \t]*(\||$)/) open_rows++
      }
      next
    }

    # One-line-per-entry sections: open questions, risks.
    volatile {
      if ($0 ~ /^[ \t]*$/) next

      if (awaiting_mark && is_mark($0)) {
        awaiting_mark = 0
        if (resolution_wording($0)) {
          bad(FNR, "RESOLVED-INLINE", "resolution recorded on the section mark line; land it and delete the entry")
        }
        next
      }
      awaiting_mark = 0

      # RESOLVED-INLINE applies to legacy prose sections too; the shape checks
      # below wait until the section has been converted.
      if (resolution_wording($0)) {
        bad(FNR, "RESOLVED-INLINE", "reads as already answered; land it and delete the entry")
      }
      if ($0 ~ /^-[ \t]/) {
        entries++
        if (index($0, "**Resolved by:**") == 0) {
          bad(FNR, "ENTRY-FORMAT", "entry has no **Resolved by:** marker")
        }
      } else if ($0 ~ /^[ \t]+/) {
        bad(FNR, "CONTINUATION", "entries are one line each - no wrapped or nested lines")
      } else {
        bad(FNR, "PROSE", "this section holds bullet entries only")
      }
      next
    }

    # Emitted when a section closes and at end of file.
    function flush_budget() {
      if (volatile && entries > max) {
        bad(sechead, "BUDGET", sprintf("%d entries, budget is %d - land the settled ones", entries, max))
      }
      volatile = 0
    }

    END {
      flush_budget()

      if (counts_line > 0) {
        actual = marks - counts_seen             # minus the counts lines themselves
        if (declared != actual) {
          bad(counts_line, "MATURITY-SUM", sprintf("counts total %d, file has %d marked entries", declared, actual))
        }
        if (lowest_line > 0 && lowest_declared != "") {
          lowest_actual = ""
          for (k = 1; k <= 4; k++) if (actual_counts[k ""] + 0 > 0 && lowest_actual == "") lowest_actual = k ""
          if (lowest_actual != "" && lowest_actual != lowest_declared) {
            bad(lowest_line, "MATURITY-LOWEST", "lowest: is not the lowest mark present in the file")
          }
        }
      }

      if (open_items > 0) {
        printf "%s:0: OPEN-ITEMS  %d open item(s)%s\n", FILENAME, open_items,
               (open_steps == "" ? "" : " in step(s) " open_steps)
      }

      if (status_rows > 0 && open_rows == 0) {
        printf "%s:0: ARCHIVE-READY  %d steps, none planned or in-flight - offer to archive\n", FILENAME, status_rows
      }
    }
  ' "$f")" || {
    # An unreadable or unprocessable file must not be reported as clean.
    echo "plan-lint: awk failed on $f" >&2
    exit 2
  }

  [ -z "$out" ] && continue
  printf '%s\n' "$out"
  findings=$(( findings + $(printf '%s\n' "$out" | grep -cvE 'ARCHIVE-READY|OPEN-ITEMS' || true) ))
  notices=$(( notices + $(printf '%s\n' "$out" | grep -cE 'ARCHIVE-READY|OPEN-ITEMS' || true) ))
done

echo
echo "plan-lint: ${#files[@]} doc(s), $findings finding(s), $notices notice(s)."
[ "$findings" -gt 0 ] && exit 1
exit 0
