const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, status, priority, assignee, dueDate, project } = req.body;

    const proj = await Project.findById(project);
    if (!proj) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember =
      proj.owner.toString() === req.userId.toString() ||
      proj.members.some((m) => m.user.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (assignee) {
      const assigneeIsMember =
        proj.owner.toString() === assignee ||
        proj.members.some((m) => m.user.toString() === assignee);
      if (!assigneeIsMember) {
        return res.status(400).json({ message: 'Assignee must be a project member' });
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      project,
      assignee: assignee || null,
      createdBy: req.userId,
      dueDate: dueDate || null,
    });

    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignee, sort } = req.query;

    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    let sortOption = { createdAt: -1 };
    if (sort === 'dueDate') sortOption = { dueDate: 1 };
    if (sort === 'priority') sortOption = { priority: 1 };

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort(sortOption);

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isMember =
      project.owner.toString() === req.userId.toString() ||
      project.members.some((m) => m.user.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, status, priority, assignee, dueDate } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isAdmin =
      project.owner.toString() === req.userId.toString() ||
      project.members.some(
        (m) => m.user.toString() === req.userId.toString() && m.role === 'admin'
      );
    const isCreator = task.createdBy.toString() === req.userId.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Only admins or the task creator can delete tasks' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { 'members.user': req.userId },
      ],
    });

    const projectIds = projects.map((p) => p._id);

    const [myTasks, overdueTasks, statusCounts, priorityCounts, recentTasks] =
      await Promise.all([
        Task.find({ assignee: req.userId, status: { $ne: 'done' } })
          .populate('project', 'name')
          .sort('-createdAt')
          .limit(10),
        Task.find({
          project: { $in: projectIds },
          dueDate: { $lt: new Date() },
          status: { $ne: 'done' },
        })
          .populate('assignee', 'name email')
          .populate('project', 'name')
          .sort('dueDate'),
        Task.aggregate([
          { $match: { project: { $in: projectIds } } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Task.aggregate([
          { $match: { project: { $in: projectIds } } },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
        Task.find({ project: { $in: projectIds } })
          .populate('assignee', 'name email')
          .populate('project', 'name')
          .sort('-createdAt')
          .limit(5),
      ]);

    const stats = {
      totalProjects: projects.length,
      status: { todo: 0, in_progress: 0, review: 0, done: 0 },
      priority: { low: 0, medium: 0, high: 0, urgent: 0 },
    };
    statusCounts.forEach(({ _id, count }) => { stats.status[_id] = count; });
    priorityCounts.forEach(({ _id, count }) => { stats.priority[_id] = count; });
    stats.totalTasks = Object.values(stats.status).reduce((a, b) => a + b, 0);

    res.json({ stats, myTasks, overdueTasks, recentTasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
