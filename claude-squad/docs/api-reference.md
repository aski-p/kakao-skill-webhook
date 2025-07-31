# Claude Squad API Reference

## Core Classes

### Squad
Main orchestration class for managing the agent squad.

#### Methods

##### `__init__(config_path: str = "config/squad.yaml")`
Initialize squad with configuration file.

##### `async initialize()`
Initialize the squad with configured agents.

##### `async submit_task(task: Task) -> str`
Submit a task to the squad. Returns task ID.

##### `async submit_workflow(workflow_name: str, inputs: Dict) -> List[str]`
Submit a complete workflow. Returns list of task IDs.

##### `async get_status() -> Dict`
Get current squad status including agent states and task counts.

##### `async start()`
Start the squad execution loop.

##### `stop()`
Stop the squad execution.

##### `async wait_for_task(task_id: str, timeout: Optional[float] = None) -> Task`
Wait for a specific task to complete.

### Task
Represents a unit of work in the system.

#### Attributes
- `type: str` - Task type (e.g., 'analyze', 'implement')
- `description: str` - Human-readable description
- `priority: str` - Priority level ('low', 'medium', 'high', 'critical')
- `inputs: Dict[str, Any]` - Input parameters
- `outputs: Dict[str, Any]` - Task results
- `dependencies: List[str]` - List of task IDs this depends on
- `status: str` - Current status
- `id: str` - Unique task identifier

#### Methods
- `mark_assigned(agent_name: str)` - Mark task as assigned
- `mark_started()` - Mark task as started
- `mark_completed(outputs: Dict[str, Any])` - Mark task as completed
- `mark_failed(error: str)` - Mark task as failed
- `is_ready(completed_tasks: List[str]) -> bool` - Check if dependencies satisfied

### Agent (Abstract Base Class)
Base class for all squad agents.

#### Attributes
- `name: str` - Agent name
- `role: str` - Agent role description
- `capabilities: List[str]` - List of capabilities
- `status: str` - Current status

#### Abstract Methods
- `async execute_task(task: Task) -> Dict[str, Any]` - Execute a task
- `async validate_task(task: Task) -> bool` - Validate if agent can handle task

#### Methods
- `can_handle(task_type: str) -> bool` - Check capability
- `get_load() -> float` - Get current load (0.0-1.0)
- `async communicate(message: Dict[str, Any], recipient: Optional[Agent] = None)` - Inter-agent communication

### Coordinator
Special agent that manages task distribution.

#### Additional Methods
- `register_agent(agent: Agent)` - Register an agent
- `async distribute_task(task: Task) -> bool` - Distribute task to suitable agent
- `async run()` - Main coordination loop

## Configuration Schemas

### Agent Configuration
```yaml
agent:
  name: string
  role: string
  description: string

capabilities:
  - list of capability strings

preferences:
  key: value pairs

decision_framework:
  priorities:
    factor: weight (0.0-1.0)
```

### Squad Configuration
```yaml
squad:
  name: string
  version: string

settings:
  max_parallel_tasks: integer
  communication_protocol: string
  error_recovery: string
  logging_level: string

agents:
  available:
    - list of agent names
```

### Workflow Configuration
```yaml
workflows:
  workflow_name:
    description: string
    steps:
      - name: string
        agent: string
        inputs: list (optional)
        outputs: list
```

## Error Handling

All methods that can fail will raise appropriate exceptions:

- `RuntimeError` - Squad not initialized
- `ValueError` - Invalid configuration or parameters
- `TimeoutError` - Task timeout exceeded
- `asyncio.CancelledError` - Operation cancelled

## Examples

See the `example.py` file for complete usage examples.