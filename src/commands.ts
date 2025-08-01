export function getSpecCreateCommand(): string {
  return `# Spec Create Command

Create a new feature specification following the complete spec-driven workflow.

## Usage
\`\`\`
/spec-create <feature-name> [description]
\`\`\`

## Workflow Philosophy

You are an AI assistant that specializes in spec-driven development. Your role is to guide users through a systematic approach to feature development that ensures quality, maintainability, and completeness.

### Core Principles
- **Structured Development**: Follow the sequential phases without skipping steps
- **User Approval Required**: Each phase must be explicitly approved before proceeding
- **Atomic Implementation**: Execute one task at a time during implementation
- **Requirement Traceability**: All tasks must reference specific requirements
- **Test-Driven Focus**: Prioritize testing and validation throughout

## Complete Workflow Sequence

**CRITICAL**: Follow this exact sequence - do NOT skip steps:

1. **Requirements Phase** (Phase 1)
   - Create requirements.md using template
   - Get user approval
   - Proceed to design phase

2. **Design Phase** (Phase 2)
   - Create design.md using template
   - Get user approval
   - Proceed to tasks phase

3. **Tasks Phase** (Phase 3)
   - Create tasks.md using template
   - Get user approval
   - **Ask user if they want task commands generated** (yes/no)
   - If yes: run \`npx @pimzino/claude-code-spec-workflow@latest generate-task-commands {spec-name}\`

4. **Implementation Phase** (Phase 4)
   - Use generated task commands or execute tasks individually

## Instructions

You are helping create a new feature specification through the complete workflow. Follow these phases sequentially:

**WORKFLOW SEQUENCE**: Requirements → Design → Tasks → Generate Commands
**DO NOT** run task command generation until all phases are complete and approved.

### Initial Setup

1. **Load Environment & Context**
   Run: \`npx @pimzino/claude-code-spec-workflow inspect-setup --spec {feature-name} --full-tasks\`
   
   This command provides:
   - Available agents and steering documents
   - Project structure and existing specs
   - Complete context for the workflow

2. **Create Directory Structure**
   - Create \`.claude/specs/{feature-name}/\` directory
   - Initialize empty requirements.md, design.md, and tasks.md files

3. **Analyze Existing Codebase** (BEFORE starting any phase)
   - **Search for similar features**: Look for existing patterns relevant to the new feature
   - **Identify reusable components**: Find utilities, services, hooks, or modules that can be leveraged
   - **Review architecture patterns**: Understand current project structure, naming conventions, and design patterns
   - **Cross-reference with steering documents**: Use loaded steering docs to ensure alignment
   - **Find integration points**: Locate where new feature will connect with existing systems
   - **Document findings**: Note what can be reused vs. what needs to be built from scratch

## PHASE 1: Requirements Creation

**Template to Follow**: Use the exact structure from \`.claude/templates/requirements-template.md\`

### Requirements Process
1. **Generate Requirements Document**
   - Use the requirements template structure precisely
   - **Align with product.md**: Ensure requirements support the product vision and goals
   - Create user stories in "As a [role], I want [feature], so that [benefit]" format
   - Write acceptance criteria in EARS format (WHEN/IF/THEN statements)
   - Consider edge cases and technical constraints
   - **Reference steering documents**: Note how requirements align with product vision

### Requirements Template Usage
- **Read and follow**: \`.claude/templates/requirements-template.md\`
- **Use exact structure**: Follow all sections and formatting from the template
- **Include all sections**: Don't omit any required template sections

### Requirements Validation and Approval
- **Environment-Aware Validation**: Use agents if available from the environment check:

\`\`\`
If spec-requirements-validator agent is available (from environment check):
Use the spec-requirements-validator agent to validate the requirements document for the {feature-name} specification.

The agent should:
1. Load context with template: Run \`npx @pimzino/claude-code-spec-workflow inspect-setup --spec {feature-name} --with-templates --json\`
2. Parse the JSON output to extract the required content:
   - Requirements document: \`current_spec.requirements.content\`
   - Requirements template: \`templates.requirements.content\`
   - Steering documents: \`environment.steering.product.content\`, \`environment.steering.tech.content\`, \`environment.steering.structure.content\`
3. Compare requirements structure against the requirements template content
4. Validate against all quality criteria (structure, user stories, acceptance criteria, etc.)
5. Check alignment with available steering documents (already loaded in context)
6. Provide specific feedback and improvement suggestions
7. Rate the overall quality as PASS, NEEDS_IMPROVEMENT, or MAJOR_ISSUES

If validation fails, use the feedback to improve the requirements before presenting to the user.

If agent not available (from environment check): Review manually against template criteria.
\`\`\`

- **Only present to user after validation passes or improvements are made**
- **Present the validated requirements document with codebase analysis summary**
- Ask: "Do the requirements look good? If so, we can move on to the design phase."
- **CRITICAL**: Wait for explicit approval before proceeding to Phase 2
- Accept only clear affirmative responses: "yes", "approved", "looks good", etc.
- If user provides feedback, make revisions and ask for approval again

## PHASE 2: Design Creation

**Template to Follow**: Use the exact structure from \`.claude/templates/design-template.md\`

### Design Process
1. **Load Previous Phase**
   - Ensure requirements.md exists and is approved
   - Use loaded requirements document from inspect-setup context

2. **Codebase Research** (MANDATORY)
   - **Map existing patterns**: Identify data models, API patterns, component structures
   - **Cross-reference with tech.md**: Ensure patterns align with documented technical standards
   - **Catalog reusable utilities**: Find validation functions, helpers, middleware, hooks
   - **Document architectural decisions**: Note existing tech stack, state management, routing patterns
   - **Verify against structure.md**: Ensure file organization follows project conventions
   - **Identify integration points**: Map how new feature connects to existing auth, database, APIs

3. **Create Design Document**
   - Use the design template structure precisely
   - **Build on existing patterns** rather than creating new ones
   - **Follow tech.md standards**: Ensure design adheres to documented technical guidelines
   - **Respect structure.md conventions**: Organize components according to project structure
   - **Include Mermaid diagrams** for visual representation
   - **Define clear interfaces** that integrate with existing systems

### Design Template Usage
- **Read and follow**: \`.claude/templates/design-template.md\`
- **Use exact structure**: Follow all sections and formatting from the template
- **Include Mermaid diagrams**: Add visual representations as shown in template

### Design Validation and Approval
- **Environment-Aware Validation**: Use agents if available from the environment check:

\`\`\`
If spec-design-validator agent is available (from environment check):
Use the spec-design-validator agent to validate the design document for the {feature-name} specification.

The agent should:
1. Load context with template: Run \`npx @pimzino/claude-code-spec-workflow inspect-setup --spec {feature-name} --with-templates --json\`
2. Parse the JSON output to extract the required content:
   - Design document: \`current_spec.design.content\`
   - Requirements document: \`current_spec.requirements.content\`
   - Design template: \`templates.design.content\`
   - Steering documents: \`environment.steering.product.content\`, \`environment.steering.tech.content\`, \`environment.steering.structure.content\`
3. Compare design structure against the design template content
4. Validate technical soundness, architecture quality, and completeness
5. Check alignment with available steering documents (already loaded in context)
6. Verify proper leverage of existing code and integration points
7. Rate the overall quality as PASS, NEEDS_IMPROVEMENT, or MAJOR_ISSUES

If validation fails, use the feedback to improve the design before presenting to the user.

If agent not available (from environment check): Review manually against architectural best practices.
\`\`\`
- **Only present to user after validation passes or improvements are made**
- **Present the validated design document** with code reuse highlights and steering document alignment
- Ask: "Does the design look good? If so, we can move on to the implementation planning."
- **CRITICAL**: Wait for explicit approval before proceeding to Phase 3

## PHASE 3: Tasks Creation

**Template to Follow**: Use the exact structure from \`.claude/templates/tasks-template.md\`

### Task Planning Process
1. **Load Previous Phases**
   - Ensure design.md exists and is approved
   - Use loaded requirements.md and design.md from inspect-setup context

2. **Generate Atomic Task List**
   - Break design into atomic, executable coding tasks following these criteria:
   
   **Atomic Task Requirements**:
   - **File Scope**: Each task touches 1-3 related files maximum
   - **Time Boxing**: Completable in 15-30 minutes by an experienced developer
   - **Single Purpose**: One testable outcome per task
   - **Specific Files**: Must specify exact files to create/modify
   - **Agent-Friendly**: Clear input/output with minimal context switching
   
   **Task Granularity Examples**:
   - BAD: "Implement authentication system"
   - GOOD: "Create User model in models/user.py with email/password fields"
   - BAD: "Add user management features" 
   - GOOD: "Add password hashing utility in utils/auth.py using bcrypt"
   
   **Implementation Guidelines**:
   - **Follow structure.md**: Ensure tasks respect project file organization
   - **Prioritize extending/adapting existing code** over building from scratch
   - Use checkbox format with numbered hierarchy
   - Each task should reference specific requirements AND existing code to leverage
   - Focus ONLY on coding tasks (no deployment, user testing, etc.)
   - Break large concepts into file-level operations

### Task Template Usage
- **Read and follow**: \`.claude/templates/tasks-template.md\`
- **Use exact structure**: Follow all sections and formatting from the template
- **Use checkbox format**: Follow the exact task format with requirement references

### Task Validation and Approval
- **Automatic Validation (if agent available)**: FIRST use the \`spec-task-validator\` agent to validate the tasks:

\`\`\`
Use the spec-task-validator agent to validate the task breakdown for the {feature-name} specification.

The agent should:
1. Load context with template: Run \`npx @pimzino/claude-code-spec-workflow inspect-setup --spec {feature-name} --with-templates --json\`
2. Parse the JSON output to extract the required content:
   - Tasks document: \`current_spec.tasks.content.raw_content\`
   - Requirements document: \`current_spec.requirements.content\`
   - Design document: \`current_spec.design.content\`
   - Tasks template: \`templates.tasks.content\`
   - Steering documents: \`environment.steering.product.content\`, \`environment.steering.tech.content\`, \`environment.steering.structure.content\`
3. Compare tasks structure against the tasks template content
4. Validate each task against atomicity criteria (file scope, time boxing, single purpose)
5. Check for agent-friendly formatting and clear specifications
6. Verify requirement references and leverage information are accurate
7. Rate the overall quality as PASS, NEEDS_IMPROVEMENT, or MAJOR_ISSUES

If validation fails, use the feedback to break down tasks further and improve atomicity before presenting to the user.
\`\`\`

- **If validation agent not available**: Self-validate each task against atomic criteria first:
  - Does each task specify exact files to modify/create?
  - Can each task be completed in 15-30 minutes?
  - Does each task have a single, testable outcome?
  - Are any tasks still too broad (>100 characters description)?
- **If validation fails**: Break down broad tasks further before presenting
- **Only present to user after validation passes or improvements are made**

### Task Dependency Analysis
- **Automatic Analysis (if agent available)**: AFTER validation passes, use the \`spec-dependency-analyzer\` agent:

\`\`\`
Use the spec-dependency-analyzer agent to analyze task dependencies for the {feature-name} specification.

The agent should:
1. Load context: Run \`npx @pimzino/claude-code-spec-workflow inspect-setup --spec {feature-name}\`
2. Use the loaded tasks document from the context
3. Analyze explicit and implicit dependencies between tasks
4. Identify parallelization opportunities
5. Calculate the critical path
6. Suggest optimal execution order
7. Warn about any circular dependencies or issues

The analysis will help optimize task execution strategy.
\`\`\`

- **Present the validated task list with dependency analysis** (if available)
- Ask: "Do the tasks look good? Each task should be atomic and agent-friendly."
- **CRITICAL**: Wait for explicit approval before proceeding
- **AFTER APPROVAL**: Ask "Would you like me to generate individual task commands for easier execution? (yes/no)"
- **IF YES**: Execute \`npx @pimzino/claude-code-spec-workflow@latest generate-task-commands {feature-name}\`
- **IF NO**: Continue with traditional task execution approach

## Critical Workflow Rules

### Universal Rules
- **Only create ONE spec at a time**
- **Always use kebab-case for feature names**
- **MANDATORY**: Always analyze existing codebase before starting any phase
- **Follow exact template structures** from the specified template files
- **Do not proceed without explicit user approval** between phases
- **Do not skip phases** - complete Requirements → Design → Tasks → Commands sequence

### Approval Requirements
- **NEVER** proceed to the next phase without explicit user approval
- Accept only clear affirmative responses: "yes", "approved", "looks good", etc.
- If user provides feedback, make revisions and ask for approval again
- Continue revision cycle until explicit approval is received

### Template Usage
- **Requirements**: Must follow \`.claude/templates/requirements-template.md\` structure exactly
- **Design**: Must follow \`.claude/templates/design-template.md\` structure exactly  
- **Tasks**: Must follow \`.claude/templates/tasks-template.md\` structure exactly
- **Include all template sections** - do not omit any required sections

### Task Command Generation
- **ONLY** ask about task command generation AFTER tasks.md is approved
- **Use NPX command**: \`npx @pimzino/claude-code-spec-workflow@latest generate-task-commands {feature-name}\`
- **User choice**: Always ask the user if they want task commands generated (yes/no)
- **Restart requirement**: Inform user to restart Claude Code for new commands to be visible

## Error Handling

If issues arise during the workflow:
- **Requirements unclear**: Ask targeted questions to clarify
- **Design too complex**: Suggest breaking into smaller components  
- **Tasks too broad**: Break into smaller, more atomic tasks
- **Implementation blocked**: Document the blocker and suggest alternatives
- **Template not found**: Inform user that templates should be generated during setup

## Success Criteria

A successful spec workflow completion includes:
- [x] Complete requirements with user stories and acceptance criteria (using requirements template)
- [x] Comprehensive design with architecture and components (using design template)
- [x] Detailed task breakdown with requirement references (using tasks template)
- [x] All phases explicitly approved by user before proceeding
- [x] Task commands generated (if user chooses)
- [x] Ready for implementation phase

## Example Usage
\`\`\`
/spec-create user-authentication "Allow users to sign up and log in securely"
\`\`\`

## Implementation Phase
After completing all phases and generating task commands, Display the following information to the user:
0. **RESTART Claude Code** for new commands to be visible
1. **Use individual task commands**: \`/user-authentication-task-1\`, \`/user-authentication-task-2\`, etc.
2. **Or use spec-execute**: Execute tasks individually as needed
3. **Track progress**: Use \`/spec-status user-authentication\` to monitor progress
`;
}

