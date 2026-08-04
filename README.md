# mcp-zoom

Zoom MCP Pack

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `zoom_list_meetings` | List Zoom meetings for the signed-in user (upcoming, scheduled, or currently live video calls). Returns compact meeting summaries (id, topic, start time, duration, join URL, timezone). Use to browse a user's Zoom meetings. |
| `zoom_get_meeting` | Get the full details of a single Zoom meeting by its meeting ID, including topic, start time, duration, timezone, agenda, join URL, status, and key video/security settings (host video, participant video, waiting room). Use after zoom_list_meetings to inspect a specific video call. |
| `zoom_list_recordings` | List the signed-in user's Zoom cloud recordings of past meetings and video calls. Returns each recording's id, topic, start time, duration, total size, recording count, and downloadable/playable files (video, audio, transcript). Supports an optional date range. Use to find and access Zoom recordings. |
| `zoom_get_user` | Get the signed-in Zoom user's profile: id, email, first/last name, account type, account id, timezone, and personal meeting id (PMI). Use to identify whose Zoom account is connected. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "zoom": {
      "url": "https://gateway.pipeworx.io/zoom/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Zoom data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
