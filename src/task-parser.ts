/**
 * Advanced task parsing utilities for intelligent content loading
 */

export interface TaskInfo {
  id: string;
  description: string;
  status: 'pending' | 'completed';
  requirements_ref?: string;
  leverage?: string;
  full_text: string;
  parent_task?: string;
}

export interface TaskSummary {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_percentage: number;
  next_pending_task?: TaskInfo;
  last_completed_task?: TaskInfo;
  recommended_next_task?: TaskInfo;
  execution_ready: boolean;
}

export interface TaskContext {
  parent_task?: string;
  total_tasks: number;
  completed_tasks: number;
  next_task?: string;
  previous_task?: string;
}

/**
 * Parse a specific task from tasks.md content
 */
export function parseSpecificTask(tasksContent: string, taskId: string): TaskInfo | null {
  // Use the robust parseAllTasks and find the specific task
  const allTasks = parseAllTasks(tasksContent);
  return allTasks.find(task => task.id === taskId) || null;
}

/**
 * Parse task summary statistics from tasks.md content
 */
export function parseTaskSummary(tasksContent: string): TaskSummary {
  // Use the robust parseAllTasks to get all tasks
  const tasks = parseAllTasks(tasksContent);

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  
  // Calculate recommended next task using inline logic to avoid circular dependency
  let recommendedTask: TaskInfo | undefined;
  let executionReady = false;
  
  if (pendingTasks.length > 0) {
    if (completedTasks.length === 0) {
      // Start with first task
      recommendedTask = pendingTasks[0];
      executionReady = true;
    } else {
      // Find tasks whose dependencies are satisfied
      const readyTasks = pendingTasks.filter(task => {
        return areTaskDependenciesSatisfied(task, tasks, completedTasks);
      });
      
      if (readyTasks.length > 0) {
        // Sort by hierarchy and ID
        readyTasks.sort((a, b) => {
          const aDepth = getTaskDepth(a.id);
          const bDepth = getTaskDepth(b.id);
          
          if (aDepth !== bDepth) {
            return aDepth - bDepth;
          }
          
          return compareTaskIds(a.id, b.id);
        });
        
        recommendedTask = readyTasks[0];
        executionReady = true;
      } else {
        // Fallback to first pending task
        recommendedTask = pendingTasks[0];
        executionReady = true;
      }
    }
  }
  
  return {
    total_tasks: tasks.length,
    completed_tasks: completedTasks.length,
    pending_tasks: pendingTasks.length,
    completion_percentage: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    next_pending_task: pendingTasks.length > 0 ? pendingTasks[0] : undefined,
    last_completed_task: completedTasks.length > 0 ? completedTasks[completedTasks.length - 1] : undefined,
    recommended_next_task: recommendedTask,
    execution_ready: executionReady
  };
}

/**
 * Get task context for a specific task
 */
export function getTaskContext(tasksContent: string, taskId: string): TaskContext | null {
  const summary = parseTaskSummary(tasksContent);
  const allTasks = parseAllTasks(tasksContent);
  
  const taskIndex = allTasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return null;

  return {
    parent_task: getParentTaskId(taskId),
    total_tasks: summary.total_tasks,
    completed_tasks: summary.completed_tasks,
    next_task: taskIndex < allTasks.length - 1 ? allTasks[taskIndex + 1].id : undefined,
    previous_task: taskIndex > 0 ? allTasks[taskIndex - 1].id : undefined
  };
}

/**
 * Parse all tasks from tasks.md (for full loading mode)
 * Based on the proven parseTasksFromMarkdown logic but extended for completed tasks
 */