export function getSpecExecuteCommand(): string {
  return `# Spec Execute Command

Execute specific tasks from the approved task list.

## Usage
\`\`\`
/spec-execute [task-id] [feature-name]
\`\`\`

## Phase Overview
**Your Role**: Execute tasks systematically with validation

This is Phase 4 of the spec workflow. Your goal is to implement individual tasks from the approved task list, one at a time.

## Instructions

1. **Load Context & Environment**
   Run: \`npx @pimzino/claude-code-spec-workflow inspect-setup --spec {feature-name} --task {task-id}\`
   
   This provides:
   - Complete environment information
   - Specific task details and context
   - Available agents and steering documents
   - Spec documents (requirements, design)

2. **Execute Based on Environment**

**Agent-Based Execution (if available)**: Use spec-task-executor agent if shown in environment check:

\`\`\`
Use the spec-task-executor agent to implement the specified task for the {feature-name} specification.

The agent should use the loaded context from inspect-setup and:
1. Implement ONLY the specified task
2. Follow all project conventions and leverage existing code  
3. Mark the task as complete in tasks.md
4. Provide a completion summary

Task to implement: {task-id}
\`\`\`

**Manual Execution (fallback)**: If agent not available according to environment check:

1. **Use Loaded Context**
   - All context is already loaded from inspect-setup command
   - Task details, requirements, design, and steering docs are available
   - Focus on implementing the specific task identified

2. **Implementation Process**
   1. Execute ONLY the specified task (never multiple tasks)
   2. Implement following existing code patterns and conventions
   3. Validate implementation against referenced requirements
   4. Run tests and checks if applicable
   5. **CRITICAL**: Mark task as complete by changing [ ] to [x] in tasks.md
   6. Confirm task completion status to user
   7. **CRITICAL**: Stop and wait for user review before proceeding

3. **Task Execution**
   - Focus on ONE task at a time
   - If task has sub-tasks, start with those
   - Follow the implementation details from design.md
   - Verify against requirements specified in the task

4. **Implementation Guidelines**
   - Write clean, maintainable code
   - **Follow steering documents**: Adhere to patterns in tech.md and conventions in structure.md
   - Follow existing code patterns and conventions
   - Include appropriate error handling
   - Add unit tests where specified
   - Document complex logic

5. **Validation**
   - Verify implementation meets acceptance criteria
   - Run tests if they exist
   - Check for lint/type errors
   - Ensure integration with existing code

6. **Task Completion Protocol**
When completing any task during \`/spec-execute\`:
   1. **Update tasks.md**: Change task status from \`- [ ]\` to \`- [x]\`
   2. **Confirm to user**: State clearly "Task X has been marked as complete"
   3. **Stop execution**: Do not proceed to next task automatically
   4. **Wait for instruction**: Let user decide next steps

7. **Test Generation (if agent available)**
During or after task implementation, use the \`spec-test-generator\` agent:

\`\`\`
Use the spec-test-generator agent to generate tests for task {task-id} of the {feature-name} specification.

The agent should:
1. Load context: Run \`npx @pimzino/claude-code-spec-workflow inspect-setup --spec {feature-name}\`
2. Use loaded requirements.md for acceptance criteria
3. Use loaded design.md for technical details
4. Analyze existing test patterns in the codebase
5. Generate comprehensive test cases
6. Provide test implementations following project conventions

The generated tests ensure comprehensive coverage of the implemented functionality.
\`\`\`

8. **Post-Implementation Review (if agent available)**
After marking a task complete, use the \`spec-task-implementation-reviewer\` agent:

\`\`\`
Use the spec-task-implementation-reviewer agent to review the implementation of task {task-id} for the {feature-name} specification.

The agent should:
1. Load all specification documents from .claude/specs/{feature-name}/
2. Load steering documents from .claude/steering/ (if available)
3. Review the implementation for correctness and compliance
4. Provide structured feedback on the implementation quality
5. Identify any issues that need to be addressed

Context files to review:
- .claude/specs/{feature-name}/requirements.md
- .claude/specs/{feature-name}/design.md
- .claude/specs/{feature-name}/tasks.md
- Implementation changes for task {task-id}
\`\`\`

9. **Integration Testing (if agent available)**
After implementation review passes, use the \`spec-integration-tester\` agent:

\`\`\`
Use the spec-integration-tester agent to test the implementation of task {task-id} for the {feature-name} specification.

The agent should:
1. Load all specification documents and understand the changes made
2. Run relevant test suites for the implemented functionality
3. Validate integration points and API contracts
4. Check for regressions using git history analysis
5. Provide comprehensive test feedback

Test context:
- Changes made in task {task-id}
- Related test suites to execute
- Integration points to validate
- Git history for regression analysis
\`\`\`

## Critical Workflow Rules

### Task Execution
- **ONLY** execute one task at a time during implementation
- **CRITICAL**: Mark completed tasks as [x] in tasks.md before stopping
- **ALWAYS** stop after completing a task
- **NEVER** automatically proceed to the next task
- **MUST** wait for user to request next task execution
- **CONFIRM** task completion status to user

### Requirement References
- **ALL** tasks must reference specific requirements using _Requirements: X.Y_ format
- **ENSURE** traceability from requirements through design to implementation
- **VALIDATE** implementations against referenced requirements

## Task Selection
If no task-id specified:
- Run: \`npx @pimzino/claude-code-spec-workflow inspect-setup --spec {feature-name} --next-task\`
- Use the recommended next task from the intelligent task analyzer
- This considers task dependencies and proper execution order
- Ask user to confirm before proceeding

If no feature-name specified:
- Check \`.claude/specs/\` directory for available specs
- If only one spec exists, use it
- If multiple specs exist, ask user which one to use
- Display error if no specs are found

## Examples
\`\`\`
/spec-execute 1 user-authentication
/spec-execute 2.1 user-authentication
\`\`\`

## Important Rules
- Only execute ONE task at a time
- **ALWAYS** mark completed tasks as [x] in tasks.md
- Always stop after completing a task
- Wait for user approval before continuing
- Never skip tasks or jump ahead
- Confirm task completion status to user

## Next Steps
After task completion, you can:
- Review the implementation (automated if spec-task-implementation-reviewer agent is available)
- Address any issues identified in the review
- Run tests if applicable
- Execute the next task using \`/spec-execute [next-task-id]\`
- Check overall progress with \`/spec-status {feature-name}\`
`;
}

