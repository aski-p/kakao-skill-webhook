"""Main Squad Class for Claude Squad"""

import asyncio
import yaml
from typing import Dict, List, Optional
import logging
from pathlib import Path
from .coordinator import Coordinator
from .task import Task

class Squad:
    """Main squad orchestration class"""
    
    def __init__(self, config_path: str = "config/squad.yaml"):
        self.logger = logging.getLogger("Squad")
        self.config = self._load_config(config_path)
        self.coordinator: Optional[Coordinator] = None
        self.agents: Dict[str, 'Agent'] = {}
        self._running = False
        
    def _load_config(self, config_path: str) -> Dict:
        """Load squad configuration"""
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
            
    async def initialize(self):
        """Initialize the squad with configured agents"""
        self.logger.info("Initializing Claude Squad...")
        
        # Create coordinator
        coordinator_config = Path("agents/coordinator.yaml")
        self.coordinator = Coordinator(str(coordinator_config))
        
        # Load other agents
        for agent_name in self.config['agents']['available']:
            if agent_name != 'coordinator':
                # In a real implementation, we'd dynamically load agent classes
                self.logger.info(f"Would load agent: {agent_name}")
                
        self.logger.info("Squad initialization complete")
        
    async def submit_task(self, task: Task) -> str:
        """Submit a task to the squad"""
        if not self.coordinator:
            raise RuntimeError("Squad not initialized")
            
        self.coordinator.task_queue.append(task)
        self.logger.info(f"Task {task.id} submitted to squad")
        return task.id
        
    async def submit_workflow(self, workflow_name: str, inputs: Dict) -> List[str]:
        """Submit a complete workflow to the squad"""
        workflows_config = Path("config/tasks.yaml")
        with open(workflows_config, 'r') as f:
            workflows = yaml.safe_load(f)['workflows']
            
        if workflow_name not in workflows:
            raise ValueError(f"Unknown workflow: {workflow_name}")
            
        workflow = workflows[workflow_name]
        task_ids = []
        
        # Create tasks for each step
        for step in workflow['steps']:
            task = Task(
                type=step['name'],
                description=f"{workflow_name}.{step['name']}",
                inputs=inputs.get(step['name'], {}),
                dependencies=[t.id for t in task_ids[-len(step.get('inputs', [])):]]
            )
            task_id = await self.submit_task(task)
            task_ids.append(task_id)
            
        return task_ids
        
    async def get_status(self) -> Dict:
        """Get current squad status"""
        if not self.coordinator:
            return {'status': 'not_initialized'}
            
        return await self.coordinator.execute_task(
            Task(type='monitor', description='Get squad status')
        )
        
    async def start(self):
        """Start the squad"""
        if not self.coordinator:
            await self.initialize()
            
        self._running = True
        self.logger.info("Starting Claude Squad...")
        
        # Start coordinator
        coordinator_task = asyncio.create_task(self.coordinator.run())
        
        # In a real implementation, we'd also start all agents
        
        try:
            await coordinator_task
        except asyncio.CancelledError:
            self.logger.info("Squad stopped")
            
    def stop(self):
        """Stop the squad"""
        self._running = False
        self.logger.info("Stopping Claude Squad...")
        
    async def wait_for_task(self, task_id: str, timeout: Optional[float] = None) -> Task:
        """Wait for a task to complete"""
        start_time = asyncio.get_event_loop().time()
        
        while True:
            if task_id in self.coordinator.completed_tasks:
                # Find the completed task
                for task in self.coordinator.active_tasks.values():
                    if task.id == task_id:
                        return task
                        
            if timeout and (asyncio.get_event_loop().time() - start_time) > timeout:
                raise TimeoutError(f"Task {task_id} did not complete within {timeout}s")
                
            await asyncio.sleep(0.1)