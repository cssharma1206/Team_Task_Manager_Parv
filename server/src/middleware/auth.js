const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const projectRole = (...roles) => {
  return (req, res, next) => {
    const { project } = req;
    if (!project) {
      return res.status(500).json({ message: 'Project not loaded' });
    }

    const isOwner = project.owner.toString() === req.userId.toString();
    if (isOwner) return next();

    const member = project.members.find(
      (m) => m.user.toString() === req.userId.toString()
    );

    if (!member) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

    if (roles.length && !roles.includes(member.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

const loadProject = async (req, res, next) => {
  const Project = require('../models/Project');
  try {
    const projectId = req.params.projectId || req.body.project;
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.userId.toString();
    const isMember = project.members.some(
      (m) => m.user.toString() === req.userId.toString()
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { auth, projectRole, loadProject };
