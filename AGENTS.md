<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## City guides (`content/city-guides/`)

When creating a new city guide, **do not hardcode the date**. Use today's system date:

- **Preferred:** `npm run new:city-guide -- --slug <slug> --title "<title>" --description "<description>"`
- **Manual:** copy `scripts/templates/city-guide.md` and set `date` to today (`YYYY-MM-DD` from the system clock).

Slug becomes the filename (`<slug>.md`) and URL (`/city-guides/<slug>`).
