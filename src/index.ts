interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Zoom MCP Pack
 *
 * Requires OAuth connection — gateway injects credentials via _context.zoom.
 * Read-only access to a user's Zoom meetings and cloud recordings via the Zoom API v2.
 * Tools: list meetings, get meeting, list recordings, get user.
 */


interface ZoomContext {
  zoom?: { accessToken: string };
}

const API = 'https://api.zoom.us/v2';

/**
 * Fetch helper for the Zoom API v2.
 * - Returns { error: 'connection_required' } when no OAuth token is present.
 * - Returns { error: <status>, message: <body text> } on non-2xx responses.
 * - Otherwise returns the parsed JSON body.
 */
async function zFetch(
  ctx: ZoomContext,
  url: string,
  options: RequestInit = {},
): Promise<unknown> {
  if (!ctx.zoom) {
    return {
      error: 'connection_required',
      message: 'Connect your Zoom account at https://pipeworx.io/account',
    };
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${ctx.zoom.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: res.status, message: text };
  }
  return res.json();
}

const tools: McpToolExport['tools'] = [
  {
    name: 'zoom_list_meetings',
    description:
      'List Zoom meetings for the signed-in user (upcoming, scheduled, or currently live video calls). Returns compact meeting summaries (id, topic, start time, duration, join URL, timezone). Use to browse a user\'s Zoom meetings.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['scheduled', 'live', 'upcoming'],
          description: 'Which set of Zoom meetings to list: "scheduled", "live" (currently in progress), or "upcoming" (default).',
        },
        page_size: {
          type: 'number',
          description: 'Maximum number of meetings to return (default 30, max 100).',
        },
      },
      required: [],
    },
  },
  {
    name: 'zoom_get_meeting',
    description:
      'Get the full details of a single Zoom meeting by its meeting ID, including topic, start time, duration, timezone, agenda, join URL, status, and key video/security settings (host video, participant video, waiting room). Use after zoom_list_meetings to inspect a specific video call.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        meeting_id: {
          type: 'string',
          description: 'The ID of the Zoom meeting to retrieve (from zoom_list_meetings).',
        },
      },
      required: ['meeting_id'],
    },
  },
  {
    name: 'zoom_list_recordings',
    description:
      'List the signed-in user\'s Zoom cloud recordings of past meetings and video calls. Returns each recording\'s id, topic, start time, duration, total size, recording count, and downloadable/playable files (video, audio, transcript). Supports an optional date range. Use to find and access Zoom recordings.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        from: {
          type: 'string',
          description: 'Start date for the recording search, in YYYY-MM-DD format.',
        },
        to: {
          type: 'string',
          description: 'End date for the recording search, in YYYY-MM-DD format.',
        },
        page_size: {
          type: 'number',
          description: 'Maximum number of recordings to return (default 30, max 100).',
        },
      },
      required: [],
    },
  },
  {
    name: 'zoom_get_user',
    description:
      'Get the signed-in Zoom user\'s profile: id, email, first/last name, account type, account id, timezone, and personal meeting id (PMI). Use to identify whose Zoom account is connected.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

interface ZoomMeeting {
  id?: string | number;
  topic?: string;
  start_time?: string;
  duration?: number;
  join_url?: string;
  timezone?: string;
}

interface ZoomRecordingFile {
  recording_type?: string;
  file_type?: string;
  play_url?: string;
  download_url?: string;
}

interface ZoomRecording {
  id?: string | number;
  topic?: string;
  start_time?: string;
  duration?: number;
  total_size?: number;
  recording_count?: number;
  recording_files?: ZoomRecordingFile[];
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const context = (args._context ?? {}) as ZoomContext;
  delete args._context;

  switch (name) {
    case 'zoom_list_meetings': {
      const type = (args.type as string) ?? 'upcoming';
      const pageSize = Math.min(100, Math.max(1, (args.page_size as number) ?? 30));
      const params = new URLSearchParams({ type, page_size: String(pageSize) });
      const result = await zFetch(context, `${API}/users/me/meetings?${params}`);
      const r = result as { total_records?: number; meetings?: ZoomMeeting[] };
      if (Array.isArray(r.meetings)) {
        return {
          total: r.total_records,
          meetings: r.meetings.map((m) => ({
            id: m.id,
            topic: m.topic,
            start_time: m.start_time,
            duration: m.duration,
            join_url: m.join_url,
            timezone: m.timezone,
          })),
        };
      }
      return result;
    }
    case 'zoom_get_meeting': {
      const meetingId = args.meeting_id as string;
      const result = await zFetch(
        context,
        `${API}/meetings/${encodeURIComponent(meetingId)}`,
      );
      const m = result as {
        id?: string | number;
        topic?: string;
        start_time?: string;
        duration?: number;
        timezone?: string;
        agenda?: string;
        join_url?: string;
        status?: string;
        settings?: {
          host_video?: boolean;
          participant_video?: boolean;
          waiting_room?: boolean;
        };
      };
      if (m && typeof m === 'object' && 'id' in m && !('error' in m)) {
        return {
          id: m.id,
          topic: m.topic,
          start_time: m.start_time,
          duration: m.duration,
          timezone: m.timezone,
          agenda: m.agenda,
          join_url: m.join_url,
          status: m.status,
          settings: {
            host_video: m.settings?.host_video,
            participant_video: m.settings?.participant_video,
            waiting_room: m.settings?.waiting_room,
          },
        };
      }
      return result;
    }
    case 'zoom_list_recordings': {
      const pageSize = Math.min(100, Math.max(1, (args.page_size as number) ?? 30));
      const from = args.from as string | undefined;
      const to = args.to as string | undefined;
      const params = new URLSearchParams({ page_size: String(pageSize) });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const result = await zFetch(context, `${API}/users/me/recordings?${params}`);
      const r = result as { total_records?: number; meetings?: ZoomRecording[] };
      if (Array.isArray(r.meetings)) {
        return {
          total: r.total_records,
          recordings: r.meetings.map((rec) => ({
            id: rec.id,
            topic: rec.topic,
            start_time: rec.start_time,
            duration: rec.duration,
            total_size: rec.total_size,
            recording_count: rec.recording_count,
            files: (rec.recording_files ?? []).map((f) => ({
              type: f.recording_type,
              file_type: f.file_type,
              play_url: f.play_url,
              download_url: f.download_url,
            })),
          })),
        };
      }
      return result;
    }
    case 'zoom_get_user': {
      const result = await zFetch(context, `${API}/users/me`);
      const u = result as {
        id?: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        type?: number;
        account_id?: string;
        timezone?: string;
        pmi?: number;
      };
      if (u && typeof u === 'object' && 'id' in u && !('error' in u)) {
        return {
          id: u.id,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          type: u.type,
          account_id: u.account_id,
          timezone: u.timezone,
          pmi: u.pmi,
        };
      }
      return result;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 1 }, provider: 'zoom' } satisfies McpToolExport;
