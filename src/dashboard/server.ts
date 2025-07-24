import fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { join } from 'path';
import { SpecWatcher } from './watcher';
import { SpecParser } from './parser';
import open from 'open';
import { WebSocket } from 'ws';

interface WebSocketConnection {
  socket: WebSocket;
}

export interface DashboardOptions {
  port: number;
  projectPath: string;
  autoOpen?: boolean;
}

export class DashboardServer {
  private app: FastifyInstance;
  private watcher: SpecWatcher;
  private parser: SpecParser;
  private options: DashboardOptions;
  private clients: Set<WebSocket> = new Set();

  constructor(options: DashboardOptions) {
    this.options = options;
    this.parser = new SpecParser(options.projectPath);
    this.watcher = new SpecWatcher(options.projectPath, this.parser);

    this.app = fastify({ logger: false });
  }

  async start() {
    // Register plugins
    await this.app.register(fastifyStatic, {
      root: join(__dirname, 'public'),
      prefix: '/',
    });

    await this.app.register(fastifyWebsocket);

    // WebSocket endpoint for real-time updates
    const self = this;
    this.app.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection: WebSocketConnection) => {
        const socket = connection.socket;
        console.log('WebSocket client connected');

        // Add client to set
        self.clients.add(socket);

        // Send initial state
        self.parser
          .getAllSpecs()
          .then((specs) => {
            socket.send(
              JSON.stringify({
                type: 'initial',
                data: specs,
              })
            );
          })
          .catch((error) => {
            console.error('Error getting initial specs:', error);
          });

        // Handle client disconnect
        socket.on('close', () => {
          self.clients.delete(socket);
        });

        socket.on('error', (error: Error) => {
          console.error('WebSocket error:', error);
          self.clients.delete(socket);
        });
      });
    });

    // API endpoints
    this.app.get('/api/specs', async () => {
      const specs = await this.parser.getAllSpecs();
      return specs;
    });

    this.app.get('/api/info', async () => {
      const projectName = this.options.projectPath.split('/').pop() || 'Project';
      return { projectName };
    });

    this.app.get('/api/specs/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      const spec = await this.parser.getSpec(name);
      if (!spec) {
        reply.code(404).send({ error: 'Spec not found' });
      }
      return spec;
    });

    // Set up file watcher
    this.watcher.on('change', (event) => {
      // Broadcast to all connected clients
      const message = JSON.stringify({
        type: 'update',
        data: event,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          // WebSocket.OPEN
          client.send(message);
        }
      });
    });

    // Start watcher
    await this.watcher.start();

    // Start server
    await this.app.listen({ port: this.options.port, host: '0.0.0.0' });

    // Open browser if requested
    if (this.options.autoOpen) {
      await open(`http://localhost:${this.options.port}`);
    }
  }

  async stop() {
    // Close all WebSocket connections
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.close();
      }
    });
    this.clients.clear();

    // Stop the watcher
    await this.watcher.stop();

    // Close the Fastify server
    await this.app.close();
  }
}
