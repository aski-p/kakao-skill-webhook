"""Claude Squad Core Framework"""

from .squad import Squad
from .agent import Agent
from .task import Task
from .coordinator import Coordinator

__all__ = ['Squad', 'Agent', 'Task', 'Coordinator']
__version__ = '1.0.0'