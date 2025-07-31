"""Base Agent Class for Claude Squad"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import yaml
import logging

class Agent(ABC):
    """Base class for all squad agents"""
    
    def __init__(self, config_path: str):
        """Initialize agent from configuration file"""
        self.logger = logging.getLogger(self.__class__.__name__)
        self.config = self._load_config(config_path)
        self.name = self.config['agent']['name']
        self.role = self.config['agent']['role']
        self.capabilities = self.config['capabilities']
        self.status = 'idle'
        self.current_task = None
        
    def _load_config(self, config_path: str) -> Dict:
        """Load agent configuration from YAML file"""
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    
    @abstractmethod
    async def execute_task(self, task: 'Task') -> Dict[str, Any]:
        """Execute a task and return results"""
        pass
    
    @abstractmethod
    async def validate_task(self, task: 'Task') -> bool:
        """Validate if agent can handle the task"""
        pass
    
    def can_handle(self, task_type: str) -> bool:
        """Check if agent has capability for task type"""
        return task_type in self.capabilities
    
    def get_load(self) -> float:
        """Get current agent load (0.0 - 1.0)"""
        return 0.0 if self.status == 'idle' else 1.0
    
    async def communicate(self, message: Dict[str, Any], recipient: Optional['Agent'] = None):
        """Send message to another agent or broadcast"""
        self.logger.info(f"{self.name} sending message: {message}")
        # Implementation would handle actual communication
        
    def update_status(self, status: str):
        """Update agent status"""
        self.status = status
        self.logger.info(f"{self.name} status updated to: {status}")