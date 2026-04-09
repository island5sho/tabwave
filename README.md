# TabWave

A CLI tool that syncs and manages browser tab sessions across devices using a lightweight local server.

## Installation

```bash
npm install -g tabwave
```

Or use directly with npx:

```bash
npx tabwave
```

## Usage

Start the local sync server:

```bash
tabwave serve
```

Save your current browser session:

```bash
tabwave save my-work-session
```

List all saved sessions:

```bash
tabwave list
```

Restore a session on any device:

```bash
tabwave restore my-work-session
```

Sync sessions across devices on the same network:

```bash
tabwave sync --device laptop
```

## Features

- 🔄 Real-time tab synchronization across devices
- 💾 Save and restore browser sessions
- 🔒 Local-first architecture - your data stays on your network
- ⚡ Lightweight server with minimal resource usage
- 🌐 Support for multiple browsers (Chrome, Firefox, Edge)

## Configuration

Configure TabWave by editing `~/.tabwave/config.json`:

```json
{
  "port": 8080,
  "browser": "chrome",
  "autoSync": true
}
```

## License

MIT © 2024