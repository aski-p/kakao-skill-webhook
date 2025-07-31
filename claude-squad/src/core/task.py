"""Task Class for Claude Squad"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid

@dataclass
class Task:
    """Represents a task in the squad system"""
    
    type: str
    description: str
    priority: str = 'medium'  # low, medium, high, critical
    inputs: Dict[str, Any] = field(default_factory=dict)
    outputs: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)
    status: str = 'pending'  # pending, assigned, in_progress, completed, failed
    assigned_to: Optional[str] = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    
    def mark_assigned(self, agent_name: str):
        """Mark task as assigned to an agent"""
        self.status = 'assigned'
        self.assigned_to = agent_name
        
    def mark_started(self):
        """Mark task as started"""
        self.status = 'in_progress'
        self.started_at = datetime.now()
        
    def mark_completed(self, outputs: Dict[str, Any]):
        """Mark task as completed with outputs"""
        self.status = 'completed'
        self.outputs = outputs
        self.completed_at = datetime.now()
        
    def mark_failed(self, error: str):
        """Mark task as failed with error"""
        self.status = 'failed'
        self.error = error
        self.completed_at = datetime.now()
        
    def get_duration(self) -> Optional[float]:
        """Get task duration in seconds"""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None
    
    def is_ready(self, completed_tasks: List[str]) -> bool:
        """Check if all dependencies are satisfied"""
        return all(dep in completed_tasks for dep in self.dependencies)