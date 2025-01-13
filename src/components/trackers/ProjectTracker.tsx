import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Note from '../shared/Note';
import Milestone from '../shared/Milestone';

interface Project {
  id: number;
  name: string;
  status: string;
  image: string | null;
  milestones: {
    id: number;
    name: string;
    completed: boolean;
  }[];
  notes: {
    id: number;
    text: string;
    timestamp: string;
  }[];
}

const ProjectTracker: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([{
    id: 1,
    name: 'Project 1',
    status: 'Not Started',
    image: null,
    milestones: [
      { id: 1, name: 'Research', completed: false },
      { id: 2, name: 'Development', completed: false }
    ],
    notes: []
  }]);

  const handleImageUpload = (projectId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjects(projects.map(p =>
          p.id === projectId ? {...p, image: reader.result as string} : p
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const addNote = (projectId: number, note: string) => {
    setProjects(projects.map(p =>
      p.id === projectId ? {
        ...p,
        notes: [{
          id: Date.now(),
          text: note,
          timestamp: new Date().toISOString()
        }, ...p.notes]
      } : p
    ));
  };

  const updateProjectStatus = (project: Project) => {
    const hasStarted = project.milestones.some(m => m.completed);
    const allCompleted = project.milestones.every(m => m.completed);
    return allCompleted ? 'Completed' : (hasStarted ? 'In Progress' : 'Not Started');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Projects</h2>
        <button
          onClick={() => setProjects([...projects, {
            id: Date.now(),
            name: 'New Project',
            status: 'Not Started',
            image: null,
            milestones: [],
            notes: []
          }])}
          className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-gray-700/50 p-3 sm:p-4 rounded-lg flex flex-col">
            <div className="relative mb-3 sm:mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(project.id, e)}
                className="hidden"
                id={`project-${project.id}`}
              />
              <label
                htmlFor={`project-${project.id}`}
                className="cursor-pointer block"
              >
                {project.image ? (
                  <img
                    src={project.image}
                    alt="Project"
                    className="w-full h-24 sm:h-32 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-24 sm:h-32 bg-gray-800 rounded flex items-center justify-center">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  </div>
                )}
              </label>
            </div>

            <div className="flex justify-between items-center mb-3">
              <input
                type="text"
                value={project.name}
                onChange={(e) => setProjects(projects.map(p =>
                  p.id === project.id ? {...p, name: e.target.value} : p
                ))}
                className="bg-transparent font-semibold text-sm sm:text-base outline-none max-w-[60%]"
              />
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm px-2 py-1 rounded bg-gray-800 whitespace-nowrap">{project.status}</span>
                <button
                  onClick={() => setProjects(projects.filter(p => p.id !== project.id))}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs sm:text-sm font-semibold">Milestones</h3>
                <button
                  onClick={() => setProjects(projects.map(p =>
                    p.id === project.id ? {
                      ...p,
                      milestones: [...p.milestones, {
                        id: Date.now(),
                        name: 'New Milestone',
                        completed: false
                      }]
                    } : p
                  ))}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
              <div className="max-h-28 sm:max-h-32 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {project.milestones.map(milestone => (
                  <Milestone
                    key={milestone.id}
                    milestone={milestone}
                    onToggle={() => {
                      const updatedProject = {
                        ...project,
                        milestones: project.milestones.map(m =>
                          m.id === milestone.id ? {...m, completed: !m.completed} : m
                        )
                      };
                      updatedProject.status = updateProjectStatus(updatedProject);
                      setProjects(projects.map(p =>
                        p.id === project.id ? updatedProject : p
                      ));
                    }}
                    onUpdate={(name) => setProjects(projects.map(p => ({
                      ...p,
                      milestones: p.id === project.id
                        ? p.milestones.map(m =>
                            m.id === milestone.id ? {...m, name} : m
                          )
                        : p.milestones
                    })))}
                    onDelete={() => setProjects(projects.map(p => ({
                      ...p,
                      milestones: p.id === project.id
                        ? p.milestones.filter(m => m.id !== milestone.id)
                        : p.milestones
                    })))}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[120px]">
              <input
                type="text"
                placeholder="Add a note and press Enter..."
                className="w-full bg-gray-800 rounded p-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                    addNote(project.id, (e.target as HTMLInputElement).value.trim());
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <div className="flex-1 max-h-28 sm:max-h-32 overflow-y-auto space-y-2 mt-2 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {project.notes.map(note => (
                  <Note
                    key={note.id}
                    note={note}
                    onDelete={() => setProjects(projects.map(p => ({
                      ...p,
                      notes: p.id === project.id
                        ? p.notes.filter(n => n.id !== note.id)
                        : p.notes
                    })))}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectTracker;
