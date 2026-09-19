# mcp-zoom

Zoom MCP Pack

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/zoom/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Zoom data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

This pack runs against a connected zoom account, so it needs a Pipeworx key: sign in at https://pipeworx.io/account, connect zoom, then call `POST https://gateway.pipeworx.io/v1/tools/zoom_list_meetings` with `Authorization: Bearer <your Pipeworx key>`. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/zoom_list_meetings`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
