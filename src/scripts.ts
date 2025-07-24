/**
 * Platform-specific command generation scripts for Claude Code Spec Workflow
 *
 * These scripts replace the JavaScript version to avoid conflicts and ensure
 * cross-platform compatibility. The agent detects the OS and runs the appropriate script.
 */

export function getWindowsCommandGenerationScript(): string {
  return `@echo off
REM Command Generation Script for Claude Code Spec Workflow (Windows)
REM
REM This script generates individual task commands for each task in a spec's tasks.md file.
REM It creates a folder structure under .claude/commands/{spec-name}/ with individual
REM command files for each task that call /spec-execute with the appropriate parameters.
REM
REM Usage: generate-commands.bat <spec-name>

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Error: Spec name is required
    echo Usage: generate-commands.bat ^<spec-name^>
    exit /b 1
)

set "SPEC_NAME=%~1"
set "PROJECT_ROOT=%CD%"
set "SPEC_DIR=%PROJECT_ROOT%\\.claude\\specs\\%SPEC_NAME%"
set "TASKS_FILE=%SPEC_DIR%\\tasks.md"
set "COMMANDS_SPEC_DIR=%PROJECT_ROOT%\\.claude\\commands\\%SPEC_NAME%"

REM Check if tasks.md exists
if not exist "%TASKS_FILE%" (
    echo Error: tasks.md not found at %TASKS_FILE%
    exit /b 1
)

REM Create spec commands directory
if not exist "%COMMANDS_SPEC_DIR%" mkdir "%COMMANDS_SPEC_DIR%"

REM Parse tasks and generate commands
set "TASK_COUNT=0"
set "CURRENT_TASK_ID="
set "CURRENT_TASK_DESC="
set "CURRENT_LEVERAGE="
set "CURRENT_REQUIREMENTS="
set "IN_TASK=0"
echo Parsing tasks from %TASKS_FILE%...

for /f "usebackq delims=" %%a in ("%TASKS_FILE%") do (
    set "LINE=%%a"
    call :ParseTaskLine "!LINE!"
)

REM Handle the last task if we were in one
if !IN_TASK!==1 (
    if not "!CURRENT_TASK_ID!"=="" (
        call :GenerateTaskCommand "!CURRENT_TASK_ID!" "!CURRENT_TASK_DESC!" "!CURRENT_LEVERAGE!" "!CURRENT_REQUIREMENTS!"
        set /a TASK_COUNT+=1
    )
)

echo.
echo Generated !TASK_COUNT! task commands for spec: %SPEC_NAME%
echo Commands created in: .claude\\commands\\%SPEC_NAME%\\
echo.
echo Generated commands:
for /f "usebackq delims=" %%a in ("%TASKS_FILE%") do (
    set "LINE=%%a"
    call :ShowTaskCommand "!LINE!"
)
echo.
echo ============================================================
echo IMPORTANT: Please restart Claude Code for the new commands to be visible
echo ============================================================
echo.
echo The task commands have been generated successfully.
echo After restarting Claude Code, you can use commands like:
echo   /%SPEC_NAME%-task-1
echo   /%SPEC_NAME%-task-2
echo   etc.
echo.

goto :eof

:ParseTaskLine
set "TASK_LINE=%~1"
REM Match task lines like "- [ ] 1. Task description" or "- [ ] 2.1 Task description"
echo !TASK_LINE! | findstr /b /c:"- [ ]" >nul
if !errorlevel! equ 0 (
    REM If we were processing a previous task, generate its command first
    if !IN_TASK!==1 (
        if not "!CURRENT_TASK_ID!"=="" (
            call :GenerateTaskCommand "!CURRENT_TASK_ID!" "!CURRENT_TASK_DESC!" "!CURRENT_LEVERAGE!" "!CURRENT_REQUIREMENTS!"
            set /a TASK_COUNT+=1
        )
    )
    
    REM Extract everything after "- [ ] "
    set "AFTER_CHECKBOX=!TASK_LINE:~6!"
    call :ExtractTaskInfo "!AFTER_CHECKBOX!"
    set "IN_TASK=1"
    set "CURRENT_LEVERAGE="
    set "CURRENT_REQUIREMENTS="
) else if !IN_TASK!==1 (
    REM Check for _Leverage: lines
    echo !TASK_LINE! | findstr /c:"_Leverage:" >nul
    if !errorlevel! equ 0 (
        for /f "tokens=1,* delims=:" %%x in ("!TASK_LINE!") do (
            set "LEVERAGE_PART=%%y"
            REM Remove leading spaces and dashes
            set "LEVERAGE_PART=!LEVERAGE_PART:~1!"
            set "CURRENT_LEVERAGE=!LEVERAGE_PART!"
        )
    )
    
    REM Check for _Requirements: lines
    echo !TASK_LINE! | findstr /c:"_Requirements:" >nul
    if !errorlevel! equ 0 (
        for /f "tokens=1,* delims=:" %%x in ("!TASK_LINE!") do (
            set "REQUIREMENTS_PART=%%y"
            REM Remove leading spaces and dashes
            set "REQUIREMENTS_PART=!REQUIREMENTS_PART:~1!"
            set "CURRENT_REQUIREMENTS=!REQUIREMENTS_PART!"
        )
    )
)
goto :eof

:ExtractTaskInfo
set "REMAINING=%~1"
REM Find the first token which should be the task ID
for /f "tokens=1,* delims= " %%x in ("!REMAINING!") do (
    set "POTENTIAL_ID=%%x"
    set "REST=%%y"

    REM Remove trailing dot if present
    if "!POTENTIAL_ID:~-1!"=="." set "POTENTIAL_ID=!POTENTIAL_ID:~0,-1!"

    REM Check if it looks like a task ID (starts with digit, may contain dots)
    echo !POTENTIAL_ID! | findstr /r "^[0-9]" >nul
    if !errorlevel! equ 0 (
        REM Simple validation - check if it matches pattern like 1, 1.2, 1.2.3 etc
        REM Replace dots with spaces and check each part is numeric
        set "ID_PARTS=!POTENTIAL_ID:.= !"
        set "VALID_ID=1"
        for %%p in (!ID_PARTS!) do (
            REM Use arithmetic test to check if part is numeric
            set /a "TEST_NUM=%%p" 2>nul
            if !errorlevel! neq 0 set "VALID_ID=0"
        )
        if !VALID_ID! equ 1 (
            set "CURRENT_TASK_ID=!POTENTIAL_ID!"
            set "CURRENT_TASK_DESC=!REST!"
        )
    )
)
goto :eof

:GenerateTaskCommand
set "TASK_ID=%~1"
set "TASK_DESC=%~2"
set "LEVERAGE_INFO=%~3"
set "REQUIREMENTS_INFO=%~4"
set "COMMAND_FILE=%COMMANDS_SPEC_DIR%\\task-%TASK_ID%.md"

(
echo # %SPEC_NAME% - Task %TASK_ID%
echo.
echo Execute task %TASK_ID% for the %SPEC_NAME% specification.
echo.
echo ## Task Description
echo %TASK_DESC%
echo.
if not "%LEVERAGE_INFO%"=="" (
    echo ## Code Reuse
    echo **Leverage existing code**: %LEVERAGE_INFO%
    echo.
)
if not "%REQUIREMENTS_INFO%"=="" (
    echo ## Requirements Reference  
    echo **Requirements**: %REQUIREMENTS_INFO%
    echo.
)
echo ## Usage
echo \`\`\`
echo /%SPEC_NAME%-task-%TASK_ID%
echo \`\`\`
echo.
echo ## Instructions
echo This command executes a specific task from the %SPEC_NAME% specification.
echo.
echo **Automatic Execution**: This command will automatically execute:
echo \`\`\`
echo /spec-execute %TASK_ID% %SPEC_NAME%
echo \`\`\`
echo.
echo **Process**:
echo 1. Load the %SPEC_NAME% specification context ^(requirements.md, design.md, tasks.md^)
echo 2. Execute task %TASK_ID%: "%TASK_DESC%"
echo 3. **Prioritize code reuse**: Use existing components and utilities identified above
echo 4. Follow all implementation guidelines from the main /spec-execute command
echo 5. Mark the task as complete in tasks.md
echo 6. Stop and wait for user review
echo.
echo **Important**: This command follows the same rules as /spec-execute:
echo - Execute ONLY this specific task
echo - **Leverage existing code** whenever possible to avoid rebuilding functionality
echo - Mark task as complete by changing [ ] to [x] in tasks.md
echo - Stop after completion and wait for user approval
echo - Do not automatically proceed to the next task
echo.
echo ## Next Steps
echo After task completion, you can:
echo - Review the implementation
echo - Run tests if applicable
echo - Execute the next task using /%SPEC_NAME%-task-[next-id]
echo - Check overall progress with /spec-status %SPEC_NAME%
) > "%COMMAND_FILE%"

goto :eof

:ShowTaskCommand
set "TASK_LINE=%~1"
REM Use same logic as ParseTaskLine
echo !TASK_LINE! | findstr /b /c:"- [ ]" >nul
if !errorlevel! equ 0 (
    set "AFTER_CHECKBOX=!TASK_LINE:~6!"
    call :ShowTaskInfo "!AFTER_CHECKBOX!"
)
goto :eof

:ShowTaskInfo
set "REMAINING=%~1"
for /f "tokens=1,* delims= " %%x in ("!REMAINING!") do (
    set "POTENTIAL_ID=%%x"
    set "REST=%%y"

    if "!POTENTIAL_ID:~-1!"=="." set "POTENTIAL_ID=!POTENTIAL_ID:~0,-1!"

    REM Check if it looks like a task ID
    echo !POTENTIAL_ID! | findstr /r "^[0-9]" >nul
    if !errorlevel! equ 0 (
        REM Simple validation - check if it matches pattern like 1, 1.2, 1.2.3 etc
        set "ID_PARTS=!POTENTIAL_ID:.= !"
        set "VALID_ID=1"
        for %%p in (!ID_PARTS!) do (
            REM Use arithmetic test to check if part is numeric
            set /a "TEST_NUM=%%p" 2>nul
            if !errorlevel! neq 0 set "VALID_ID=0"
        )
        if !VALID_ID! equ 1 (
            echo   /%SPEC_NAME%-task-!POTENTIAL_ID! - !REST!
        )
    )
)
goto :eof
`;
}

