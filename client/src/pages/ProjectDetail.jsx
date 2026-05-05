import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Plus, Users, Shield, UserMinus,
  X, Pencil, Trash2, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
};
const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function TaskModal({ project, members, task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee: task?.assignee?._id || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (task) {
        res = await api.put(`/tasks/${task._id}`, form);
        toast.success('Task updated!');
      } else {
        res = await api.post('/tasks', { ...form, project: project._id });
        toast.success('Task created!');
      }
      onSaved(res.data.task, !!task);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Task title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Describe the task..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving…' : (task ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email, role });
      toast.success('Member added!');
      onAdded(res.data.project);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="member@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(date) {
  if (!date) return false;
  return new Date(date) < new Date() && true;
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [memberModal, setMemberModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');

  const userId = user?._id?.toString();
  const isOwner = project?.owner?._id?.toString() === userId || project?.owner?.toString() === userId;
  const myRole = project?.members?.find(
    m => m.user?._id?.toString() === userId || m.user?.toString() === userId
  )?.role;
  const isAdmin = isOwner || myRole === 'admin';

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/tasks/project/${projectId}`),
    ])
      .then(([pRes, tRes]) => {
        setProject(pRes.data.project);
        setTasks(tRes.data.tasks);
      })
      .catch((err) => {
        if (err.response?.status === 403 || err.response?.status === 404) {
          toast.error('You do not have access to this project');
          navigate('/projects');
        } else {
          toast.error('Failed to load project');
        }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const refreshTasks = () => {
    api.get(`/tasks/project/${projectId}`)
      .then(res => setTasks(res.data.tasks));
  };

  const handleTaskSaved = (task, isEdit) => {
    if (isEdit) {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    } else {
      setTasks(prev => [task, ...prev]);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const res = await api.delete(`/projects/${projectId}/members/${memberId}`);
      setProject(res.data.project);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (memberId, role) => {
    try {
      const res = await api.patch(`/projects/${projectId}/members/${memberId}/role`, { role });
      setProject(res.data.project);
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!project) return <p className="text-center text-gray-500">Project not found.</p>;

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filteredTasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/projects" className="text-gray-400 hover:text-gray-600 mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
          {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
        </div>
        {isAdmin && (
          <button onClick={() => setTaskModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shrink-0">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        {['tasks', 'board', 'members'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tasks List Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-400">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-400">
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <span className="text-sm text-gray-400 self-center">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">No tasks found</p>
              {isAdmin && (
                <button onClick={() => setTaskModal(true)}
                  className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                  Add first task
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {filteredTasks.map(task => (
                <div key={task._id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-800 truncate">{task.title}</p>
                      {task.dueDate && isOverdue(task.dueDate) && task.status !== 'done' && (
                        <span className="shrink-0 flex items-center gap-0.5 text-xs text-red-500">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                      {task.assignee && <span>👤 {task.assignee.name}</span>}
                      {task.dueDate && (
                        <span className={isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-400' : ''}>
                          📅 {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                      {STATUS_LABEL[task.status]}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition">
                      <button onClick={() => { setEditTask(task); setTaskModal(true); }}
                        className="p-1 text-gray-400 hover:text-indigo-600 rounded">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDeleteTask(task._id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Board Tab */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.map(status => (
            <div key={status} className="bg-gray-100 rounded-xl p-3 min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[status]}`}>
                  {STATUS_LABEL[status]}
                </h3>
                <span className="text-xs text-gray-400">{tasksByStatus[status].length}</span>
              </div>
              <div className="space-y-2">
                {tasksByStatus[status].map(task => (
                  <div key={task._id}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-indigo-200 cursor-pointer group"
                    onClick={() => { setEditTask(task); setTaskModal(true); }}>
                    <p className="text-sm font-medium text-gray-800 mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                      {task.assignee && (
                        <span className="text-xs text-gray-400 truncate ml-1">{task.assignee.name}</span>
                      )}
                    </div>
                    {task.dueDate && (
                      <p className={`text-xs mt-1 ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-400' : 'text-gray-400'}`}>
                        📅 {formatDate(task.dueDate)}
                      </p>
                    )}
                  </div>
                ))}
                {isAdmin && (
                  <button onClick={() => setTaskModal(true)}
                    className="w-full text-xs text-gray-400 hover:text-indigo-600 py-2 border border-dashed border-gray-300 rounded-lg hover:border-indigo-300 transition">
                    + Add task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" /> Team Members
            </h2>
            {isAdmin && (
              <button onClick={() => setMemberModal(true)}
                className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> Add Member
              </button>
            )}
          </div>
          <div className="space-y-3">
            {project.members.map(member => {
              const memberId = member.user._id?.toString() || member.user?.toString();
              const isThisOwner = memberId === (project.owner?._id?.toString() || project.owner?.toString());
              return (
              <div key={memberId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-medium text-sm shrink-0">
                  {member.user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {member.user.name}
                    {isThisOwner && (
                      <span className="ml-2 text-xs text-amber-600 font-normal">(You own this project)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Always show Owner badge for the owner — no dropdown ever */}
                  {isThisOwner ? (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                      <Shield className="w-3 h-3" /> Owner
                    </span>
                  ) : isOwner ? (
                    /* Current user is the owner → show editable dropdown for non-owners */
                    <select
                      value={member.role}
                      onChange={e => handleRoleChange(memberId, e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    /* Non-owner → static badge only */
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      member.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.role === 'admin' && <Shield className="w-3 h-3" />}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  )}
                  {/* Remove button — only owner can remove, and can't remove themselves */}
                  {isOwner && !isThisOwner && (
                    <button onClick={() => handleRemoveMember(memberId)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {taskModal && (
        <TaskModal
          project={project}
          members={project.members}
          task={editTask}
          onClose={() => { setTaskModal(false); setEditTask(null); }}
          onSaved={handleTaskSaved}
        />
      )}
      {memberModal && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setMemberModal(false)}
          onAdded={setProject}
        />
      )}
    </div>
  );
}
