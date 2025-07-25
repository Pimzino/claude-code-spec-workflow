import { getPackageMetadata } from './utils';

export function getSpecCreateCommand(): string {
  return `# Spec Create Command

Create a new feature specification following the spec-driven workflow.

## Usage
\`\`\`
/spec-create <feature-name> [description]
\`\`\`

## Instructions
You are helping create a new feature specification. Follow these steps:

**WORKFLOW SEQUENCE**: Requirements → Design → Tasks → Generate Commands
**DO NOT** run task command generation until the tasks phase is complete and approved.

1. **Create Directory Structure**
   - Create \`.claude/specs/{feature-name}/\` directory
   - Initialize empty requirements.md, design.md, and tasks.md files

2. **Check for Steering Documents**
   - Look for .claude/product.md (product vision and goals)
   - Look for .claude/tech.md (technical standards and patterns)
   - Look for .claude/structure.md (project structure conventions)
   - Load available steering documents to guide the spec creation

3. **Parse Feature Description**
   - Take the feature name and optional description
   - Begin the requirements gathering phase immediately
   - Do not ask sequential questions - generate initial requirements

4. **Analyze Existing Codebase** (BEFORE writing requirements)
   - **Search for similar features**: Look for existing authentication, data handling, UI patterns, etc.
   - **Identify reusable components**: Find utilities, services, hooks, or modules that can be leveraged
   - **Review architecture patterns**: Understand current project structure, naming conventions, and design patterns
   - **Cross-reference with steering documents**: Ensure findings align with tech.md patterns and structure.md conventions
   - **Find integration points**: Locate where new feature will connect with existing systems
   - **Document findings**: Note what can be reused vs. what needs to be built from scratch

5. **Generate Initial Requirements**
   - Use the requirements template from \`.claude/templates/requirements-template.md\`
   - **Align with product.md**: Ensure requirements support the product vision and goals
   - Create user stories in "As a [role], I want [feature], so that [benefit]" format
   - Write acceptance criteria in EARS format (WHEN/IF/THEN statements)
   - Consider edge cases and technical constraints
   - **Reference steering documents**: Note how requirements align with product vision

6. **Request User Approval**
   - Present the requirements document
   - **Include codebase analysis summary**: Briefly note what existing code can be leveraged
   - Ask: "Do the requirements look good? If so, we can move on to the design."
   - Wait for explicit approval before proceeding

7. **Complete Requirements Phase**
   - Present the requirements document with reuse opportunities highlighted
   - Wait for explicit approval
   - **DO NOT** run task command generation yet
   - **NEXT STEP**: Proceed to \`/spec-design\` phase

8. **Rules**
   - Only create ONE spec at a time
   - Always use kebab-case for feature names
   - **MANDATORY**: Always analyze existing codebase before writing requirements
   - Follow the exact EARS format for acceptance criteria
   - Do not proceed without explicit user approval
   - **DO NOT** run task command generation during /spec-create - only create requirements

## Example
\`\`\`
/spec-create user-authentication "Allow users to sign up and log in securely"
\`\`\`

## Next Steps
After user approval, proceed to \`/spec-design\` phase.
`;
}

export function getSpecRequirementsCommand(): string {
  return `# Spec Requirements Command

Generate or update requirements document for an existing spec.

## Usage
\`\`\`
/spec-requirements [feature-name]
\`\`\`

## Instructions
You are working on the requirements phase of the spec workflow.

1. **Identify Current Spec**
   - If no feature-name provided, look for specs in \`.claude/specs/\` directory
   - If multiple specs exist, ask user to specify which one
   - Load existing requirements.md if it exists

2. **Generate Requirements Document**
   - **Load steering documents**: Check for and load product.md for product vision alignment
   - Use EARS format (Easy Approach to Requirements Syntax)
   - Structure: Introduction, Requirements with User Stories and Acceptance Criteria
   - Each requirement should have:
     - User story: "As a [role], I want [feature], so that [benefit]"
     - Numbered acceptance criteria: "WHEN [event] THEN [system] SHALL [response]"
   - **Ensure alignment**: Verify requirements support goals outlined in product.md

3. **Content Guidelines**
   - Consider edge cases and error handling
   - Include non-functional requirements (performance, security, etc.)
   - Reference existing codebase patterns where relevant
   - **Align with product vision**: Ensure all requirements support product.md goals
   - Ensure requirements are testable and verifiable

4. **Approval Process**
   - Present the complete requirements document
   - Ask: "Do the requirements look good? If so, we can move on to the design."
   - Make revisions based on feedback
   - Continue until explicit approval is received

## Requirements Format
\`\`\`markdown
# Requirements Document

## Introduction
[Brief summary of the feature]

## Requirements

### Requirement 1
**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
1. WHEN [event] THEN [system] SHALL [response]
2. IF [condition] THEN [system] SHALL [response]
\`\`\`

## Next Phase
After approval, proceed to \`/spec-design\`.
`;
}