export function parseAllTasks(tasksContent: string): TaskInfo[] {
  const tasks: TaskInfo[] = [];
  const lines = tasksContent.split('\n');
  
  let currentTask: TaskInfo | null = null;
  let isCollectingTaskContent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Match both pending and completed tasks using the proven regex pattern
    // Extended to handle [x] and [ ] checkboxes
    const taskMatch = trimmedLine.match(/^-\s*\[([x\s]*)\]\s*([0-9]+(?:\.[0-9]+)*)\s*[:.]*\s*(.+)$/);
    
    if (taskMatch) {
      // If we have a previous task, save it
      if (currentTask) {
        tasks.push(currentTask);
      }
      
      // Start new task
      const status = taskMatch[1].trim();
      const taskId = taskMatch[2];
      const taskDescription = taskMatch[3].trim();
      
      currentTask = {
        id: taskId,
        description: taskDescription,
        status: status === 'x' ? 'completed' : 'pending',
        full_text: line,
        parent_task: getParentTaskId(taskId)
      };
      isCollectingTaskContent = true;
    } 
    // If we're in a task, look for metadata anywhere in the task block
    else if (currentTask && isCollectingTaskContent) {
      // Check if this line starts a new task section (to stop collecting)
      if (trimmedLine.match(/^-\s*\[[x\s]*\]\s*[0-9]/)) {
        // This is the start of a new task, process it in the next iteration
        i--;
        isCollectingTaskContent = false;
        continue;
      }
      
      // Check for _Requirements: anywhere in the line
      const requirementsMatch = line.match(/_Requirements:\s*(.+?)(?:_|$)/);
      if (requirementsMatch) {
        currentTask.requirements_ref = requirementsMatch[1].trim();
      }
      
      // Check for _Leverage: anywhere in the line
      const leverageMatch = line.match(/_Leverage:\s*(.+?)(?:_|$)/);
      if (leverageMatch) {
        currentTask.leverage = leverageMatch[1].trim();
      }
      
      // Stop collecting if we hit an empty line followed by non-indented content
      if (trimmedLine === '' && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine.length > 0 && nextLine[0] !== ' ' && nextLine[0] !== '\t' && !nextLine.startsWith('  -')) {
          isCollectingTaskContent = false;
        }
      }
    }
  }
  
  // Don't forget the last task
  if (currentTask) {
    tasks.push(currentTask);
  }
  
  return tasks;
}

// Metadata parsing is now handled inline in parseAllTasks

/**
 * Get parent task ID (e.g., "2.1" -> "2", "3.2.1" -> "3.2")
 */
function getParentTaskId(taskId: string): string | undefined {
  const parts = taskId.split('.');
  if (parts.length > 1) {
    return parts.slice(0, -1).join('.');
  }
  return undefined;
}

/**
 * Find next pending task in sequence (simple version)
 */
export function findNextPendingTask(tasksContent: string): TaskInfo | null {
  const tasks = parseAllTasks(tasksContent);
  return tasks.find(task => task.status === 'pending') || null;
}

/**
 * Intelligent next task recommendation based on task dependencies and hierarchy
 */
export function getRecommendedNextTask(tasksContent: string): TaskInfo | null {
  const tasks = parseAllTasks(tasksContent);
  
  if (tasks.length === 0) return null;
  
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  
  if (pendingTasks.length === 0) return null;
  
  // Strategy 1: If no tasks completed yet, start with first task
  if (completedTasks.length === 0) {
    return pendingTasks[0];
  }
  
  // Strategy 2: Find tasks whose dependencies are satisfied
  const readyTasks = pendingTasks.filter(task => {
    return areTaskDependenciesSatisfied(task, tasks, completedTasks);
  });
  
  if (readyTasks.length === 0) {
    // Fallback: return first pending task if dependency analysis fails
    return pendingTasks[0];
  }
  
  // Strategy 3: Prioritize by hierarchy (lower level numbers first)
  readyTasks.sort((a, b) => {
    const aDepth = getTaskDepth(a.id);
    const bDepth = getTaskDepth(b.id);
    
    if (aDepth !== bDepth) {
      return aDepth - bDepth; // Shallower tasks first
    }
    
    // Same depth, sort by task ID
    return compareTaskIds(a.id, b.id);
  });
  
  return readyTasks[0];
}

