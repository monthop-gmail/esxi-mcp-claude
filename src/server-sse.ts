#!/usr/bin/env node
import http from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config, validateConfig } from './config.js';
import { TOOLS, handleToolCall } from './tools/index.js';

// Validate configuration
try {
  validateConfig();
} catch (error) {
  console.error('Configuration error:', (error as Error).message);
  console.error('Please set ESXI_HOST and ESXI_PASSWORD environment variables');
  process.exit(1);
}

// Create MCP server
const mcpServer = new Server(
  {
    name: 'esxi-mcp-claude',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Register tool call handler
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await handleToolCall(name, args || {});

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Active SSE connections
const connections = new Map<string, SSEServerTransport>();

// HTTP Server for SSE
const httpServer = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // Health check endpoint
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'esxi-mcp-claude' }));
    return;
  }

  // SSE endpoint
  if (url.pathname === '/sse') {
    const transport = new SSEServerTransport('/message', res);
    const sessionId = crypto.randomUUID();

    connections.set(sessionId, transport);

    res.on('close', () => {
      connections.delete(sessionId);
    });

    await mcpServer.connect(transport);
    return;
  }

  // Message endpoint for SSE
  if (url.pathname === '/message' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        // Find the transport that should handle this message
        // In a real implementation, you'd need to track session IDs properly
        for (const transport of connections.values()) {
          await transport.handlePostMessage(req, res, body);
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No active SSE connection' }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start HTTP server
httpServer.listen(config.sse.port, config.sse.host, () => {
  console.log(`ESXi MCP Server (SSE) running at http://${config.sse.host}:${config.sse.port}`);
  console.log('Endpoints:');
  console.log(`  - SSE: http://${config.sse.host}:${config.sse.port}/sse`);
  console.log(`  - Health: http://${config.sse.host}:${config.sse.port}/health`);
});