export function getSpecDesignCommand(): string {
  return `# Spec Design Command

Generate design document based on approved requirements.

## Usage
\`\`\`
/spec-design [feature-name]
\`\`\`

## Instructions
You are working on the design phase of the spec workflow.

1. **Prerequisites**
   - Ensure requirements.md exists and is approved
   - Load the requirements document for context
   - **Load steering documents**: Check for and load tech.md and structure.md
   - Research existing codebase patterns and architecture

2. **Generate Design Document**
   - Create comprehensive design following the template
   - Include all required sections:
     - Overview
     - Architecture
     - Components and Interfaces
     - Data Models
     - Error Handling
     - Testing Strategy

3. **Codebase Research Phase** (MANDATORY)
   - **Map existing patterns**: Identify data models, API patterns, component structures that match your needs
   - **Cross-reference with tech.md**: Ensure patterns align with documented technical standards
   - **Catalog reusable utilities**: Find validation functions, helpers, middleware, hooks that can be leveraged
   - **Document architectural decisions**: Note existing tech stack, state management, routing patterns to follow
   - **Verify against structure.md**: Ensure file organization follows project conventions
   - **Identify integration points**: Map how new feature connects to existing auth, database, APIs
   - **Find similar implementations**: Look for features with similar requirements already implemented
   - **Note gaps**: Document what needs to be built vs. what can be reused or extended

4. **Design Content** (leverage codebase research and steering documents)
   - **Reuse Architecture**: Build on existing patterns rather than creating new ones
   - **Follow tech.md standards**: Ensure design adheres to documented technical guidelines
   - **Respect structure.md conventions**: Organize components according to project structure
   - **Extend Components**: Design to leverage and extend existing utilities, services, components
   - Use Mermaid diagrams for visual representations
   - Define clear interfaces that integrate with existing systems
   - Specify data models that follow established patterns
   - Plan error handling consistent with current approach
   - Outline testing approach using existing test utilities

5. **Approval Process**
   - Present the complete design document
   - **Highlight code reuse**: Clearly show what existing code will be leveraged
   - **Show steering document alignment**: Note how design follows tech.md and structure.md
   - Ask: "Does the design look good? If so, we can move on to the implementation plan."
   - Incorporate feedback and revisions
   - Continue until explicit approval

## Design Structure
\`\`\`markdown
# Design Document

## Overview
[High-level description]

## Code Reuse Analysis
[What existing code will be leveraged, extended, or integrated]

## Architecture
[System architecture building on existing patterns]

## Components and Interfaces
[Detailed component specifications with reuse opportunities]

## Data Models
[Data structures following established patterns]

## Error Handling
[Error scenarios consistent with current approach]

## Testing Strategy
[Testing approach using existing utilities and patterns]
\`\`\`

## Next Phase
After approval, proceed to \`/spec-tasks\`.
`;
}

