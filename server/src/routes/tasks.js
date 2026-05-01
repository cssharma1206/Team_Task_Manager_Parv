const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  getDashboard,
} = require('../controllers/taskController');

const router = express.Router();

router.use(auth);

router.get('/dashboard', getDashboard);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project').notEmpty().withMessage('Project ID is required'),
  ],
  createTask
);

router.get('/project/:projectId', getProjectTasks);
router.get('/:taskId', getTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

module.exports = router;
