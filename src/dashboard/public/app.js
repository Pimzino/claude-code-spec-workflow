const { createApp } = PetiteVue;

createApp({
  // State
  specs: [],
  selectedSpec: null,
  connected: false,
  ws: null,

  // Computed
  get specsInProgress() {
    return this.specs.filter((s) => s.status === 'in-progress').length;
  },

  get specsCompleted() {
    return this.specs.filter((s) => s.status === 'completed').length;
  },

  get totalTasks() {
    return this.specs.reduce((total, spec) => {
      return total + (spec.tasks?.total || 0);
    }, 0);
  },

  // Methods
  async init() {
    await this.fetchSpecs();
    this.connectWebSocket();
  },

  async fetchSpecs() {
    try {
      const response = await fetch('/api/specs');
      this.specs = await response.json();
    } catch (error) {
      console.error('Error fetching specs:', error);
    }
  },

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.connected = true;
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleWebSocketMessage(message);
    };

    this.ws.onclose = () => {
      this.connected = false;
      console.log('WebSocket disconnected');
      // Reconnect after 3 seconds
      setTimeout(() => this.connectWebSocket(), 3000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  },

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'initial':
        this.specs = message.data;
        break;

      case 'update':
        const event = message.data;
        if (event.type === 'removed') {
          this.specs = this.specs.filter((s) => s.name !== event.spec);
        } else {
          // Update or add the spec
          const index = this.specs.findIndex((s) => s.name === event.spec);
          if (index >= 0 && event.data) {
            this.specs[index] = event.data;
          } else if (event.data) {
            this.specs.push(event.data);
          }
        }
        // Sort by last modified
        this.specs.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        break;
    }
  },

  refresh() {
    this.fetchSpecs();
  },

  getStatusClass(status) {
    const classes = {
      'not-started': 'bg-gray-100 text-gray-800',
      requirements: 'bg-blue-100 text-blue-800',
      design: 'bg-purple-100 text-purple-800',
      tasks: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  },

  getStatusLabel(status) {
    const labels = {
      'not-started': 'Not Started',
      requirements: 'Requirements',
      design: 'Design',
      tasks: 'Tasks',
      'in-progress': 'In Progress',
      completed: 'Completed',
    };
    return labels[status] || status;
  },

  formatDate(date) {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }

    // Default to date string
    return d.toLocaleDateString();
  },
}).mount('#app');
