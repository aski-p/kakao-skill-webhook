"""Example usage of Claude Squad"""

import asyncio
import logging
from src.core import Squad, Task

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def main():
    """Example of using Claude Squad"""
    
    # Create squad instance
    squad = Squad()
    
    # Initialize the squad
    await squad.initialize()
    
    # Submit individual tasks
    task1 = Task(
        type='analyze',
        description='Analyze the current codebase structure',
        priority='high'
    )
    task_id1 = await squad.submit_task(task1)
    print(f"Submitted task: {task_id1}")
    
    # Submit a complete workflow
    workflow_ids = await squad.submit_workflow(
        'feature_development',
        inputs={
            'design': {
                'feature_name': 'User Authentication',
                'requirements': ['OAuth2', 'JWT', 'MFA']
            }
        }
    )
    print(f"Submitted workflow with tasks: {workflow_ids}")
    
    # Get squad status
    status = await squad.get_status()
    print(f"Squad status: {status}")
    
    # Start the squad in the background
    squad_task = asyncio.create_task(squad.start())
    
    # Wait a bit for demonstration
    await asyncio.sleep(5)
    
    # Get updated status
    status = await squad.get_status()
    print(f"Updated squad status: {status}")
    
    # Stop the squad
    squad.stop()
    squad_task.cancel()
    
    try:
        await squad_task
    except asyncio.CancelledError:
        print("Squad stopped successfully")

if __name__ == "__main__":
    asyncio.run(main())