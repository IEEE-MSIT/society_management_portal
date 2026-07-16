import React, { useState, useEffect } from 'react';
import AnimatedPage from '../components/AnimatedPage.js';
import { useForm } from 'react-hook-form';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  FolderGit2,
  KanbanSquare,
  Plus,
  Link as LinkIcon,
  CheckSquare,
  Clock,
  User,
  Users,
  ChevronRight,
  TrendingUp,
  Loader2,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  githubUrl: string | null;
  demoUrl: string | null;
  techStack: string;
  status: string;
  members: Array<{
    id: string;
    role: string;
    member: {
      firstName: string;
      lastName: string;
    };
  }>;
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignee: {
    firstName: string;
    lastName: string;
  } | null;
}

interface ProjectDetail extends Project {
  milestones: Milestone[];
  tasks: Task[];
}

const Projects: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [recruitmentModalOpen, setRecruitmentModalOpen] = useState(false);

  const { register: projectReg, handleSubmit: projectSub, reset: projectReset } = useForm<{
    title: string;
    description: string;
    githubUrl: string;
    demoUrl: string;
    techStack: string;
  }>();

  const { register: taskReg, handleSubmit: taskSub, reset: taskReset } = useForm<{
    title: string;
    description: string;
    priority: string;
    assigneeId: string;
  }>();

  const { register: recruitReg, handleSubmit: recruitSub, reset: recruitReset } = useForm<{
    memberId: string;
    role: string;
  }>();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      if (res.data?.success) {
        setProjects(res.data.projects);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load projects list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (id: string) => {
    try {
      const res = await api.get(`/projects/${id}`);
      if (res.data?.success) {
        setActiveProject(res.data.project);
      }
    } catch (err: any) {
      showToast('Failed to load project board details.', 'error');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (data: any) => {
    try {
      const res = await api.post('/projects', data);
      if (res.data?.success) {
        showToast('New project registered in society directory.', 'success');
        setModalOpen(false);
        projectReset();
        fetchProjects();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to register project.', 'error');
    }
  };

  const handleCreateTask = async (data: any) => {
    if (!activeProject) return;
    try {
      const res = await api.post(`/projects/${activeProject.id}/tasks`, data);
      if (res.data?.success) {
        showToast('Kanban card created.', 'success');
        setTaskModalOpen(false);
        taskReset();
        fetchProjectDetails(activeProject.id);
      }
    } catch (err: any) {
      showToast('Failed to create task.', 'error');
    }
  };

  const handleRecruitTeammate = async (data: any) => {
    if (!activeProject) return;
    try {
      const res = await api.post(`/projects/${activeProject.id}/members`, data);
      if (res.data?.success) {
        showToast('Teammate joined the project!', 'success');
        setRecruitmentModalOpen(false);
        recruitReset();
        fetchProjectDetails(activeProject.id);
      }
    } catch (err: any) {
      showToast('Failed to recruit teammate.', 'error');
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    if (!activeProject) return;
    try {
      const res = await api.patch(`/projects/tasks/${taskId}`, { status: newStatus });
      if (res.data?.success) {
        showToast('Kanban task status updated.', 'success');
        fetchProjectDetails(activeProject.id);
      }
    } catch (err: any) {
      showToast('Failed to move task.', 'error');
    }
  };

  return (
    <AnimatedPage>
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Project Collaboration Board
          </h1>
          <p className="text-sm text-slate-400">
            Sprint planners, Kanban status indicators, and git repository links.
          </p>
        </div>
        {activeProject ? (
          <button
            onClick={() => setActiveProject(null)}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
          >
            ← Back to Directory
          </button>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(79,70,229,0.35)]"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading collaboration space...</p>
        </div>
      ) : activeProject ? (
        /* ==========================================
           1. PROJECT DETAIL BOARD (KANBAN)
           ========================================== */
        <div className="space-y-8 animate-fadeIn">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
              <FolderGit2 className="h-10 w-10 text-indigo-400" />
              <div>
                <h3 className="text-lg font-black text-slate-100">{activeProject.title}</h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Status: {activeProject.status}
                </span>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-400" />
                <span className="text-xs text-slate-350">Teammates:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">{activeProject.members.length}</span>
                <button
                  onClick={() => setRecruitmentModalOpen(true)}
                  className="bg-indigo-650/20 hover:bg-indigo-600/30 text-indigo-400 p-1.5 rounded-lg border border-indigo-500/20 cursor-pointer"
                  title="Add Teammate"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-emerald-400" />
                <span className="text-xs text-slate-350">Kanban tasks:</span>
              </div>
              <span className="font-bold text-slate-100 text-sm">{activeProject.tasks.length}</span>
            </div>
          </div>

          {/* Links Row */}
          <div className="flex gap-4">
            {activeProject.githubUrl && (
              <a
                href={activeProject.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-950/60 hover:bg-slate-900 border border-slate-850 px-4 py-2 rounded-xl text-xs flex items-center gap-2 text-slate-300 hover:text-slate-200 transition-colors"
              >
                <FolderGit2 className="h-4 w-4" />
                View Repository
              </a>
            )}
            {activeProject.demoUrl && (
              <a
                href={activeProject.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-950/60 hover:bg-slate-900 border border-slate-850 px-4 py-2 rounded-xl text-xs flex items-center gap-2 text-slate-300 hover:text-slate-200 transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                Live Demo
              </a>
            )}
          </div>

          {/* Kanban Section Header */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-slate-200 flex items-center gap-2">
              <KanbanSquare className="h-5 w-5 text-indigo-400" />
              Task Sprint Board
            </h2>
            <button
              onClick={() => setTaskModalOpen(true)}
              className="bg-indigo-650/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/25 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </button>
          </div>

          {/* Kanban Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const).map((col) => {
              const colTasks = activeProject.tasks.filter((t) => t.status === col);
              return (
                <div key={col} className="glass-panel p-4 rounded-2xl border border-slate-850 bg-slate-950/20 flex flex-col gap-3 min-h-[400px]">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                      {col.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-black">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-0.5">
                    {colTasks.map((t) => (
                      <div
                        key={t.id}
                        className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/80 space-y-3 shadow-md hover:border-slate-800 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-slate-250 text-xs leading-normal">{t.title}</h4>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                            t.priority === 'URGENT' || t.priority === 'HIGH'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {t.priority}
                          </span>
                        </div>

                        {t.description && <p className="text-[10px] text-slate-400 leading-normal">{t.description}</p>}

                        <div className="flex justify-between items-center border-t border-slate-850/60 pt-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-600" />
                            {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Unassigned'}
                          </span>

                          {/* Quick Change SelectDropdown */}
                          <select
                            value={t.status}
                            onChange={(e) => handleMoveTask(t.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[9px] text-slate-300 focus:outline-none cursor-pointer"
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="IN_REVIEW">IN REVIEW</option>
                            <option value="DONE">DONE</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ==========================================
           2. PROJECTS DIRECTORY LISTING
           ========================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full glass-panel p-20 rounded-2xl border border-slate-800 text-center">
              <FolderGit2 className="h-10 w-10 text-slate-700 mx-auto mb-4" />
              <p className="text-sm text-slate-500">No active projects registered in society.</p>
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => fetchProjectDetails(proj.id)}
                className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-slate-200 text-base leading-tight group-hover:text-indigo-400 transition-colors">
                      {proj.title}
                    </h3>
                    <span className="text-[9px] font-bold bg-indigo-550/15 border border-indigo-500/30 text-indigo-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {proj.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-normal line-clamp-3">
                    {proj.description}
                  </p>
                </div>

                <div className="border-t border-slate-850 pt-4 flex justify-between items-center text-[10px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4.5 w-4.5 text-slate-650" />
                    {proj.members.length} Contributor{proj.members.length !== 1 && 's'}
                  </span>
                  <span className="flex items-center gap-1 hover:text-slate-350">
                    Sprint Workspace <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==========================================
         MODALS (Add Project, Add Task, Recruit)
         ========================================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-lg w-full space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-250">Create New Project Workspace</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-400 cursor-pointer">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={projectSub(handleCreateProject)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  {...projectReg('title')}
                  placeholder="e.g. Society Mobile Companion App"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  required
                  {...projectReg('description')}
                  placeholder="Write clear project objectives and guidelines..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">GitHub URL</label>
                  <input
                    type="url"
                    {...projectReg('githubUrl')}
                    placeholder="https://github.com/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Demo URL</label>
                  <input
                    type="url"
                    {...projectReg('demoUrl')}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Technology Stack</label>
                <input
                  type="text"
                  required
                  {...projectReg('techStack')}
                  placeholder="React, TypeScript, Node.js, SQLite"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer">
                Initialize Workspace
              </button>
            </form>
          </div>
        </div>
      )}

      {taskModalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-250">Create Kanban Task</h2>
              <button onClick={() => setTaskModalOpen(false)} className="text-slate-500 hover:text-slate-400 cursor-pointer">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={taskSub(handleCreateTask)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  {...taskReg('title')}
                  placeholder="e.g. Set up JWT session middleware"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Task Description</label>
                <textarea
                  {...taskReg('description')}
                  placeholder="Write clear task breakdown instructions..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    {...taskReg('priority')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Assignee Member ID</label>
                  <input
                    type="text"
                    {...taskReg('assigneeId')}
                    placeholder="UUID of society member"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer">
                Create Kanban Card
              </button>
            </form>
          </div>
        </div>
      )}

      {recruitmentModalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-250">Recruit Member to Project</h2>
              <button onClick={() => setRecruitmentModalOpen(false)} className="text-slate-500 hover:text-slate-400 cursor-pointer">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={recruitSub(handleRecruitTeammate)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Society Member ID</label>
                <input
                  type="text"
                  required
                  {...recruitReg('memberId')}
                  placeholder="Enter member's database UUID"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Project Role</label>
                <select
                  required
                  {...recruitReg('role')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                >
                  <option value="DEVELOPER">DEVELOPER</option>
                  <option value="DESIGNER">DESIGNER</option>
                  <option value="LEAD">LEAD DEVELOPER</option>
                  <option value="PR">PR & CONTENT WRITER</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer">
                Add Contributor
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </AnimatedPage>
  );
};

export default Projects;
