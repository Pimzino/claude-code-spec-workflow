// Multi-project dashboard app using shared components
PetiteVue.createApp({
  // Extend the base state from shared components
  ...window.DashboardShared.BaseAppState,
  
  // Multi dashboard specific state
  projects: [],
  selectedProject: null,
  selectedSpec: null,
  activeTasks: [],
  activeTab: 'active', // 'active' or 'projects'
  connected: false,
  ws: null,
  username: 'User',
  expandedRequirements: {},
  expandedDesigns: {},

  // Computed properties
  get activeSessionCount() {
    return this.projects.filter((p) => p.hasActiveSession).length;
  },

  // Initialize the dashboard
  async init() {
    console.log('Multi-project dashboard initializing...');
    this.initTheme();
    this.setupKeyboardHandlers();
    this.connectWebSocket();
  },

  // Connect to WebSocket for real-time updates
  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.connected = true;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket message:', message);
      this.handleWebSocketMessage(message);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.connected = false;
      setTimeout(() => this.connectWebSocket(), 2000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  },

  // Handle incoming WebSocket messages
  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'initial':
        this.projects = Array.isArray(message.data) ? this.normalizeProjects(message.data) : [];
        this.activeTasks = Array.isArray(message.activeTasks) ? message.activeTasks : [];
        this.username = message.username || 'User';

        console.log(
          `Received initial data: ${this.projects.length} projects, ${this.activeTasks.length} active tasks`
        );
        
        // Sort projects: active first, then by activity
        this.sortProjects();
        
        // Select first project if none selected
        if (!this.selectedProject && this.projects.length > 0 && this.activeTab === 'projects') {
          this.selectedProject = this.projects[0];
        }
        break;

      case 'new-project':
        // Add new project
        const newProject = this.normalizeProjects([message.data])[0];
        if (!this.projects.find((p) => p.path === newProject.path)) {
          this.projects.push(newProject);
          this.sortProjects();
        }
        console.log(`New project appeared: ${message.data.name}`);
        break;

      case 'remove-project':
        // Remove project
        this.projects = this.projects.filter((p) => p.path !== message.data.path);
        // If we were viewing the removed project, clear selection
        if (this.selectedProject?.path === message.data.path) {
          this.selectedProject = this.projects.length > 0 ? this.projects[0] : null;
        }
        break;

      case 'project-update':
        const event = message.data;
        const projectPath = message.projectPath;

        // Find and update the project
        const projectIndex = this.projects.findIndex((p) => p.path === projectPath);
        if (projectIndex >= 0) {
          const project = this.projects[projectIndex];
          
          switch (event.type) {
            case 'spec-update':
              if (project.specs) {
                const specIndex = project.specs.findIndex((s) => s.name === event.data.name);
                if (specIndex >= 0) {
                  project.specs[specIndex] = event.data;
                } else {
                  project.specs.push(event.data);
                }
              }
              break;
              
            case 'status-update':
              project.hasActiveSession = event.data.hasActiveSession;
              project.lastActivity = event.data.lastActivity;
              project.isClaudeActive = event.data.isClaudeActive;
              break;
              
            case 'git-update':
              project.gitBranch = event.data.branch;
              project.gitCommit = event.data.commit;
              break;
              
            case 'steering-update':
              project.steering = event.data;
              break;
          }
          
          this.sortProjects();
        }
        break;

      case 'active-tasks-update':
        this.activeTasks = Array.isArray(message.data) ? message.data : [];
        console.log(`Active tasks updated: ${this.activeTasks.length} tasks`);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  },

  // Switch between tabs
  switchTab(tab) {
    this.activeTab = tab;
  },

  // Select a project from active task
  selectProjectFromTask(projectPath, specName) {
    const project = this.projects.find((p) => p.path === projectPath);
    if (project) {
      this.selectedProject = project;
      this.activeTab = 'projects';
      
      // Find and expand the spec
      if (project.specs) {
        const spec = project.specs.find((s) => s.name === specName);
        if (spec) {
          this.selectedSpec = spec;
        }
      }
    }
  },

  // Project-specific methods
  getSpecsInProgress(project) {
    if (!project.specs) return 0;
    return project.specs.filter((s) => s.status === 'in-progress').length;
  },

  getSpecsCompleted(project) {
    if (!project.specs) return 0;
    return project.specs.filter((s) => s.status === 'completed').length;
  },

  getTotalTasks(project) {
    if (!project.specs) return 0;
    return project.specs.reduce((total, spec) => {
      return total + (spec.tasks?.total || 0);
    }, 0);
  },

  // Sort projects: active sessions first, then by last activity
  sortProjects() {
    this.projects.sort((a, b) => {
      // Active sessions come first
      if (a.hasActiveSession && !b.hasActiveSession) return -1;
      if (!a.hasActiveSession && b.hasActiveSession) return 1;
      
      // Then sort by last activity
      const dateA = a.lastActivity ? new Date(a.lastActivity) : new Date(0);
      const dateB = b.lastActivity ? new Date(b.lastActivity) : new Date(0);
      return dateB - dateA;
    });
  },

  // Active task helpers
  getTaskNumber(activeTask) {
    const spec = this.projects
      .find((p) => p.path === activeTask.projectPath)
      ?.specs?.find((s) => s.name === activeTask.specName);
    
    if (!spec?.tasks?.taskList) return 1;
    
    const taskIndex = spec.tasks.taskList.findIndex((t) => t.id === activeTask.task.id);
    return taskIndex >= 0 ? taskIndex + 1 : 1;
  },

  getSpecTaskCount(activeTask) {
    const spec = this.projects
      .find((p) => p.path === activeTask.projectPath)
      ?.specs?.find((s) => s.name === activeTask.specName);
    
    return spec?.tasks?.total || 0;
  },

  getSpecProgress(activeTask) {
    const spec = this.projects
      .find((p) => p.path === activeTask.projectPath)
      ?.specs?.find((s) => s.name === activeTask.specName);
    
    if (!spec?.tasks) return 0;
    return (spec.tasks.completed / spec.tasks.total) * 100;
  },

  getNextTask(activeTask) {
    const spec = this.projects
      .find((p) => p.path === activeTask.projectPath)
      ?.specs?.find((s) => s.name === activeTask.specName);
    
    if (!spec?.tasks?.taskList) return null;
    
    const currentIndex = spec.tasks.taskList.findIndex((t) => t.id === activeTask.task.id);
    if (currentIndex >= 0 && currentIndex < spec.tasks.taskList.length - 1) {
      const nextTask = spec.tasks.taskList[currentIndex + 1];
      if (!nextTask.completed) return nextTask;
    }
    
    return spec.tasks.taskList.find((t) => !t.completed && t.id !== activeTask.task.id);
  },

  // Requirements expand/collapse
  toggleRequirementsExpanded(specName) {
    if (this.expandedRequirements[specName]) {
      delete this.expandedRequirements[specName];
    } else {
      this.expandedRequirements[specName] = true;
    }
  },

  isRequirementsExpanded(specName) {
    return !!this.expandedRequirements[specName];
  },

  // Design expand/collapse
  toggleDesignExpanded(specName) {
    if (this.expandedDesigns[specName]) {
      delete this.expandedDesigns[specName];
    } else {
      this.expandedDesigns[specName] = true;
    }
  },

  isDesignExpanded(specName) {
    return !!this.expandedDesigns[specName];
  },

  // Normalize project data
  normalizeProjects(projects) {
    return projects.map((project) => {
      if (project.specs) {
        project.specs = project.specs.map((spec) => {
          // Initialize completed tasks as collapsed by default
          if (spec.tasks && this.getCompletedTaskCount(spec) > 0) {
            this.collapsedCompletedTasks[spec.name] = true;
          }
          
          // Ensure requirements content is properly handled
          if (spec.requirements && spec.requirements.content) {
            // Parse requirements if needed
            if (typeof spec.requirements.content === 'string') {
              try {
                spec.requirements.content = JSON.parse(spec.requirements.content);
              } catch (e) {
                console.warn('Failed to parse requirements content:', e);
              }
            }
          }

          // Ensure design content is properly parsed
          if (spec.design && spec.design.codeReuseContent) {
            if (typeof spec.design.codeReuseContent === 'string') {
              try {
                spec.design.codeReuseContent = JSON.parse(spec.design.codeReuseContent);
              } catch (e) {
                console.warn('Failed to parse design content:', e);
              }
            }
          }

          return spec;
        });
      }
      return project;
    });
  },

  // Override viewMarkdown to include projectPath
  async viewMarkdown(specName, docType) {
    if (!this.selectedProject) return;
    return window.DashboardShared.BaseAppState.viewMarkdown.call(
      this, 
      specName, 
      docType, 
      this.selectedProject.path
    );
  },

  // Get current task for a spec
  getCurrentTask(spec) {
    if (!spec.tasks || !spec.tasks.taskList || !spec.tasks.inProgress) return null;
    return spec.tasks.taskList.find(task => task.id === spec.tasks.inProgress);
  },

  // Scroll to a specific requirement
  scrollToRequirement(specName, requirementId) {
    const element = document.getElementById(`${specName}-req-${requirementId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}).mount('#app');