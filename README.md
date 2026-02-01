# ESXi MCP Server

MCP (Model Context Protocol) server สำหรับจัดการ VMware ESXi Host ผ่าน Claude Code

## Features

- **VM Management**: List, power on/off, restart, suspend VMs
- **Host Info**: CPU, memory, datastores, networks
- **Snapshot Management**: Create, delete, revert snapshots
- **ESXi 6.5+**: รองรับ vSphere REST API

## Tools

| Tool | Description |
|------|-------------|
| `esxi_list_vms` | List all VMs with status |
| `esxi_get_vm` | Get VM details |
| `esxi_power_on` | Power on VM |
| `esxi_power_off` | Power off VM |
| `esxi_restart_vm` | Restart VM |
| `esxi_suspend_vm` | Suspend VM |
| `esxi_host_info` | Get host info |
| `esxi_list_datastores` | List datastores |
| `esxi_list_networks` | List networks |
| `esxi_list_snapshots` | List VM snapshots |
| `esxi_create_snapshot` | Create snapshot |
| `esxi_delete_snapshot` | Delete snapshot |
| `esxi_revert_snapshot` | Revert to snapshot |

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/monthop-gmail/esxi-mcp-claude.git
cd esxi-mcp-claude
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

```env
ESXI_HOST=192.168.1.100
ESXI_USERNAME=root
ESXI_PASSWORD=your_password
ESXI_INSECURE=true
```

### 3. Start with Docker Compose

```bash
docker compose up -d --build
```

### 4. Verify

```bash
# Check status
docker compose ps

# Test health
curl http://localhost:3100/health
```

## Add to Claude Code

```bash
# Add MCP server
claude mcp add --transport sse --scope user esxi http://localhost:3100/sse

# Verify connection
claude mcp list

# Remove (if needed)
claude mcp remove esxi
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `http://localhost:3100/sse` | SSE connection for MCP |
| `http://localhost:3100/health` | Health check |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally (stdio mode)
npm start

# Run SSE mode
npm run start:sse
```

## License

MIT