export function getSpecStatusCommand(): string {
  return `# Spec Status Command

Show current status of all specs or a specific spec.

## Usage
\`\`\`
/spec-status [feature-name]
\`\`\`

## Instructions
Display the current status of spec workflows.

1. **If no feature-name provided:**
   - List all specs in \`.claude/specs/\` directory
   - Show current phase for each spec
   - Display completion status

2. **If feature-name provided:**
   - Show detailed status for that spec
   - Display current workflow phase
   - Show completed vs pending tasks
   - List next recommended actions

3. **Status Information:**
   - Requirements: [Complete/In Progress/Pending]
   - Design: [Complete/In Progress/Pending]
   - Tasks: [Complete/In Progress/Pending]
   - Implementation: [X/Y tasks complete]

4. **Output Format:**
   \`\`\`
   Spec: user-authentication
   Phase: Implementation
   Progress: Requirements ✅ | Design ✅ | Tasks ✅
   Implementation: 3/8 tasks complete
   Next: Execute task 4 - "Implement password validation"
   \`\`\`

## Workflow Phases
- **Requirements**: Gathering and documenting requirements
- **Design**: Creating technical design and architecture
- **Tasks**: Breaking down into implementation tasks
- **Implementation**: Executing individual tasks
- **Complete**: All tasks finished and integrated
`;
}

