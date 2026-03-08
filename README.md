# n8n-nodes-agorapulse

Custom n8n community node for [Agorapulse](https://www.agorapulse.com/) social media management API.

## Installation

### Local installation (recommended for private use)

1. Clone this repository
2. Run `npm install && npm run build`
3. Copy the `dist` folder to `~/.n8n/custom/n8n-nodes-agorapulse/`
4. Set environment variable: `N8N_CUSTOM_EXTENSIONS="$HOME/.n8n/custom"`
5. Restart n8n

### Via npm (from private registry or git)

```bash
npm install git+https://github.com/telegraphic-dev/n8n-nodes-agorapulse.git
```

## Credentials

You need an Agorapulse API key. Get one from your Agorapulse account settings.

## Resources

### Organization
- **List**: Get all organizations the user belongs to

### Workspace
- **List**: Get all workspaces in an organization

### Profile
- **List**: Get all social profiles in a workspace

### Simple Draft
- **Create**: Create a draft post for multiple profiles

### Scheduled Post
- **Create**: Create a scheduled post for multiple profiles

## Usage Example

1. Add the Agorapulse node to your workflow
2. Configure your API credentials
3. Select Organization → Workspace → Profiles
4. Create drafts or scheduled posts

## API Documentation

https://api.beta.agorapulse.com/docs

## License

MIT
