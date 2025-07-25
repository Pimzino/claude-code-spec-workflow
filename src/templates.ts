export function getRequirementsTemplate(): string {
  return `# Requirements Document

## Introduction

[Provide a brief overview of the feature, its purpose, and its value to users]

## Alignment with Product Vision

[Explain how this feature supports the goals outlined in product.md]

## Requirements

### Requirement 1

**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria

1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]
3. WHEN [event] AND [condition] THEN [system] SHALL [response]

### Requirement 2

**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria

1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]

## Non-Functional Requirements

### Performance
- [Performance requirements]

### Security
- [Security requirements]

### Reliability
- [Reliability requirements]

### Usability
- [Usability requirements]
`;
}

export function getDesignTemplate(): string {
  return `# Design Document

## Overview

[High-level description of the feature and its place in the overall system]

## Steering Document Alignment

### Technical Standards (tech.md)
[How the design follows documented technical patterns and standards]

### Project Structure (structure.md)
[How the implementation will follow project organization conventions]

## Architecture

[Describe the overall architecture and design patterns used]

\`\`\`mermaid
graph TD
    A[Component A] --> B[Component B]
    B --> C[Component C]
\`\`\`

## Components and Interfaces

### Component 1
- **Purpose:** [What this component does]
- **Interfaces:** [Public methods/APIs]
- **Dependencies:** [What it depends on]

### Component 2
- **Purpose:** [What this component does]
- **Interfaces:** [Public methods/APIs]
- **Dependencies:** [What it depends on]

## Data Models

### Model 1
\`\`\`
[Define the structure of Model1 in your language]
- id: [unique identifier type]
- name: [string/text type]
- [Additional properties as needed]
\`\`\`

### Model 2
\`\`\`
[Define the structure of Model2 in your language]
- id: [unique identifier type]
- [Additional properties as needed]
\`\`\`

## Error Handling

### Error Scenarios
1. **Scenario 1:** [Description]
   - **Handling:** [How to handle]
   - **User Impact:** [What user sees]

2. **Scenario 2:** [Description]
   - **Handling:** [How to handle]
   - **User Impact:** [What user sees]

## Testing Strategy

### Unit Testing
- [Unit testing approach]
- [Key components to test]

### Integration Testing
- [Integration testing approach]
- [Key flows to test]

### End-to-End Testing
- [E2E testing approach]
- [User scenarios to test]
`;
}

export function getTasksTemplate(): string {
  return `# Implementation Plan

## Task Overview
[Brief description of the implementation approach]

## Steering Document Compliance
[How tasks follow structure.md conventions and tech.md patterns]

## Tasks

- [ ] 1. Set up project structure and core interfaces
  - Create directory structure for components
  - Define core interfaces and types
  - Set up basic configuration
  - _Requirements: 1.1_

- [ ] 2. Implement data models and validation
- [ ] 2.1 Create base model classes
  - Define data structures/schemas
  - Implement validation methods
  - Write unit tests for models
  - _Requirements: 2.1, 2.2_

- [ ] 2.2 Implement specific model classes
  - Create concrete model implementations
  - Add relationship handling
  - Test model interactions
  - _Requirements: 2.3_

- [ ] 3. Create service layer
- [ ] 3.1 Implement core service interfaces
  - Define service contracts
  - Create base service classes
  - Add dependency injection
  - _Requirements: 3.1_

- [ ] 3.2 Implement business logic services
  - Create specific service implementations
  - Add error handling
  - Write service unit tests
  - _Requirements: 3.2, 3.3_

- [ ] 4. Create API endpoints
- [ ] 4.1 Set up routing and middleware
  - Configure application routes
  - Add authentication middleware
  - Set up error handling middleware
  - _Requirements: 4.1_

- [ ] 4.2 Implement CRUD endpoints
  - Create API endpoints
  - Add request validation
  - Write API integration tests
  - _Requirements: 4.2, 4.3_

- [ ] 5. Add frontend components
- [ ] 5.1 Create base UI components
  - Set up component structure
  - Implement reusable components
  - Add styling and theming
  - _Requirements: 5.1_

- [ ] 5.2 Implement feature-specific components
  - Create feature components
  - Add state management
  - Connect to API endpoints
  - _Requirements: 5.2, 5.3_

- [ ] 6. Integration and testing
- [ ] 6.1 Write end-to-end tests
  - Set up E2E testing framework
  - Write user journey tests
  - Add test automation
  - _Requirements: All_

- [ ] 6.2 Final integration and cleanup
  - Integrate all components
  - Fix any integration issues
  - Clean up code and documentation
  - _Requirements: All_
`;
}

