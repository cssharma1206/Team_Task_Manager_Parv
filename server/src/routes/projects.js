const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/projectController');

const router = express.Router();

router.use(auth);

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  createProject
);

router.get('/', getProjects);
router.get('/:projectId', getProject);

router.put(
  '/:projectId',
  [body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty')],
  updateProject
);

router.delete('/:projectId', deleteProject);

router.post('/:projectId/members', addMember);
router.delete('/:projectId/members/:memberId', removeMember);
router.patch('/:projectId/members/:memberId/role', updateMemberRole);

module.exports = router;