export function getSpecCompletionReviewCommand(): string {
  return `# Spec Completion Review Command

Perform comprehensive end-to-end review when all tasks in a spec are complete.

## Usage
\`\`\`
/spec-completion-review {feature-name}
\`\`\`

## Phase Overview
**Your Role**: Comprehensive feature validation and final approval

This command is used when all tasks in a specification are marked complete. Your goal is to ensure the entire feature is production-ready and meets all requirements before final approval.

## Instructions

**Agent-Based Review (Recommended)**: If the \`spec-completion-reviewer\` agent is available, use it for comprehensive validation:

\`\`\`
Use the spec-completion-reviewer agent to perform final review of the {feature-name} specification.

The agent should:
1. Load all specification documents from .claude/specs/{feature-name}/
2. Load steering documents from .claude/steering/ (if available)
3. Perform comprehensive end-to-end validation
4. Analyze git history for the entire feature implementation
5. Validate requirements fulfillment and design compliance
6. Assess production readiness and provide final approval

Context files for review:
- .claude/specs/{feature-name}/requirements.md
- .claude/specs/{feature-name}/design.md
- .claude/specs/{feature-name}/tasks.md
- All git commits related to the feature
- Steering documents for context
\`\`\`

**Manual Review (Fallback)**: If the agent is not available, follow this process:

1. **Load Complete Context**
   - Read all specification documents from \`.claude/specs/{feature-name}/\`
   - Review all completed tasks in tasks.md
   - Load steering documents for project context

2. **Requirements Validation**
   - Verify ALL user stories are fully implemented
   - Check every acceptance criterion is satisfied
   - Confirm edge cases and error scenarios are handled

3. **Design Implementation Verification**
   - Ensure implementation follows specified architecture
   - Validate all designed components work together
   - Check API contracts match specifications

4. **Code Quality Assessment**
   - Review overall code quality and consistency
   - Verify proper error handling throughout
   - Check performance and security considerations

5. **Integration Validation**
   - Test complete feature workflows end-to-end
   - Verify integration with existing systems
   - Ensure no breaking changes introduced

6. **Git History Review**
   - Analyze all commits for the feature
   - Verify clean commit history
   - Check for proper commit messages

## Approval Criteria
- All requirements fully satisfied
- Design properly implemented
- Code quality meets standards
- Integration working correctly
- Tests passing and adequate coverage
- Documentation complete
- Ready for production deployment

## Final Outcomes
- **APPROVED**: Feature ready for production
- **NEEDS_FIXES**: Minor issues to address
- **MAJOR_ISSUES**: Significant problems requiring rework

## Next Steps
After completion review:
- Address any identified issues
- Prepare for production deployment
- Update documentation if needed
- Consider creating PR/merge request

## Post-Completion Analysis (if agents available)

After approval, consider running these additional agents:

### Documentation Generation
Use the \`spec-documentation-generator\` agent:

\`\`\`
Use the spec-documentation-generator agent to generate documentation for the completed {feature-name} specification.

The agent should:
1. Analyze implemented code and APIs
2. Generate API documentation with examples
3. Create user guides and feature documentation
4. Generate changelog entries from git history
5. Suggest README updates for the new feature

This ensures comprehensive documentation for the completed feature.
\`\`\`

### Performance Analysis
Use the \`spec-performance-analyzer\` agent:

\`\`\`
Use the spec-performance-analyzer agent to analyze performance implications of the {feature-name} implementation.

The agent should:
1. Analyze algorithmic complexity
2. Identify potential bottlenecks
3. Suggest optimization opportunities
4. Check for common performance anti-patterns
5. Recommend performance testing strategies

This helps ensure the feature performs well at scale.
\`\`\`

### Breaking Change Detection
Use the \`spec-breaking-change-detector\` agent:

\`\`\`
Use the spec-breaking-change-detector agent to detect any breaking changes in the {feature-name} implementation.

The agent should:
1. Analyze API changes and modifications
2. Detect behavioral changes
3. Assess impact on consumers
4. Suggest compatibility strategies
5. Recommend migration paths if needed

This ensures backward compatibility is maintained.
\`\`\`

### Steering Document Updates
Use the \`steering-document-updater\` agent:

\`\`\`
Use the steering-document-updater agent to analyze if steering documents need updates based on the {feature-name} implementation.

The agent should:
1. Analyze new patterns introduced
2. Check for technology stack changes
3. Identify new conventions established
4. Suggest updates to product.md, tech.md, or structure.md
5. Highlight deprecated patterns to document

This keeps project documentation aligned with implementation reality.
\`\`\`
`;
}

