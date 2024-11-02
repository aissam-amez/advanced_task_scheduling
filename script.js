function assignTasksWithPriorityAndDependencies(developers, tasks) {
  const taskMap = new Map();
  tasks.forEach(task => taskMap.set(task.taskName, task));

  const dependencyCount = new Map();
  const dependencyGraph = new Map();

  tasks.forEach(task => {
    dependencyCount.set(task.taskName, 0);
    dependencyGraph.set(task.taskName, []);
  });

  tasks.forEach(task => {
    task.dependencies.forEach(dependency => {
      dependencyGraph.get(dependency).push(task.taskName);
      dependencyCount.set(task.taskName, dependencyCount.get(task.taskName) + 1);
    });
  });

  const readyTasks = tasks
    .filter(task => dependencyCount.get(task.taskName) === 0)
    .sort((a, b) => b.priority - a.priority);

  const orderedTasks = [];

  while (readyTasks.length > 0) {
    const task = readyTasks.shift();
    orderedTasks.push(task);

    dependencyGraph.get(task.taskName).forEach(dependentTaskName => {
      const updatedCount = dependencyCount.get(dependentTaskName) - 1;
      dependencyCount.set(dependentTaskName, updatedCount);

      if (updatedCount === 0) {
        readyTasks.push(taskMap.get(dependentTaskName));
      }
    });

    readyTasks.sort((a, b) => b.priority - a.priority);
  }

  const developerGroups = {};
  developers.forEach(dev => {
    if (!developerGroups[dev.preferredTaskType]) {
      developerGroups[dev.preferredTaskType] = [];
    }
    developerGroups[dev.preferredTaskType].push({ ...dev, tasks: [], totalHours: 0 });
  });

  for (const taskType in developerGroups) {
    developerGroups[taskType].sort((a, b) => b.skillLevel - a.skillLevel);
  }

  const unassignedTasks = [];
  const completedTasks = new Set();

  orderedTasks.forEach(task => {
    const availableDevs = developerGroups[task.taskType]?.filter(
      dev => dev.skillLevel >= task.difficulty && dev.maxHours >= dev.totalHours + task.hoursRequired
    ) || [];

    if (availableDevs.length > 0 && task.dependencies.every(dep => completedTasks.has(dep))) {
      availableDevs.sort((a, b) => a.totalHours - b.totalHours || a.skillLevel - b.skillLevel);
      const chosenDev = availableDevs[0];
      chosenDev.tasks.push(task.taskName);
      chosenDev.totalHours += task.hoursRequired;
      completedTasks.add(task.taskName);
    } else {
      unassignedTasks.push(task.taskName);
    }
  });

  const developerAssignments = Object.values(developerGroups).flat();

  return {
    developers: developerAssignments,
    unassignedTasks,
  };
}