export function getProductTemplate(): string {
  return `# Product Overview

## Product Purpose
[Describe the core purpose of this product/project. What problem does it solve?]

## Target Users
[Who are the primary users of this product? What are their needs and pain points?]

## Key Features
[List the main features that deliver value to users]

1. **Feature 1**: [Description]
2. **Feature 2**: [Description]
3. **Feature 3**: [Description]

## Business Objectives
[What are the business goals this product aims to achieve?]

- [Objective 1]
- [Objective 2]
- [Objective 3]

## Success Metrics
[How will we measure the success of this product?]

- [Metric 1]: [Target]
- [Metric 2]: [Target]
- [Metric 3]: [Target]

## Product Principles
[Core principles that guide product decisions]

1. **[Principle 1]**: [Explanation]
2. **[Principle 2]**: [Explanation]
3. **[Principle 3]**: [Explanation]

## Future Vision
[Where do we see this product evolving in the future?]
`;
}

export function getTechTemplate(): string {
  return `# Technology Stack

## Project Type
[Describe what kind of project this is: web application, CLI tool, desktop application, mobile app, library, API service, embedded system, game, etc.]

## Core Technologies

### Primary Language(s)
- **Language**: [e.g., Python 3.11, Go 1.21, TypeScript, Rust, C++]
- **Runtime/Compiler**: [if applicable]
- **Language-specific tools**: [package managers, build tools, etc.]

### Key Dependencies/Libraries
[List the main libraries and frameworks your project depends on]
- **[Library/Framework name]**: [Purpose and version]
- **[Library/Framework name]**: [Purpose and version]

### Application Architecture
[Describe how your application is structured - this could be MVC, event-driven, plugin-based, client-server, standalone, microservices, monolithic, etc.]

### Data Storage (if applicable)
- **Primary storage**: [e.g., PostgreSQL, files, in-memory, cloud storage]
- **Caching**: [e.g., Redis, in-memory, disk cache]
- **Data formats**: [e.g., JSON, Protocol Buffers, XML, binary]

### External Integrations (if applicable)
- **APIs**: [External services you integrate with]
- **Protocols**: [e.g., HTTP/REST, gRPC, WebSocket, TCP/IP]
- **Authentication**: [e.g., OAuth, API keys, certificates]

## Development Environment

### Build & Development Tools
- **Build System**: [e.g., Make, CMake, Gradle, npm scripts, cargo]
- **Package Management**: [e.g., pip, npm, cargo, go mod, apt, brew]
- **Development workflow**: [e.g., hot reload, watch mode, REPL]

### Code Quality Tools
- **Static Analysis**: [Tools for code quality and correctness]
- **Formatting**: [Code style enforcement tools]
- **Testing Framework**: [Unit, integration, and/or end-to-end testing tools]
- **Documentation**: [Documentation generation tools]

### Version Control & Collaboration
- **VCS**: [e.g., Git, Mercurial, SVN]
- **Branching Strategy**: [e.g., Git Flow, GitHub Flow, trunk-based]
- **Code Review Process**: [How code reviews are conducted]

## Deployment & Distribution (if applicable)
- **Target Platform(s)**: [Where/how the project runs: cloud, on-premise, desktop, mobile, embedded]
- **Distribution Method**: [How users get your software: download, package manager, app store, SaaS]
- **Installation Requirements**: [Prerequisites, system requirements]
- **Update Mechanism**: [How updates are delivered]

## Technical Requirements & Constraints

### Performance Requirements
- [e.g., response time, throughput, memory usage, startup time]
- [Specific benchmarks or targets]

### Compatibility Requirements  
- **Platform Support**: [Operating systems, architectures, versions]
- **Dependency Versions**: [Minimum/maximum versions of dependencies]
- **Standards Compliance**: [Industry standards, protocols, specifications]

### Security & Compliance
- **Security Requirements**: [Authentication, encryption, data protection]
- **Compliance Standards**: [GDPR, HIPAA, SOC2, etc. if applicable]
- **Threat Model**: [Key security considerations]

### Scalability & Reliability
- **Expected Load**: [Users, requests, data volume]
- **Availability Requirements**: [Uptime targets, disaster recovery]
- **Growth Projections**: [How the system needs to scale]

## Technical Decisions & Rationale
[Document key architectural and technology choices]

### Decision Log
1. **[Technology/Pattern Choice]**: [Why this was chosen, alternatives considered]
2. **[Architecture Decision]**: [Rationale, trade-offs accepted]
3. **[Tool/Library Selection]**: [Reasoning, evaluation criteria]

## Known Limitations
[Document any technical debt, limitations, or areas for improvement]

- [Limitation 1]: [Impact and potential future solutions]
- [Limitation 2]: [Why it exists and when it might be addressed]
`;
}