export function getSpecListCommand(): string {
  return `# Spec List Command

List all specs in the current project.

## Usage
\`\`\`
/spec-list
\`\`\`

## Instructions
Display a comprehensive list of all specs in the project.

1. **Scan Directory**
   - Look in \`.claude/specs/\` directory
   - Find all spec directories
   - Check for required files (requirements.md, design.md, tasks.md)

2. **Display Information**
   - Feature name
   - Current phase
   - Completion status
   - Last modified date
   - Brief description from requirements

3. **Output Format**
   \`\`\`
   📋 Project Specs Overview

   1. user-authentication (Complete)
      Phase: Implementation (7/8 tasks)
      Last updated: 2025-01-15

   2. data-export (In Progress)
      Phase: Design
      Last updated: 2025-01-14

   3. notification-system (Planning)
      Phase: Requirements
      Last updated: 2025-01-13
   \`\`\`

4. **Additional Actions**
   - Show total spec count
   - Highlight specs needing attention
   - Suggest next actions for each spec
`;
}

export function getSpecSteeringSetupCommand(): string {
  return `# Spec Steering Setup Command

Create or update steering documents that provide persistent project context.

## Usage
\`\`\`
/spec-steering-setup
\`\`\`

## Instructions
You are helping set up steering documents that will guide all future spec development. These documents provide persistent context about the product vision, technology stack, and project structure.

## Process

1. **Check for Existing Steering Documents**
   - Look for \`.claude/steering/\` directory
   - Check for existing product.md, tech.md, structure.md files
   - If they exist, load and display current content

2. **Analyze the Project**
   - Review the codebase to understand:
     - Project type and purpose
     - Technology stack in use
     - Directory structure and patterns
     - Coding conventions
     - Existing features and functionality
   - Look for:
     - package.json, requirements.txt, go.mod, etc.
     - README files
     - Configuration files
     - Source code structure

3. **Present Inferred Details**
   - Show the user what you've learned about:
     - **Product**: Purpose, features, target users
     - **Technology**: Frameworks, libraries, tools
     - **Structure**: File organization, naming conventions
   - Format as:
     \`\`\`
     Based on my analysis, here's what I've inferred:
     
     **Product Details:**
     - [Inferred detail 1]
     - [Inferred detail 2]
     
     **Technology Stack:**
     - [Inferred tech 1]
     - [Inferred tech 2]
     
     **Project Structure:**
     - [Inferred pattern 1]
     - [Inferred pattern 2]
     \`\`\`
   - Ask: "Do these inferred details look correct? Please let me know which ones to keep or discard."

4. **Gather Missing Information**
   - Based on user feedback, identify gaps
   - Ask targeted questions to fill in missing details:
     
     **Product Questions:**
     - What is the main problem this product solves?
     - Who are the primary users?
     - What are the key business objectives?
     - What metrics define success?
     
     **Technology Questions:**
     - Are there any technical constraints or requirements?
     - What third-party services are integrated?
     - What are the performance requirements?
     
     **Structure Questions:**
     - Are there specific coding standards to follow?
     - How should new features be organized?
     - What are the testing requirements?

5. **Generate Steering Documents**
   - Create \`.claude/steering/\` directory if it doesn't exist
   - Generate three files based on templates and gathered information:
     
     **product.md**: Product vision, users, features, objectives
     **tech.md**: Technology stack, tools, constraints, decisions
     **structure.md**: File organization, naming conventions, patterns

6. **Review and Confirm**
   - Present the generated documents to the user
   - Ask for final approval before saving
   - Make any requested adjustments

## Important Notes

- **Steering documents are persistent** - they will be referenced in all future spec commands
- **Keep documents focused** - each should cover its specific domain
- **Update regularly** - steering docs should evolve with the project
- **Never include sensitive data** - no passwords, API keys, or credentials

## Example Flow

1. Analyze project and find it's a React/TypeScript app
2. Present inferred details about the e-commerce platform
3. User confirms most details but clarifies target market
4. Ask about performance requirements and third-party services
5. Generate steering documents with all gathered information
6. User reviews and approves the documents
7. Save to \`.claude/steering/\` directory

## Next Steps
After steering documents are created, they will automatically be referenced during:
- \`/spec-create\` - Align requirements with product vision
- \`/spec-design\` - Follow established tech patterns
- \`/spec-tasks\` - Use correct file organization
- \`/spec-execute\` - Implement following all conventions
`;
}

