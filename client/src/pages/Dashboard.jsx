import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, CheckCircle2, Clock, AlertCircle,
  ListTodo, FolderKanban, ArrowRight, AlertTriangle
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

const STATUS_LABEL = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const { stats, myTasks, overdueTasks, recentTasks } = data || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-indigo-600" />
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Welcome back, <span className="font-medium text-gray-700">{user?.name}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Projects" value={stats?.totalProjects ?? 0} icon={FolderKanban} color="bg-indigo-100 text-indigo-600" />
        <StatCard label="Total Tasks" value={stats?.totalTasks ?? 0} icon={ListTodo} color="bg-blue-100 text-blue-600" />
        <StatCard label="In Progress" value={stats?.status?.in_progress ?? 0} icon={Clock} color="bg-yellow-100 text-yellow-600" />
        <StatCard label="Completed" value={stats?.status?.done ?? 0} icon={CheckCircle2} color="bg-green-100 text-green-600" />
      </div>

      {/* Task status breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Task Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['todo', 'in_progress', 'review', 'done'].map(s => (
            <div key={s} className={`rounded-lg p-4 text-center ${STATUS_COLORS[s]}`}>
              <p className="text-2xl font-bold">{stats?.status?.[s] ?? 0}</p>
              <p className="text-xs font-medium mt-1">{STATUS_LABEL[s]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Overdue Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Overdue Tasks
            {overdueTasks?.length > 0 && (
              <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {overdueTasks.length}
              </span>
            )}
          </h2>
          {overdueTasks?.length === 0 ? (
            <p className="text-sm text-gray-400">No overdue tasks 🎉</p>
          ) : (
            <ul className="space-y-3">
              {overdueTasks.map(task => (
                <li key={task._id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-red-500 mt-0.5">
                      Due {formatDate(task.dueDate)} · {task.project?.name}
                    </p>
                  </div>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-indigo-500" />
            My Active Tasks
          </h2>
          {myTasks?.length === 0 ? (
            <p className="text-sm text-gray-400">No tasks assigned to you</p>
          ) : (
            <ul className="space-y-3">
              {myTasks.map(task => (
                <li key={task._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{task.project?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Recent Tasks</h2>
          <Link to="/projects" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
            All Projects <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentTasks?.length === 0 ? (
          <p className="text-sm text-gray-400">No tasks yet. Create a project to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Project</th>
                  <th className="pb-2 font-medium">Assignee</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTasks.map(task => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-800 max-w-[200px] truncate">{task.title}</td>
                    <td className="py-2.5 text-gray-500">{task.project?.name}</td>
                    <td className="py-2.5 text-gray-500">{task.assignee?.name || '—'}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[task.status]}`}>
                        {STATUS_LABEL[task.status]}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
