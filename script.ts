// Define the Developer type
interface Developer {
  name: string;
  skillLevel: number;        // Skill level from 1 to 10
  maxHours: number;          // Maximum hours the developer can work in a week
  preferredTaskType: string; // Type of task the developer prefers (e.g., 'feature', 'bug', 'refactor')
}

// Define the Task type
interface Task {
  taskName: string;
  difficulty: number;        // Difficulty from 1 to 10
  hoursRequired: number;     // Estimated hours needed to complete the task
  taskType: string;          // Type of task ('feature', 'bug', 'refactor')
  priority: number;          // Priority from 1 to 5
  dependencies: string[];    // List of tasks that must be completed before this task
}

// Define the DeveloperAssignment type, extending Developer to include assigned tasks and total work hours
interface DeveloperAssignment extends Developer {
  tasks: string[];           // List of task names assigned to the developer
  totalHours: number;        // Total work hours assigned to the developer
}

// Define the function return type
interface TaskAssignmentResult {
  developers: DeveloperAssignment[]; // List of developers with assigned tasks and hours
  unassignedTasks: string[];         // List of task names that could not be assigned
}

function assignTasksWithPriorityAndDependencies(developers: Developer[], tasks: Task[]): TaskAssignmentResult {
  // Step 1: Sort tasks by priority and dependencies as before
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.taskName, task));

  const inDegrees = new Map<string, number>();
  const adjustedList = new Map<string, string[]>();
  tasks.forEach(task => {
    inDegrees.set(task.taskName, 0);
    adjustedList.set(task.taskName, []);
  });
  
  tasks.forEach(task => {
    task.dependencies.forEach(dep => {
      adjustedList.get(dep)?.push(task.taskName);
      inDegrees.set(task.taskName, (inDegrees.get(task.taskName) || 0) + 1);
    });
  });

  const taskQueue = tasks
    .filter(task => inDegrees.get(task.taskName) === 0)
    .sort((a, b) => b.priority - a.priority);

  const sortedTasks: Task[] = [];
  while (taskQueue.length > 0) {
    const task = taskQueue.shift()!;
    sortedTasks.push(task);

    adjustedList.get(task.taskName)?.forEach(dependentTaskName => {
      const inDegree = inDegrees.get(dependentTaskName)! - 1;
      inDegrees.set(dependentTaskName, inDegree);
      if (inDegree === 0) {
        const dependentTask = taskMap.get(dependentTaskName)!;
        taskQueue.push(dependentTask);
      }
    });

    taskQueue.sort((a, b) => b.priority - a.priority);
  }

  // Step 2: Sort developers by skill level for each preferred task type
  const developerGroups: { [taskType: string]: DeveloperAssignment[] } = {};
  developers.forEach(dev => {
    if (!developerGroups[dev.preferredTaskType]) {
      developerGroups[dev.preferredTaskType] = [];
    }
    developerGroups[dev.preferredTaskType].push({ ...dev, tasks: [], totalHours: 0 });
  });
  for (const taskType in developerGroups) {
    developerGroups[taskType].sort((a, b) => b.skillLevel - a.skillLevel);
  }

  const unassignedTasks: string[] = [];
  const completedTasks = new Set<string>();

  // Step 3: Assign tasks with balanced distribution and skill-based ordering
  for (const task of sortedTasks) {
    const suitableDevs = developerGroups[task.taskType]?.filter(
      dev => dev.skillLevel >= task.difficulty && dev.maxHours >= dev.totalHours + task.hoursRequired
    ) || [];

    if (suitableDevs.length > 0 && task.dependencies.every(dep => completedTasks.has(dep))) {
      // Assign the task to the least-loaded suitable developer with lowest skill first
      suitableDevs.sort((a, b) => a.totalHours - b.totalHours || a.skillLevel - b.skillLevel);
      const assignedDev = suitableDevs[0];
      assignedDev.tasks.push(task.taskName);
      assignedDev.totalHours += task.hoursRequired;
      completedTasks.add(task.taskName);
    } else {
      unassignedTasks.push(task.taskName);
    }
  }

  // Gather developer assignments into a single list
  const developerAssignments = Object.values(developerGroups).flat();

  return {
    developers: developerAssignments,
    unassignedTasks,
  };
}

// Example usage
const developers: Developer[] = [
  { name: 'Alice', skillLevel: 7, maxHours: 40, preferredTaskType: 'feature' },
  { name: 'Bob', skillLevel: 9, maxHours: 30, preferredTaskType: 'bug' },
  { name: 'Charlie', skillLevel: 5, maxHours: 35, preferredTaskType: 'refactor' },
];

const tasks: Task[] = [
  { taskName: 'Feature A', difficulty: 7, hoursRequired: 15, taskType: 'feature', priority: 4, dependencies: [] },
  { taskName: 'Bug Fix B', difficulty: 5, hoursRequired: 10, taskType: 'bug', priority: 5, dependencies: [] },
  { taskName: 'Refactor C', difficulty: 9, hoursRequired: 25, taskType: 'refactor', priority: 3, dependencies: ['Bug Fix B'] },
  { taskName: 'Optimization D', difficulty: 6, hoursRequired: 20, taskType: 'feature', priority: 2, dependencies: [] },
  { taskName: 'Upgrade E', difficulty: 8, hoursRequired: 15, taskType: 'feature', priority: 5, dependencies: ['Feature A'] },
];

console.log(assignTasksWithPriorityAndDependencies(developers, tasks));