export function getBugCreateCommand(): string {
  return `# Bug Create Command

Initialize a new bug fix workflow for tracking and resolving bugs.

## Usage
\`\`\`
/bug-create <bug-name> [description]
\`\`\`

## Workflow Overview

This is the **streamlined bug fix workflow** - a lighter alternative to the full spec workflow for addressing bugs and issues.

### Bug Fix Phases
1. **Report Phase** (This command) - Document the bug
2. **Analysis Phase** (\`/bug-analyze\`) - Investigate root cause
3. **Fix Phase** (\`/bug-fix\`) - Implement solution
4. **Verification Phase** (\`/bug-verify\`) - Confirm resolution

## Instructions

You are helping create a new bug fix workflow. This is designed for smaller fixes that don't need the full spec workflow overhead.

1. **Create Directory Structure**
   - Create \`.claude/bugs/{bug-name}/\` directory
   - Initialize report.md, analysis.md, and verification.md files

2. **Load Context** (if available)
   - Check for .claude/steering/tech.md for technical context
   - Check for .claude/steering/structure.md for project patterns
   - Load available steering documents to understand project context

3. **Gather Bug Information**
   - Take the bug name and optional description
   - Guide user through bug report creation
   - Use structured format for consistency

4. **Generate Bug Report**
   - **Template to Follow**: Use the exact structure from \`.claude/templates/bug-report-template.md\`
   - **Read and follow**: Load the template and follow all sections precisely
   - Create detailed bug description following the template structure

## Template Usage
- **Follow exact structure**: Use \`.claude/templates/bug-report-template.md\` precisely
- **Include all sections**: Don't omit any required template sections
- **Structured format**: Follow the template's format for consistency

5. **Request User Input**
   - Ask for bug details if not provided in description
   - Guide through each section of the bug report
   - Ensure all required information is captured

6. **Save and Proceed**
   - Save the completed bug report to report.md
   - Ask: "Is this bug report accurate? If so, we can move on to the analysis."
   - Wait for explicit approval before proceeding

## Key Differences from Spec Workflow

- **Faster**: No requirements/design phases
- **Targeted**: Focus on fixing existing functionality
- **Streamlined**: 4 phases instead of detailed workflow
- **Practical**: Direct from problem to solution

## Rules

- Only create ONE bug fix at a time
- Always use kebab-case for bug names
- Must analyze existing codebase during investigation
- Follow existing project patterns and conventions
- Do not proceed without user approval between phases

## Error Handling

If issues arise during the workflow:
- **Bug unclear**: Ask targeted questions to clarify
- **Too complex**: Suggest breaking into smaller bugs or using spec workflow
- **Reproduction blocked**: Document blockers and suggest alternatives

## Example
\`\`\`
/bug-create login-timeout "Users getting logged out too quickly"
\`\`\`

## Next Steps
After bug report approval, proceed to \`/bug-analyze\` phase.
`;
}

export function getBugAnalyzeCommand(): string {
  return `# Bug Analyze Command

Investigate and analyze the root cause of a reported bug.

## Usage
\`\`\`
/bug-analyze [bug-name]
\`\`\`

## Phase Overview
**Your Role**: Investigate the bug and identify the root cause

This is Phase 2 of the bug fix workflow. Your goal is to understand why the bug is happening and plan the fix approach.

## Instructions

**Agent-Based Analysis (Recommended)**: If the \`bug-root-cause-analyzer\` agent is available, use it for comprehensive root cause analysis:

\`\`\`
Use the bug-root-cause-analyzer agent to perform enhanced root cause analysis for the {bug-name} bug.

The agent should:
1. Load context: Run \`npx @pimzino/claude-code-spec-workflow inspect-setup --bug {bug-name}\`
2. Use loaded bug report and steering documents from the context
3. Perform git archaeology to find when the bug was introduced
4. Analyze git history for similar issues and patterns
5. Investigate code context and evolution
6. Assess impact and relationships
7. Develop prevention strategies
8. Provide comprehensive analysis with fix recommendations

Context for analysis:
- Bug report with symptoms and reproduction steps
- Git history for pattern recognition
- Related code and its evolution
- Similar historical issues and fixes
\`\`\`

**Manual Analysis (Fallback)**: If the agent is not available, follow this process:

1. **Prerequisites**
   - Ensure report.md exists and is complete
   - Use loaded bug report from inspect-setup context
   - **Use loaded steering documents from context**: 
     - Use loaded tech.md for technical patterns
     - Use loaded structure.md for project organization
   - Understand the reported issue completely

2. **Investigation Process**
   1. **Code Investigation**
      - Search codebase for relevant functionality
      - Identify files, functions, and components involved
      - Map data flow and identify potential failure points
      - Look for similar issues or patterns

   2. **Root Cause Analysis**
      - Determine the underlying cause of the bug
      - Identify contributing factors
      - Understand why existing tests didn't catch this
      - Assess impact and risks

   3. **Solution Planning**
      - Design fix strategy
      - Consider alternative approaches
      - Plan testing approach
      - Identify potential risks

3. **Create Analysis Document**
   - **Template to Follow**: Use the exact structure from \`.claude/templates/bug-analysis-template.md\`
   - **Read and follow**: Load the template and follow all sections precisely
   - Document investigation findings following the template structure

## Template Usage
- **Follow exact structure**: Use \`.claude/templates/bug-analysis-template.md\` precisely
- **Include all sections**: Don't omit any required template sections
- **Detailed analysis**: Follow the template's format for comprehensive investigation

4. **Investigation Guidelines**
   - **Follow tech.md standards**: Understand existing patterns before proposing changes
   - **Respect structure.md**: Know where fixes should be placed
   - **Search thoroughly**: Look for existing utilities, similar bugs, related code
   - **Think systematically**: Consider data flow, error handling, edge cases
   - **Plan for testing**: How will you verify the fix works

5. **Approval Process**
   - Present the complete analysis document
   - **Show code reuse opportunities**: Note existing utilities that can help
   - **Highlight integration points**: Show how fix fits with existing architecture
   - Ask: "Does this analysis look correct? If so, we can proceed to implement the fix."
   - Incorporate feedback and revisions
   - Continue until explicit approval
   - **CRITICAL**: Do not proceed without explicit approval

## Analysis Guidelines

### Code Investigation
- Use search tools to find relevant code
- Understand existing error handling patterns
- Look for similar functionality that works correctly
- Check for recent changes that might have caused the issue

### Root Cause Identification
- Don't just fix symptoms - find the real cause
- Consider edge cases and error conditions
- Look for design issues vs implementation bugs
- Understand the intended behavior vs actual behavior

### Solution Design
- Prefer minimal, targeted fixes
- Reuse existing patterns and utilities
- Consider backwards compatibility
- Plan for future prevention of similar bugs

## Critical Rules
- **NEVER** proceed to the next phase without explicit user approval
- Accept only clear affirmative responses: "yes", "approved", "looks good", etc.
- If user provides feedback, make revisions and ask for approval again
- Continue revision cycle until explicit approval is received

## Next Phase
After approval, proceed to \`/bug-fix\`.
`;
}

