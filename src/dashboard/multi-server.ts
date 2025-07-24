import fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { join } from 'path';
import { SpecWatcher } from './watcher';
import { SpecParser } from './parser';
import { ProjectDiscovery, DiscoveredProject } from './project-discovery';
import open from 'open';
import { WebSocket } from 'ws';
import { userInfo } from 'os';

interface ProjectState {
  project: DiscoveredProject;
  parser: SpecParser;
  watcher: SpecWatcher;
}

export interface MultiDashboardOptions {
  port: number;
  autoOpen?: boolean;
}

export class MultiProjectDashboardServer {
  private app: FastifyInstance;
  private options: MultiDashboardOptions;
  private clients: Set<WebSocket> = new Set();
  private projects: Map<string, ProjectState> = new Map();
  private discovery: ProjectDiscovery;
  private rescanInterval?: ReturnType<typeof setInterval>;

  constructor(options: MultiDashboardOptions) {
    this.options = options;
    this.discovery = new ProjectDiscovery();
    this.app = fastify({ logger: false });
  }

  async start() {
    // Discover projects
    console.log('Discovering Claude projects...');
    const discoveredProjects = await this.discovery.discoverProjects();
    console.log(`Found ${discoveredProjects.length} projects with .claude directories`);

    // Filter to show projects with specs OR active Claude sessions
    const activeProjects = discoveredProjects.filter(p => 
      (p.specCount || 0) > 0 || p.hasActiveSession
    );
    console.log(`${activeProjects.length} projects have specs or active sessions`);

    // Initialize watchers for each project
    for (const project of activeProjects) {
      await this.initializeProject(project);
    }

    // Register plugins
    await this.app.register(fastifyStatic, {
      root: join(__dirname, 'public'),
      prefix: '/public/',
    });

    // Serve multi.html as the main page
    this.app.get('/', async (request, reply) => {
      return reply.sendFile('multi.html', join(__dirname, 'public'));
    });

    await this.app.register(fastifyWebsocket);

    // WebSocket endpoint
    const self = this;
    this.app.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection: any) => {
        const socket = connection.socket;
        console.log('Multi-project WebSocket client connected');

        self.clients.add(socket);

        // Send initial state with all projects
        self.sendInitialState(socket);

        socket.on('close', () => {
          self.clients.delete(socket);
        });

        socket.on('error', (error: any) => {
          console.error('WebSocket error:', error);
          self.clients.delete(socket);
        });
      });
    });

    // API endpoints
    this.app.get('/api/projects', async () => {
      const projectList = Array.from(this.projects.values()).map(p => ({
        ...p.project,
        specs: []  // Don't include specs in list
      }));
      return projectList;
    });

    this.app.get('/api/projects/:projectPath/specs', async (request, reply) => {
      const { projectPath } = request.params as { projectPath: string };
      const decodedPath = decodeURIComponent(projectPath);
      const projectState = this.projects.get(decodedPath);
      
      if (!projectState) {
        reply.code(404).send({ error: 'Project not found' });
        return;
      }
      
      const specs = await projectState.parser.getAllSpecs();
      return specs;
    });

    // Start server
    await this.app.listen({ port: this.options.port, host: '0.0.0.0' });

    // Start periodic rescan for new active projects
    this.startPeriodicRescan();

    // Open browser if requested
    if (this.options.autoOpen) {
      await open(`http://localhost:${this.options.port}`);
    }
  }

  private async initializeProject(project: DiscoveredProject) {
    const parser = new SpecParser(project.path);
    const watcher = new SpecWatcher(project.path, parser);

    // Set up watcher events
    watcher.on('change', async (event) => {
      // Broadcast update with project context
      const message = JSON.stringify({
        type: 'project-update',
        projectPath: project.path,
        data: event,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });

      // Also send updated active tasks
      const activeTasks = await this.collectActiveTasks();
      const activeTasksMessage = JSON.stringify({
        type: 'active-tasks-update',
        activeTasks,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(activeTasksMessage);
        }
      });
    });

    await watcher.start();

    this.projects.set(project.path, {
      project,
      parser,
      watcher,
    });
  }

  private async sendInitialState(socket: WebSocket) {
    const projects = await Promise.all(
      Array.from(this.projects.entries()).map(async ([, state]) => {
        const specs = await state.parser.getAllSpecs();
        return {
          ...state.project,
          specs,
        };
      })
    );

    // Collect all active tasks across projects
    const activeTasks = await this.collectActiveTasks();

    socket.send(
      JSON.stringify({
        type: 'initial',
        data: projects,
        activeTasks,
        username: this.getUsername(),
      })
    );
  }

  private async collectActiveTasks(): Promise<any[]> {
    const activeTasks: any[] = [];
    
    for (const [projectPath, state] of this.projects) {
      // Only collect tasks from projects with active Claude sessions
      if (!state.project.hasActiveSession) {
        continue;
      }
      
      const specs = await state.parser.getAllSpecs();
      
      for (const spec of specs) {
        if (spec.tasks && spec.tasks.taskList.length > 0 && spec.tasks.inProgress) {
          // Only get the currently active task (marked as in progress)
          const activeTask = this.findTaskById(spec.tasks.taskList, spec.tasks.inProgress);
          
          if (activeTask) {
            activeTasks.push({
              projectPath,
              projectName: state.project.name,
              specName: spec.name,
              specDisplayName: spec.displayName,
              task: activeTask,
              isCurrentlyActive: true,
              hasActiveSession: true,
            });
          }
        }
      }
    }
    
    // Sort by currently active first, then by project name
    activeTasks.sort((a, b) => {
      if (a.isCurrentlyActive && !b.isCurrentlyActive) return -1;
      if (!a.isCurrentlyActive && b.isCurrentlyActive) return 1;
      return a.projectName.localeCompare(b.projectName);
    });
    
    return activeTasks;
  }

  private findTaskById(tasks: any[], taskId: string): any | null {
    for (const task of tasks) {
      if (task.id === taskId) {
        return task;
      }
      
      if (task.subtasks) {
        const found = this.findTaskById(task.subtasks, taskId);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  }

  private startPeriodicRescan() {
    // Rescan every 30 seconds for new active projects
    this.rescanInterval = setInterval(async () => {
      const currentProjects = await this.discovery.discoverProjects();
      const activeProjects = currentProjects.filter(p => 
        (p.specCount || 0) > 0 || p.hasActiveSession
      );

      // Check for new projects
      for (const project of activeProjects) {
        if (!this.projects.has(project.path)) {
          console.log(`New active project detected: ${project.name}`);
          await this.initializeProject(project);
          
          // Notify all clients about the new project
          const specs = await this.projects.get(project.path)?.parser.getAllSpecs() || [];
          const projectData = { ...project, specs };
          
          const message = JSON.stringify({
            type: 'new-project',
            data: projectData,
          });

          this.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(message);
            }
          });
        }
      }

      // Check for projects that are no longer active
      for (const [path, state] of this.projects) {
        const stillActive = activeProjects.some(p => p.path === path);
        if (!stillActive) {
          const hasSpecs = (await state.parser.getAllSpecs()).length > 0;
          const currentProject = activeProjects.find(p => p.path === path);
          const hasActiveSession = currentProject?.hasActiveSession || false;
          
          if (!hasSpecs && !hasActiveSession) {
            console.log(`Project no longer active: ${state.project.name}`);
            await state.watcher.stop();
            this.projects.delete(path);
            
            // Notify clients to remove the project
            const message = JSON.stringify({
              type: 'remove-project',
              data: { path },
            });

            this.clients.forEach((client) => {
              if (client.readyState === 1) {
                client.send(message);
              }
            });
          }
        }
      }
    }, 30000); // 30 seconds
  }

  async stop() {
    // Stop the rescan interval
    if (this.rescanInterval) {
      clearInterval(this.rescanInterval);
    }

    // Stop all watchers
    for (const [, state] of this.projects) {
      await state.watcher.stop();
    }

    // Close all WebSocket connections
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.close();
      }
    });
    this.clients.clear();

    // Close the server
    await this.app.close();
  }

  private getUsername(): string {
    try {
      const info = userInfo();
      // Try to get the full name first, fall back to username
      const username = info.username || 'User';
      // Capitalize first letter
      return username.charAt(0).toUpperCase() + username.slice(1);
    } catch {
      return 'User';
    }
  }
}