/**
 * Check if a task's dependencies are satisfied
 */
function areTaskDependenciesSatisfied(
  task: TaskInfo, 
  allTasks: TaskInfo[], 
  completedTasks: TaskInfo[]
): boolean {
  // Check if parent task is completed (for hierarchical dependencies)
  if (task.parent_task) {
    const parentCompleted = completedTasks.some(t => t.id === task.parent_task);
    if (!parentCompleted) {
      // Check if parent task exists at all
      const parentExists = allTasks.some(t => t.id === task.parent_task);
      if (parentExists) {
        return false; // Parent exists but not completed
      }
      // Parent doesn't exist, so no hierarchical dependency
    }
  }
  
  // Check for sequential dependencies (previous sibling tasks)
  const siblingTasks = getSiblingTasks(task, allTasks);
  const taskIndex = getTaskIndexInSiblings(task, siblingTasks);
  
  // All previous sibling tasks must be completed
  for (let i = 0; i < taskIndex; i++) {
    const prevSibling = siblingTasks[i];
    const isCompleted = completedTasks.some(t => t.id === prevSibling.id);
    if (!isCompleted) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get sibling tasks (tasks at the same hierarchical level)
 */
function getSiblingTasks(task: TaskInfo, allTasks: TaskInfo[]): TaskInfo[] {
  const taskDepth = getTaskDepth(task.id);
  const parentId = task.parent_task;
  
  return allTasks.filter(t => {
    const tDepth = getTaskDepth(t.id);
    const tParent = t.parent_task;
    
    return tDepth === taskDepth && tParent === parentId;
  }).sort((a, b) => compareTaskIds(a.id, b.id));
}

/**
 * Get task index within its siblings
 */
function getTaskIndexInSiblings(task: TaskInfo, siblings: TaskInfo[]): number {
  return siblings.findIndex(t => t.id === task.id);
}

/**
 * Get task depth in hierarchy (1 = 0, 1.1 = 1, 1.1.1 = 2)
 */
function getTaskDepth(taskId: string): number {
  return taskId.split('.').length - 1;
}

/**
 * Compare task IDs for sorting (handles numeric comparison properly)
 */
function compareTaskIds(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  const maxLength = Math.max(aParts.length, bParts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    
    if (aVal !== bVal) {
      return aVal - bVal;
    }
  }
  
  return 0;
}

/**
 * Check if tasks are ready for execution (have actionable next steps)
 */
export function isExecutionReady(tasksContent: string): boolean {
  const recommendedTask = getRecommendedNextTask(tasksContent);
  return recommendedTask !== null;
}

/**
 * Get execution status and recommendations
 */
export function getExecutionStatus(tasksContent: string): {
  ready: boolean;
  next_task?: TaskInfo;
  blocked_reason?: string;
  total_remaining: number;
} {
  const tasks = parseAllTasks(tasksContent);
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const recommendedTask = getRecommendedNextTask(tasksContent);
  
  if (pendingTasks.length === 0) {
    return {
      ready: false,
      blocked_reason: 'All tasks completed',
      total_remaining: 0
    };
  }
  
  if (!recommendedTask) {
    return {
      ready: false,
      blocked_reason: 'No tasks ready for execution (dependency issues)',
      total_remaining: pendingTasks.length
    };
  }
  
  return {
    ready: true,
    next_task: recommendedTask,
    total_remaining: pendingTasks.length
  };
}

/**
 * Validate task ID format
 */
export function isValidTaskId(taskId: string): boolean {
  return /^\d+(?:\.\d+)*$/.test(taskId);
}

export default {
  parseSpecificTask,
  parseTaskSummary,
  getTaskContext,
  parseAllTasks,
  findNextPendingTask,
  getRecommendedNextTask,
  isExecutionReady,
  getExecutionStatus,
  isValidTaskId
};