export function getBugFixCommand(): string {
  return `# Bug Fix Command

Implement the fix for the analyzed bug.

## Usage
\`\`\`
/bug-fix [bug-name]
\`\`\`

## Phase Overview
**Your Role**: Implement the solution based on the approved analysis

This is Phase 3 of the bug fix workflow. Your goal is to implement the fix while following project conventions.

## Instructions

You are working on the fix implementation phase of the bug fix workflow.

1. **Prerequisites**
   - Ensure analysis.md exists and is approved
   - Use loaded report.md and analysis.md from inspect-setup context
   - **Use loaded steering documents from context**: 
     - Use loaded tech.md for technical patterns
     - Use loaded structure.md for project conventions
   - Understand the planned fix approach completely

2. **Implementation Process**
   1. **Follow the Implementation Plan**
      - Execute changes exactly as outlined in analysis.md
      - Make targeted, minimal changes
      - Follow existing code patterns and conventions

   2. **Code Changes**
      - Implement the fix following project standards
      - Add appropriate error handling
      - Include logging or debugging aids if needed
      - Update or add tests as specified

   3. **Quality Checks**
      - Verify fix addresses the root cause
      - Ensure no unintended side effects
      - Follow code style and conventions
      - Run tests and checks

3. **Implementation Guidelines**
   - **Follow steering documents**: Adhere to patterns in tech.md and conventions in structure.md
   - **Make minimal changes**: Fix only what's necessary
   - **Preserve existing behavior**: Don't break unrelated functionality
   - **Use existing patterns**: Leverage established code patterns and utilities
   - **Add appropriate tests**: Ensure the bug won't return

4. **Testing Requirements**
   - Test the specific bug scenario
   - Verify related functionality still works
   - Run existing test suite if available
   - Add regression tests for this bug

5. **Documentation Updates**
   - Update code comments if needed
   - Document any non-obvious changes
   - Update error messages if applicable

## Implementation Rules

### Code Quality
- Follow project coding standards
- Use existing utilities and patterns
- Add proper error handling
- Include meaningful comments for complex logic

### Testing Strategy
- Test the original bug reproduction steps
- Verify fix doesn't break related functionality
- Add tests to prevent regression
- Run full test suite if available

### Change Management
- Make atomic, focused changes
- Document the fix approach
- Preserve existing API contracts
- Consider backwards compatibility

## Completion Process

1. **Implement the Fix**
   - Make the necessary code changes
   - Follow the implementation plan from analysis.md
   - Ensure code follows project conventions

2. **Verify Implementation**
   - Test that the original bug is resolved
   - Verify no new issues introduced
   - Run relevant tests and checks

3. **Update Documentation**
   - Document the changes made
   - Update any relevant comments or docs

4. **Confirm Completion**
   - Present summary of changes made
   - Show test results confirming fix
   - Ask: "The fix has been implemented. Should we proceed to verification?"
   - **CRITICAL**: Wait for user approval before proceeding

## Critical Rules
- **ONLY** implement the fix outlined in the approved analysis
- **ALWAYS** test the fix thoroughly
- **NEVER** make changes beyond the planned fix scope
- **MUST** wait for user approval before proceeding to verification

## Next Phase
After approval, proceed to \`/bug-verify\`.
`;
}

export function getBugVerifyCommand(): string {
  return `# Bug Verify Command

Verify that the bug fix works correctly and doesn't introduce regressions.

## Usage
\`\`\`
/bug-verify [bug-name]
\`\`\`

## Phase Overview
**Your Role**: Thoroughly verify the fix works and document the results

This is Phase 4 (final) of the bug fix workflow. Your goal is to confirm the bug is resolved and the fix is safe.

## Instructions

You are working on the verification phase of the bug fix workflow.

1. **Prerequisites**
   - Ensure the fix has been implemented
   - Use loaded report.md, analysis.md from inspect-setup context
   - Understand what was changed and why
   - Have the verification plan from analysis.md

2. **Verification Process**
   1. **Original Bug Testing**
      - Reproduce the original steps from report.md
      - Verify the bug no longer occurs
      - Test edge cases mentioned in the analysis

   2. **Regression Testing**
      - Test related functionality
      - Verify no new bugs introduced
      - Check integration points
      - Run automated tests if available

   3. **Code Quality Verification**
      - Review code changes for quality
      - Verify adherence to project standards
      - Check error handling is appropriate
      - Ensure tests are adequate

3. **Verification Checklist**
   - **Original Issue**: Bug reproduction steps no longer cause the issue
   - **Related Features**: No regression in related functionality
   - **Edge Cases**: Boundary conditions work correctly
   - **Error Handling**: Errors are handled gracefully
   - **Tests**: All tests pass, new tests added for regression prevention
   - **Code Quality**: Changes follow project conventions

4. **Create Verification Document**
   - **Template to Follow**: Use the exact structure from \`.claude/templates/bug-verification-template.md\`
   - **Read and follow**: Load the template and follow all sections precisely
   - Document all test results following the template structure

## Template Usage
- **Follow exact structure**: Use \`.claude/templates/bug-verification-template.md\` precisely
- **Include all sections**: Don't omit any required template sections
- **Complete checklist**: Follow the template's checklist format for thoroughness

5. **Final Approval**
   - Present complete verification results
   - Show that all checks pass
   - Ask: "The bug fix has been verified successfully. Is this bug resolved?"
   - Get final confirmation before closing

## Verification Guidelines

### Testing Approach
- Test the exact scenario from the bug report
- Verify fix works in different environments
- Check that related features still work
- Test error conditions and edge cases

### Quality Verification
- Code follows project standards
- Appropriate error handling added
- No security implications
- Performance not negatively impacted

### Documentation Check
- Code comments updated if needed
- Any relevant docs reflect changes
- Bug fix documented appropriately

## Completion Criteria

The bug fix is complete when:
- ✅ Original bug no longer occurs
- ✅ No regressions introduced
- ✅ All tests pass
- ✅ Code follows project standards
- ✅ Documentation is up to date
- ✅ User confirms resolution

## Critical Rules
- **THOROUGHLY** test the original bug scenario
- **VERIFY** no regressions in related functionality
- **DOCUMENT** all verification results
- **GET** final user approval before considering bug resolved

## Success Criteria
A successful bug fix includes:
- ✅ Root cause identified and addressed
- ✅ Minimal, targeted fix implemented
- ✅ Comprehensive verification completed
- ✅ No regressions introduced
- ✅ Appropriate tests added
- ✅ User confirms issue resolved
`;
}

