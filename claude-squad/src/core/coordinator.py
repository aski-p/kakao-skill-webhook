"""Coordinator Class for Claude Squad"""

import asyncio
from typing import Dict, List, Optional, Set
import logging
from .agent import Agent
from .task import Task

class Coordinator(Agent):
    """Coordinator agent that manages the squad"""
    
    def __init__(self, config_path: str):
        super().__init__(config_path)
        self.agents: Dict[str, Agent] = {}
        self.task_queue: List[Task] = []
        self.completed_tasks: Set[str] = set()
        self.active_tasks: Dict[str, Task] = {}
        
    def register_agent(self, agent: Agent):
        """Register an agent with the coordinator"""
        self.agents[agent.name] = agent
        self.logger.info(f"Registered agent: {agent.name}")
        
    async def distribute_task(self, task: Task) -> bool:
        """Distribute a task to the most suitable agent"""
        # Find capable agents
        capable_agents = [
            agent for agent in self.agents.values()
            if agent.can_handle(task.type) and agent.status != 'busy'
        ]
        
        if not capable_agents:
            self.logger.warning(f"No capable agents for task: {task.id}")
            return False
            
        # Select agent with lowest load
        selected_agent = min(capable_agents, key=lambda a: a.get_load())
        
        # Assign task
        task.mark_assigned(selected_agent.name)
        self.active_tasks[task.id] = task
        
        # Notify agent
        await selected_agent.communicate({
            'type': 'task_assignment',
            'task': task
        })
        
        self.logger.info(f"Assigned task {task.id} to {selected_agent.name}")
        return True
        
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Coordinator executes coordination tasks"""
        if task.type == 'distribute':
            return await self._handle_distribution(task)
        elif task.type == 'monitor':
            return await self._handle_monitoring(task)
        else:
            return {'error': f"Unknown coordinator task type: {task.type}"}
            
    async def validate_task(self, task: Task) -> bool:
        """Validate coordinator tasks"""
        return task.type in ['distribute', 'monitor', 'coordinate']
        
    async def _handle_distribution(self, task: Task) -> Dict[str, Any]:
        """Handle task distribution"""
        subtasks = task.inputs.get('subtasks', [])
        distributed = 0
        
        for subtask in subtasks:
            if await self.distribute_task(subtask):
                distributed += 1
                
        return {
            'distributed': distributed,
            'total': len(subtasks)
        }
        
    async def _handle_monitoring(self, task: Task) -> Dict[str, Any]:
        """Handle squad monitoring"""
        status = {
            'agents': {},
            'tasks': {
                'active': len(self.active_tasks),
                'completed': len(self.completed_tasks),
                'queued': len(self.task_queue)
            }
        }
        
        for name, agent in self.agents.items():
            status['agents'][name] = {
                'status': agent.status,
                'load': agent.get_load()
            }
            
        return status
        
    async def run(self):
        """Main coordinator loop"""
        self.logger.info("Coordinator starting...")
        
        while True:
            # Process task queue
            ready_tasks = [
                task for task in self.task_queue
                if task.is_ready(list(self.completed_tasks))
            ]
            
            for task in ready_tasks:
                if await self.distribute_task(task):
                    self.task_queue.remove(task)
                    
            # Monitor active tasks
            for task_id, task in list(self.active_tasks.items()):
                if task.status == 'completed':
                    self.completed_tasks.add(task_id)
                    del self.active_tasks[task_id]
                elif task.status == 'failed':
                    # Handle failed tasks
                    self.logger.error(f"Task {task_id} failed: {task.error}")
                    del self.active_tasks[task_id]
                    
            await asyncio.sleep(1)  # Check every second