export function getUnixCommandGenerationScript(): string {
  return `#!/bin/bash
# Command Generation Script for Claude Code Spec Workflow (Unix/Linux/macOS)
#
# This script generates individual task commands for each task in a spec's tasks.md file.
# It creates a folder structure under .claude/commands/{spec-name}/ with individual
# command files for each task that call /spec-execute with the appropriate parameters.
#
# Usage: ./generate-commands.sh <spec-name>

set -e

if [ -z "$1" ]; then
    echo "Error: Spec name is required"
    echo "Usage: ./generate-commands.sh <spec-name>"
    exit 1
fi

SPEC_NAME="$1"
PROJECT_ROOT="$(pwd)"
SPEC_DIR="$PROJECT_ROOT/.claude/specs/$SPEC_NAME"
TASKS_FILE="$SPEC_DIR/tasks.md"
COMMANDS_SPEC_DIR="$PROJECT_ROOT/.claude/commands/$SPEC_NAME"

# Check if tasks.md exists
if [ ! -f "$TASKS_FILE" ]; then
    echo "Error: tasks.md not found at $TASKS_FILE"
    exit 1
fi

# Create spec commands directory
mkdir -p "$COMMANDS_SPEC_DIR"

# Parse tasks and generate commands
TASK_COUNT=0
echo "Parsing tasks from $TASKS_FILE..."

generate_task_command() {
    local task_id="$1"
    local task_desc="$2"
    local leverage_info="$3"
    local requirements_info="$4"
    local command_file="$COMMANDS_SPEC_DIR/task-$task_id.md"

    cat > "$command_file" << EOF
# $SPEC_NAME - Task $task_id

Execute task $task_id for the $SPEC_NAME specification.

## Task Description
$task_desc

EOF

    # Add Leverage section if present
    if [ -n "$leverage_info" ]; then
        cat >> "$command_file" << EOF
## Code Reuse
**Leverage existing code**: $leverage_info

EOF
    fi

    # Add Requirements section if present
    if [ -n "$requirements_info" ]; then
        cat >> "$command_file" << EOF
## Requirements Reference
**Requirements**: $requirements_info

EOF
    fi

    cat >> "$command_file" << EOF
## Usage
\`\`\`
/$SPEC_NAME-task-$task_id
\`\`\`

## Instructions
This command executes a specific task from the $SPEC_NAME specification.

**Automatic Execution**: This command will automatically execute:
\`\`\`
/spec-execute $task_id $SPEC_NAME
\`\`\`

**Process**:
1. Load the $SPEC_NAME specification context (requirements.md, design.md, tasks.md)
2. Execute task $task_id: "$task_desc"
3. **Prioritize code reuse**: Use existing components and utilities identified above
4. Follow all implementation guidelines from the main /spec-execute command
5. Mark the task as complete in tasks.md
6. Stop and wait for user review

**Important**: This command follows the same rules as /spec-execute:
- Execute ONLY this specific task
- **Leverage existing code** whenever possible to avoid rebuilding functionality
- Mark task as complete by changing [ ] to [x] in tasks.md
- Stop after completion and wait for user approval
- Do not automatically proceed to the next task

## Next Steps
After task completion, you can:
- Review the implementation
- Run tests if applicable
- Execute the next task using /$SPEC_NAME-task-[next-id]
- Check overall progress with /spec-status $SPEC_NAME
EOF
}

# Parse tasks from markdown
current_task_id=""
current_task_desc=""
current_leverage=""
current_requirements=""
in_task=false

while IFS= read -r line; do
    # Match task lines like "- [ ] 1. Task description" or "- [ ] 2.1 Task description"
    if [[ $line =~ ^[[:space:]]*-[[:space:]]*\\[[[:space:]]*\\][[:space:]]*([0-9]+(\\.[0-9]+)*)[[:space:]]*\\.?[[:space:]]*(.+)$ ]]; then
        # If we were processing a previous task, generate its command
        if [ "$in_task" = true ] && [ -n "$current_task_id" ]; then
            generate_task_command "$current_task_id" "$current_task_desc" "$current_leverage" "$current_requirements"
            ((TASK_COUNT++))
        fi
        
        # Start new task
        current_task_id="\${BASH_REMATCH[1]}"
        current_task_desc="\${BASH_REMATCH[3]}"
        current_leverage=""
        current_requirements=""
        in_task=true
    elif [ "$in_task" = true ]; then
        # Look for _Leverage: lines
        if [[ $line =~ ^[[:space:]]*-[[:space:]]*_Leverage:[[:space:]]*(.+)$ ]]; then
            current_leverage="\${BASH_REMATCH[1]}"
        # Look for _Requirements: lines
        elif [[ $line =~ ^[[:space:]]*-[[:space:]]*_Requirements:[[:space:]]*(.+)$ ]]; then
            current_requirements="\${BASH_REMATCH[1]}"
        # If we hit another checkbox or end of task context, stop collecting for this task
        elif [[ $line =~ ^[[:space:]]*-[[:space:]]*\\[ ]]; then
            # This might be the start of a new task or sub-task, let the main parser handle it
            continue
        fi
    fi
done < "$TASKS_FILE"

# Don't forget the last task
if [ "$in_task" = true ] && [ -n "$current_task_id" ]; then
    generate_task_command "$current_task_id" "$current_task_desc" "$current_leverage" "$current_requirements"
    ((TASK_COUNT++))
fi

echo
echo "Generated $TASK_COUNT task commands for spec: $SPEC_NAME"
echo "Commands created in: .claude/commands/$SPEC_NAME/"
echo
echo "Generated commands:"

# Show generated commands  
while IFS= read -r line; do
    if [[ $line =~ ^[[:space:]]*-[[:space:]]*\\[[[:space:]]*\\][[:space:]]*([0-9]+(\\.[0-9]+)*)[[:space:]]*\\.?[[:space:]]*(.+)$ ]]; then
        task_id="\${BASH_REMATCH[1]}"
        task_desc="\${BASH_REMATCH[3]}"
        echo "  /$SPEC_NAME-task-$task_id - $task_desc"
    fi
done < "$TASKS_FILE"

echo
echo "============================================================"
echo "IMPORTANT: Please restart Claude Code for the new commands to be visible"
echo "============================================================"
echo
echo "The task commands have been generated successfully."
echo "After restarting Claude Code, you can use commands like:"
echo "  /$SPEC_NAME-task-1"
echo "  /$SPEC_NAME-task-2"
echo "  etc."
echo
`;
}