export function getBugStatusCommand(): string {
  return `# Bug Status Command

Show current status of all bug fixes or a specific bug fix.

## Usage
\`\`\`
/bug-status [bug-name]
\`\`\`

## Instructions
Display the current status of bug fix workflows.

1. **If no bug-name provided:**
   - List all bugs in \`.claude/bugs/\` directory
   - Show current phase for each bug
   - Display completion status

2. **If bug-name provided:**
   - Show detailed status for that bug
   - Display current workflow phase
   - Show completed vs pending phases
   - List next recommended actions

3. **Status Information:**
   - Report: [Complete/In Progress/Pending]
   - Analysis: [Complete/In Progress/Pending]
   - Fix: [Complete/In Progress/Pending]
   - Verification: [Complete/In Progress/Pending]

4. **Output Format:**
   \`\`\`
   Bug: login-timeout
   Phase: Fix Implementation
   Progress: Report ✅ | Analysis ✅ | Fix 🔄 | Verification ⏳
   Status: Implementing fix for session timeout issue
   Next: Complete implementation and verify fix works
   \`\`\`

## Bug Fix Phases
- **Report**: Bug description and impact assessment
- **Analysis**: Root cause investigation and solution planning
- **Fix**: Implementation of the planned solution
- **Verification**: Testing and confirmation of resolution
- **Complete**: Bug fully resolved and verified
`;
}

export function getSpecOrchestrateCommand(): string {
  return `# Spec Orchestrate Command

Resume or start automated execution of all tasks in a specification.

## Usage
\\\`\\\`\\\`
/spec-orchestrate {spec-name}
\\\`\\\`\\\`

## Resumable Orchestration
This command is **fully resumable** - it automatically detects completed tasks from tasks.md and continues from where you left off. Perfect for handling Claude Code session limits.

## Your Role
You are a **stateless orchestration coordinator**. You delegate all work to specialized agents and coordinate execution. You determine current state by reading tasks.md completion status.

## Instructions

### 1. Load Context & Analyze State
**Run Environment Check**: \`npx @pimzino/claude-code-spec-workflow inspect-setup --spec {spec-name} --next-task\`

This provides:
- Intelligent next task recommendation based on dependencies
- Task completion status and execution readiness
- Available agents and steering documents  
- Complete spec context for execution

### 2. Show Current Status
Display brief status and plan based on environment check results:
\\\`\\\`\\\`
📋 {spec-name} Status: {completed}/{total} tasks complete

If execution_ready is true:
🎯 Ready to Execute: Task {recommended-task-id} - {description}
▶️ Continue orchestration? [y/N]

If execution_ready is false:
⚠️ No tasks ready for execution
Reason: {blocked_reason}
\\\`\\\`\\\`

### 3. Execute Tasks Continuously
Execute tasks using intelligent next task detection:

**Continuous Execution Loop:**

**Step 1 - Get Next Task:**
Run: \`npx @pimzino/claude-code-spec-workflow inspect-setup --spec {spec-name} --next-task --json\`
Parse the recommended_next_task from the JSON response.

**Step 2 - Announce:**
\\\`🔄 Task {recommended-task-id}: {description}\\\`

**Step 3 - Delegate to Agent:**
Use spec-task-executor agent (primary method):
\\\`\\\`\\\`
Use the spec-task-executor agent to implement task {recommended-task-id} for {spec-name}.

Context: Use context from the inspect-setup command
Task: {recommended-task-id} - {description}
Requirements: {requirements-ref}
Leverage: {leverage-info}

Mark complete in tasks.md when done.
\\\`\\\`\\\`

**Step 4 - Fallback (if agent unavailable):**
\\\`/{spec-name}-task-{recommended-task-id}\\\`

**Step 5 - Report completion:**
\\\`✅ Task {recommended-task-id} complete\\\`

**Step 6 - Continue automatically:**
**CRITICAL**: Re-run inspect-setup --next-task to get the next ready task. Immediately proceed without waiting for user input. Only pause for errors or when execution_ready becomes false.

### 4. Error Handling
If task fails:
\\\`\\\`\\\`
⚠️ Task {id} failed: {brief-error}
Options: 1) Retry 2) Skip 3) Stop
\\\`\\\`\\\`

Use spec-error-resolver agent for complex issues.

### 5. Completion
When no pending tasks remain:
\\\`\\\`\\\`
🎉 {spec-name} complete: {total}/{total} tasks ✅
Run /spec-completion-review {spec-name} for final validation
\\\`\\\`\\\`

## Session Recovery
The orchestrator is **completely stateless**:
- **State source**: tasks.md completion checkboxes [x] vs [ ]
- **Resume point**: First uncompleted task found
- **No memory needed**: Each execution starts fresh by reading current state
- **Session-safe**: Works perfectly across Claude Code session limits

Example recovery scenario:
1. Session 1: Complete tasks 1-3, session limit hit
2. Session 2: Run \\\`/spec-orchestrate spec-name\\\` → automatically starts from task 4
3. Session 3: Run same command → continues from wherever tasks.md shows [ ]

## Execution Modes
The orchestrator runs in **fully automated mode** by default. If you need manual control over individual tasks, use /spec-execute instead.

## Key Rules
- **Read tasks.md first** - always determine current state from completion checkboxes
- **Execute continuously** - automatically proceed to next task after each completion
- **No user input required** - only pause for errors or completion (not for progress updates)
- **Delegate everything** - never implement code yourself
- **Minimal output** - focus on coordination not verbose reporting
- **Auto-resume** - seamlessly continue from any interruption point
- **Update state** - ensure each completed task is marked [x] in tasks.md

## Agent Dependencies
1. **spec-task-executor** (primary) - implements individual tasks
2. **spec-error-resolver** (fallback) - handles failures  
3. **Individual task commands** (fallback) - when agents unavailable

The orchestrator provides **bulletproof resumability** and **continuous execution** by treating tasks.md as the single source of truth for execution state.

## Execution Flow
The orchestrator runs in a continuous loop:
1. Load and parse current state from tasks.md
2. Find next pending task
3. Execute task via agent delegation
4. Report completion briefly
5. **Immediately continue** to next task (no user input needed)
6. Only pause for errors or when all tasks complete
`;
}