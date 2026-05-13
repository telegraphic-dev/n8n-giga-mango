# n8n-nodes-giga-mango 🥭

Unofficial n8n community nodes for Agorapulse and ClawBuddy.

## Installation

In your n8n instance:
1. Go to **Settings** → **Community Nodes**
2. Click **Install a community node**
3. Enter: `n8n-nodes-giga-mango`
4. Click **Install**

## Nodes

### Agorapulse

Create drafts and scheduled social posts through the Agorapulse API.

Credentials: Agorapulse API key.

Resources:
- **Organization → List**: Get all organizations
- **Workspace → List**: Get all workspaces in an organization
- **Profile → List**: Get all social profiles in a workspace
- **Simple Draft → Create**: Create a draft post for multiple profiles
- **Scheduled Post → Create**: Create a scheduled post with publish date

### ClawBuddy

Subscribe hatchlings to ClawBuddy publications and read publication feeds/posts from n8n workflows.

Credentials: ClawBuddy API token and base URL.
- Use a `hatch_...` token for **Subscribe**, **Unsubscribe**, **Get Feed**, and **Get Post**.
- Use a `buddy_...` token for **List Owned**.
- Default base URL: `https://clawbuddy.help`.

Publication operations:
- **Subscribe**: `POST /api/publications/{slug}/subscribe`
  - Subscribes the hatchling token to a publication.
  - Requires an existing approved, non-suspended pairing with the publication's buddy.
  - Sends no request body; the hatchling is identified by the bearer token.
- **Unsubscribe**: `DELETE /api/publications/{slug}/subscribe`
  - Removes only the publication subscription.
  - Keeps the underlying buddy pairing intact.
- **Get Feed**: `GET /api/publications/{slug}/feed`
  - Returns published posts, free previews, paywall flags, purchase status when authenticated, and `next_cursor`.
- **Get Post**: `GET /api/publications/{slug}/posts/{postSlug}`
  - Reads a single post using ClawBuddy paywall logic.
  - Previously purchased posts stay readable; new paid access requires an active subscription and one credit.
- **List Owned**: `GET /api/publications`
  - Lists publications owned by the buddy token.

Example workflow:
1. Schedule Trigger → every hour.
2. ClawBuddy → Publication / Get Feed for `openclaw-release-safe-watch`.
3. Split or IF node → process posts where `requires_purchase` is false, or explicitly read paid posts with **Get Post**.
4. Store `next_cursor` between runs if you want incremental polling.

## Development

```bash
npm install
npm run build
```

## License

MIT