export function getOSDetectionScript(): string {
  return `#!/bin/bash
# OS Detection and Command Generation Launcher
# This script detects the operating system and runs the appropriate command generation script
#
# Usage: ./generate-commands-launcher.sh <spec-name>

set -e

if [ -z "$1" ]; then
    echo "Error: Spec name is required"
    echo "Usage: ./generate-commands-launcher.sh <spec-name>"
    exit 1
fi

SPEC_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

# Detect operating system
detect_os() {
    case "$(uname -s)" in
        CYGWIN*|MINGW*|MSYS*)
            echo "windows"
            ;;
        Darwin*)
            echo "macos"
            ;;
        Linux*)
            echo "linux"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

OS_TYPE=$(detect_os)

echo "Detected OS: $OS_TYPE"
echo "Generating commands for spec: $SPEC_NAME"

case "$OS_TYPE" in
    "windows")
        if [ -f "$SCRIPT_DIR/generate-commands.bat" ]; then
            cmd.exe /c "$SCRIPT_DIR/generate-commands.bat" "$SPEC_NAME"
        else
            echo "Error: Windows script not found at $SCRIPT_DIR/generate-commands.bat"
            exit 1
        fi
        ;;
    "macos"|"linux")
        if [ -f "$SCRIPT_DIR/generate-commands.sh" ]; then
            chmod +x "$SCRIPT_DIR/generate-commands.sh"
            "$SCRIPT_DIR/generate-commands.sh" "$SPEC_NAME"
        else
            echo "Error: Unix script not found at $SCRIPT_DIR/generate-commands.sh"
            exit 1
        fi
        ;;
    *)
        echo "Error: Unsupported operating system: $OS_TYPE"
        echo "Supported platforms: Windows, macOS, Linux"
        exit 1
        ;;
esac
`;
}

