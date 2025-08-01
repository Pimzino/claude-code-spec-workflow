/**
 * Task command generation utilities
 * Parses tasks.md files and generates individual command files
 */

export interface ParsedTask {
  id: string;
  description: string;
  leverage?: string;
  requirements?: string;
}

/**
 * Parse tasks from a tasks.md markdown file
 * Handles various formats agents might produce:
 * - [ ] 1. Task description
 * - [ ] 2.1 Subtask description  
 *   - Details
 *   - _Requirements: 1.1, 2.2_
 *   - _Leverage: existing component X_
 */
export function parseTasksFromMarkdown(content: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const lines = content.split('\n');
  
  let currentTask: ParsedTask | null = null;
  let isCollectingTaskContent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Match task lines with flexible format:
    // Supports: "- [ ] 1. Task", "- [] 1 Task", "- [ ] 1.1. Task", etc.
    // Also handles various spacing and punctuation
    const taskMatch = trimmedLine.match(/^-\s*\[\s*\]\s*([0-9]+(?:\.[0-9]+)*)\s*\.?\s*(.+)$/);
    
    if (taskMatch) {
      // If we have a previous task, save it
      if (currentTask) {
        tasks.push(currentTask);
      }
      
      // Start new task
      const taskId = taskMatch[1];
      const taskDescription = taskMatch[2].trim();
      
      currentTask = {
        id: taskId,
        description: taskDescription
      };
      isCollectingTaskContent = true;
    } 
    // If we're in a task, look for metadata anywhere in the task block
    else if (currentTask && isCollectingTaskContent) {
      // Check if this line starts a new task section (to stop collecting)
      if (trimmedLine.match(/^-\s*\[\s*\]\s*[0-9]/)) {
        // This is the start of a new task, process it in the next iteration
        i--;
        isCollectingTaskContent = false;
        continue;
      }
      
      // Check for _Requirements: anywhere in the line
      const requirementsMatch = line.match(/_Requirements:\s*(.+?)(?:_|$)/);
      if (requirementsMatch) {
        currentTask.requirements = requirementsMatch[1].trim();
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
  
  // Log parsing results for debugging
  console.log(`Parsed ${tasks.length} tasks from markdown`);
  if (tasks.length === 0 && content.trim().length > 0) {
    console.log('Warning: No tasks found. Content preview:');
    console.log(content.substring(0, 500) + '...');
  }
  
  return tasks;
}

/**
 * Generate a command file for a specific task
 */
export async function generateTaskCommand(
  commandsDir: string, 
  specName: string, 
  task: ParsedTask
): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const commandFile = path.join(commandsDir, `task-${task.id}.md`);
  
  let content = `# ${specName} - Task ${task.id}

Execute task ${task.id} for the ${specName} specification.

## Task Description
${task.description}

`;

  // Add Code Reuse section if leverage info exists
  if (task.leverage) {
    content += `## Code Reuse
**Leverage existing code**: ${task.leverage}

`;
  }

  // Add Requirements section if requirements exist
  if (task.requirements) {
    content += `## Requirements Reference
**Requirements**: ${task.requirements}

`;
  }

  content += `## Usage
\`\`\`
/${specName}-task-${task.id}
\`\`\`

## Instructions

1. **Load Context & Environment**
   Run: \`npx @pimzino/claude-code-spec-workflow inspect-setup --spec ${specName} --task ${task.id}\`
   
   This provides:
   - Complete environment information
   - Specific task details and context
   - Available agents and steering documents
   - Spec documents (requirements, design)

2. **Execute Based on Environment**

**Agent-Based Execution (if available)**: Use spec-task-executor agent if shown in environment check:

\`\`\`
Use the spec-task-executor agent to implement task ${task.id}: "${task.description}" for the ${specName} specification.

The agent should use the loaded context from inspect-setup and:
1. Implement ONLY task ${task.id}: "${task.description}"
2. Follow all project conventions and leverage existing code
3. Mark the task as complete in tasks.md
4. Provide a completion summary

Task details from context:
- ID: ${task.id}
- Description: ${task.description}${task.leverage ? `
- Leverage: ${task.leverage}` : ''}${task.requirements ? `
- Requirements: ${task.requirements}` : ''}
\`\`\`

**Manual Execution (fallback)**: If agent not available according to environment check:

1. **Use Loaded Context**
   - All context is already loaded from inspect-setup command
   - Task details, requirements, design, and steering docs are available
   - Focus on implementing the specific task

2. **Implementation Process**
   1. Execute task ${task.id}: "${task.description}"
   2. **Prioritize code reuse**: Use existing components and utilities${task.leverage ? ` identified above` : ''}
   3. Follow implementation guidelines and project conventions
   4. **CRITICAL**: Mark the task as complete in tasks.md by changing [ ] to [x]
   5. Confirm task completion to user
   6. Stop and wait for user review

**Important Rules**:
- Execute ONLY this specific task
- **Leverage existing code** whenever possible to avoid rebuilding functionality
- **Follow project conventions** from steering documents
- Mark task as complete by changing [ ] to [x] in tasks.md
- Stop after completion and wait for user approval
- Do not automatically proceed to the next task
- Validate implementation against referenced requirements

## Task Completion Protocol
When completing this task:
1. **Update tasks.md**: Change task ${task.id} status from \`- [ ]\` to \`- [x]\`
2. **Confirm to user**: State clearly "Task ${task.id} has been marked as complete"
3. **Stop execution**: Do not proceed to next task automatically
4. **Wait for instruction**: Let user decide next steps

## Post-Implementation Actions

**Review (if agent available from environment check)**:
If spec-task-implementation-reviewer agent is available, use it to review the implementation:

\`\`\`
Use the spec-task-implementation-reviewer agent to review the implementation of task ${task.id} for the ${specName} specification.

The agent should use the previously loaded context and:
1. Review the implementation for correctness and compliance
2. Provide structured feedback on the implementation quality
3. Identify any issues that need to be addressed
\`\`\`

**Code Quality Check (if agent available from environment check)**:
If spec-duplication-detector agent is available, use it to analyze code quality:

\`\`\`
Use the spec-duplication-detector agent to analyze code duplication for task ${task.id} of the ${specName} specification.

The agent should analyze the implementation and suggest improvements for maintainability.
\`\`\`

**Integration Testing (if agent available from environment check)**:
If spec-integration-tester agent is available, use it to test the implementation:

\`\`\`
Use the spec-integration-tester agent to test the implementation of task ${task.id} for the ${specName} specification.

The agent should validate functionality and regression testing.
\`\`\`

## Next Steps
After task completion, you can:
- Review the implementation (automated if spec-task-implementation-reviewer agent is available)
- Run integration tests (automated if spec-integration-tester agent is available)
- Address any issues identified in reviews or tests
- Execute the next task using /${specName}-task-[next-id]
- Check overall progress with /spec-status ${specName}
- If all tasks complete, run /spec-completion-review ${specName}
`;

  await fs.writeFile(commandFile, content, 'utf8');
}