export function getStructureTemplate(): string {
  return `# Project Structure

## Directory Organization

\`\`\`
[Define your project's directory structure. Examples below - adapt to your project type]

Example for a library/package:
project-root/
├── src/                    # Source code
├── tests/                  # Test files  
├── docs/                   # Documentation
├── examples/               # Usage examples
└── [build/dist/out]        # Build output

Example for an application:
project-root/
├── [src/app/lib]           # Main source code
├── [assets/resources]      # Static resources
├── [config/settings]       # Configuration
├── [scripts/tools]         # Build/utility scripts
└── [tests/spec]            # Test files

Common patterns:
- Group by feature/module
- Group by layer (UI, business logic, data)
- Group by type (models, controllers, views)
- Flat structure for simple projects
\`\`\`

## Naming Conventions

### Files
- **Components/Modules**: [e.g., \`PascalCase\`, \`snake_case\`, \`kebab-case\`]
- **Services/Handlers**: [e.g., \`UserService\`, \`user_service\`, \`user-service\`]
- **Utilities/Helpers**: [e.g., \`dateUtils\`, \`date_utils\`, \`date-utils\`]
- **Tests**: [e.g., \`[filename]_test\`, \`[filename].test\`, \`[filename]Test\`]

### Code
- **Classes/Types**: [e.g., \`PascalCase\`, \`CamelCase\`, \`snake_case\`]
- **Functions/Methods**: [e.g., \`camelCase\`, \`snake_case\`, \`PascalCase\`]
- **Constants**: [e.g., \`UPPER_SNAKE_CASE\`, \`SCREAMING_CASE\`, \`PascalCase\`]
- **Variables**: [e.g., \`camelCase\`, \`snake_case\`, \`lowercase\`]

## Import Patterns

### Import Order
1. External dependencies
2. Internal modules
3. Relative imports
4. Style imports

### Module/Package Organization
\`\`\`
[Describe your project's import/include patterns]
Examples:
- Absolute imports from project root
- Relative imports within modules
- Package/namespace organization
- Dependency management approach
\`\`\`

## Code Structure Patterns

[Define common patterns for organizing code within files. Below are examples - choose what applies to your project]

### Module/Class Organization
\`\`\`
Example patterns:
1. Imports/includes/dependencies
2. Constants and configuration
3. Type/interface definitions
4. Main implementation
5. Helper/utility functions
6. Exports/public API
\`\`\`

### Function/Method Organization
\`\`\`
Example patterns:
- Input validation first
- Core logic in the middle
- Error handling throughout
- Clear return points
\`\`\`

### File Organization Principles
\`\`\`
Choose what works for your project:
- One class/module per file
- Related functionality grouped together
- Public API at the top/bottom
- Implementation details hidden
\`\`\`

## Code Organization Principles

1. **Single Responsibility**: Each file should have one clear purpose
2. **Modularity**: Code should be organized into reusable modules
3. **Testability**: Structure code to be easily testable
4. **Consistency**: Follow patterns established in the codebase

## Module Boundaries
[Define how different parts of your project interact and maintain separation of concerns]

Examples of boundary patterns:
- **Core vs Plugins**: Core functionality vs extensible plugins
- **Public API vs Internal**: What's exposed vs implementation details  
- **Platform-specific vs Cross-platform**: OS-specific code isolation
- **Stable vs Experimental**: Production code vs experimental features
- **Dependencies direction**: Which modules can depend on which

## Code Size Guidelines
[Define your project's guidelines for file and function sizes]

Suggested guidelines:
- **File size**: [Define maximum lines per file]
- **Function/Method size**: [Define maximum lines per function]
- **Class/Module complexity**: [Define complexity limits]
- **Nesting depth**: [Maximum nesting levels]

## Documentation Standards
- All public APIs must have documentation
- Complex logic should include inline comments
- README files for major modules
- Follow language-specific documentation conventions
`;
}