/**
 * Get the appropriate command generation script based on the detected operating system
 * This function is used by the agent to determine which script to run
 */
export function getCommandGenerationInstructions(): string {
  return `# Command Generation Instructions

## Platform-Specific Script Execution

The command generation system now uses platform-specific scripts instead of JavaScript to avoid conflicts and ensure cross-platform compatibility.

### Available Scripts:
- **Windows**: \`generate-commands.bat\`
- **macOS/Linux**: \`generate-commands.sh\`
- **Launcher**: \`generate-commands-launcher.sh\` (auto-detects OS)

### Agent Instructions:

**CRITICAL**: Use the OS detection launcher script instead of the old JavaScript version.

1. **After tasks.md approval**, execute the appropriate command:

   **Option 1 - Use the launcher (recommended):**
   \`\`\`bash
   ./.claude/scripts/generate-commands-launcher.sh {spec-name}
   \`\`\`

   **Option 2 - Platform-specific execution:**

   **Windows:**
   \`\`\`cmd
   .claude\\scripts\\generate-commands.bat {spec-name}
   \`\`\`

   **macOS/Linux:**
   \`\`\`bash
   ./.claude/scripts/generate-commands.sh {spec-name}
   \`\`\`

2. **IMPORTANT**: After script completion, inform the user to restart Claude Code for the new commands to be visible.

2. **OS Detection**: The launcher script automatically detects the operating system and runs the appropriate platform-specific script.

3. **Functionality**: All scripts provide the same functionality:
   - Parse tasks.md files
   - Support hierarchical task numbering (1, 2, 2.1, 2.2, etc.)
   - Generate command files in .claude/commands/{spec-name}/ directory
   - Create individual task commands like /{spec-name}-task-{id}

4. **Integration**: These scripts replace the old \`node .claude/scripts/generate-commands.js\` command.

### Migration Notes:
- **DO NOT** use \`node .claude/scripts/generate-commands.js\` anymore
- **DO NOT** reference the JavaScript version in instructions
- **ALWAYS** use the platform-specific scripts or the launcher
- The scripts are generated during setup and stored in \`.claude/scripts/\`

### Error Handling:
If the launcher fails to detect the OS or find the appropriate script:
1. Check that all three scripts exist in \`.claude/scripts/\`
2. Ensure the launcher script has execute permissions
3. Manually run the platform-specific script if needed
`;
}

// Legacy function kept for backward compatibility during transition
// This should not be used anymore - use platform-specific scripts instead
export function getCommandGenerationScript(): string {
  console.warn(
    'WARNING: getCommandGenerationScript() is deprecated. Use platform-specific scripts instead.'
  );
  return getCommandGenerationInstructions();
}