export function getSpecTasksCommand(): string {
  const packageMeta = getPackageMetadata();
  return `# Spec Tasks Command

Generate implementation task list based on approved design.

## Usage
\`\`\`
/spec-tasks [feature-name]
\`\`\`

## Instructions
You are working on the tasks phase of the spec workflow.

**WORKFLOW**: This is the FINAL step before command generation.
**SEQUENCE**: Create Tasks → Get Approval → Ask User → Generate Commands
**DO NOT** run task command generation until tasks are approved.

1. **Prerequisites**
   - Ensure design.md exists and is approved
   - Load both requirements.md and design.md for context
   - **Load structure.md**: Check for project structure conventions
   - Understand the complete feature scope

2. **Generate Task List** (prioritize code reuse and follow conventions)
   - Break design into atomic, executable coding tasks
   - **Follow structure.md**: Ensure tasks respect project file organization
   - **Prioritize extending/adapting existing code** over building from scratch
   - Use checkbox format with numbered hierarchy
   - Each task should reference specific requirements AND existing code to leverage
   - Focus ONLY on coding tasks (no deployment, user testing, etc.)

3. **Task Guidelines**
   - Tasks should be concrete and actionable
   - **Reference existing code to reuse**: Include specific files/components to extend or adapt
   - Include specific file names and components
   - Build incrementally (each task builds on previous)
   - Reference requirements using _Requirements: X.Y_ format
   - Use test-driven development approach leveraging existing test patterns

4. **Task Format**
   \`\`\`markdown
   - [ ] 1. Task description
     - Sub-bullet with details
     - Specific files to create/modify
     - _Leverage: existing-component.ts, utils/helpers.js_
     - _Requirements: 1.1, 2.3_
   \`\`\`

5. **Excluded Tasks**
   - User acceptance testing
   - Deployment to production
   - Performance metrics gathering
   - User training or documentation
   - Business process changes

6. **Approval Process**
   - Present the complete task list
   - Ask: "Do the tasks look good?"
   - Make revisions based on feedback
   - Continue until explicit approval

7. **Generate Task Commands** (ONLY after tasks approval)
   - **WAIT**: Do not run command generation until user explicitly approves tasks
   - **ASK USER**: "Would you like me to generate individual task commands for easier execution? (yes/no)"
   - **IF YES**: Execute \`npx ${packageMeta.name}@latest generate-task-commands {feature-name}\`
   - **IF NO**: Continue with traditional \`/spec-execute\` approach
   - **PURPOSE**: Creates individual task commands in \`.claude/commands/{feature-name}/\`
   - **RESULT**: Each task gets its own command: \`/{feature-name}-task-{task-id}\`
   - **EXAMPLE**: Creates \`/{feature-name}-task-1\`, \`/{feature-name}-task-2.1\`, etc.
   - **CROSS-PLATFORM**: Works automatically on Windows, macOS, and Linux
   - **RESTART REQUIRED**: Inform user to restart Claude Code for new commands to be visible

## Task Structure
\`\`\`markdown
# Implementation Plan

- [ ] 1. Setup project structure
  - Create directory structure following existing patterns
  - Define core interfaces extending existing base classes
  - _Leverage: src/types/base.ts, src/models/BaseModel.ts_
  - _Requirements: 1.1_

- [ ] 2. Implement data models
- [ ] 2.1 Create base model classes
  - Extend existing validation utilities
  - Write unit tests using existing test helpers
  - _Leverage: src/utils/validation.ts, tests/helpers/testUtils.ts_
  - _Requirements: 2.1, 2.2_
\`\`\`

## Next Phase
After approval and command generation:
1. **RESTART Claude Code** for new commands to be visible
2. Then you can:
   - Use \`/spec-execute\` to implement tasks
   - Use individual task commands: \`/{feature-name}-task-1\`, \`/{feature-name}-task-2\`, etc.
   - Check progress with \`/spec-status {feature-name}\`
`;
}

export function getSpecExecuteCommand(): string {
  return `# Spec Execute Command

Execute specific tasks from the approved task list.

## Usage
\`\`\`
/spec-execute [task-id] [feature-name]
\`\`\`

## Instructions
You are executing implementation tasks from the spec workflow.

1. **Prerequisites**
   - Ensure tasks.md exists and is approved
   - Load requirements.md, design.md, and tasks.md for context
   - **Load all steering documents**: Load product.md, tech.md, and structure.md if available
   - Identify the specific task to execute

2. **Task Execution**
   - Focus on ONE task at a time
   - If task has sub-tasks, start with those
   - Follow the implementation details from design.md
   - Verify against requirements specified in the task

3. **Implementation Guidelines**
   - Write clean, maintainable code
   - **Follow steering documents**: Adhere to patterns in tech.md and conventions in structure.md
   - Follow existing code patterns and conventions
   - Include appropriate error handling
   - Add unit tests where specified
   - Document complex logic

4. **Validation**
   - Verify implementation meets acceptance criteria
   - Run tests if they exist
   - Check for lint/type errors
   - Ensure integration with existing code

5. **Completion**
   - **CRITICAL**: Mark task as complete in tasks.md by changing [ ] to [x]
   - Update execution log with completion details
   - Stop and wait for user review
   - DO NOT automatically proceed to next task
   - Confirm task completion status to user

## Task Selection
If no task-id specified:
- Look at tasks.md for the spec
- Recommend the next pending task
- Ask user to confirm before proceeding

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
