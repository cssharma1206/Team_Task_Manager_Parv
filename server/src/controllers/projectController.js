const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

exports.createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description,
      owner: req.userId,
      members: [{ user: req.userId, role: 'admin' }],
    });

    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');

    res.status(201).json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { 'members.user': req.userId },
      ],
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort('-createdAt');

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const stats = { todo: 0, in_progress: 0, review: 0, done: 0, total: 0 };
        taskCounts.forEach(({ _id, count }) => {
          stats[_id] = count;
          stats.total += count;
        });
        return { ...project.toObject(), stats };
      })
    );

    res.json({ projects: projectsWithStats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProject = async (req, res) => {
  try {
    // Check access BEFORE populating — compare raw ObjectIds to avoid type mismatches
    const rawProject = await Project.findById(req.params.projectId);
    if (!rawProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const uid = req.userId.toString();
    const isOwner = rawProject.owner.toString() === uid;
    const isMember = rawProject.members.some((m) => m.user.toString() === uid);
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Access confirmed — now fetch with population for the response
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAdmin =
      project.owner.toString() === req.userId.toString() ||
      project.members.some(
        (m) => m.user.toString() === req.userId.toString() && m.role === 'admin'
      );
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can update projects' });
    }

    const { name, description } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    await project.save();

    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete a project' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAdmin =
      project.owner.toString() === req.userId.toString() ||
      project.members.some(
        (m) => m.user.toString() === req.userId.toString() && m.role === 'admin'
      );
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with that email' });
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push({ user: user._id, role: role || 'member' });
    await project.save();

    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the owner can remove members' });
    }

    const memberId = req.params.memberId;
    if (memberId === project.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== memberId
    );
    await project.save();

    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or member' });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the owner can change roles' });
    }

    const member = project.members.find(
      (m) => m.user.toString() === req.params.memberId
    );
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    member.role = role;
    await project.save();

    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
