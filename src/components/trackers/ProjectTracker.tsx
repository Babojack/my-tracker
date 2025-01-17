import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import Note from '../shared/Note';
import Milestone from '../shared/Milestone';
import { db, storage } from '../../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

interface Project {
  id: string;
  name: string;
  status: string;
  imageUrl: string | null;
  milestones: {
    id: string;
    name: string;
    completed: boolean;
  }[];
  notes: {
    id: string;
    text: string;
    timestamp: Timestamp;
  }[];
}

const ProjectTracker: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  // Подписка на обновления из Firestore
  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (projectId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Создаем reference для изображения в Storage
      const imageRef = ref(storage, `project-images/${projectId}/${file.name}`);

      // Загружаем файл
      await uploadBytes(imageRef, file);

      // Получаем URL загруженного файла
      const downloadUrl = await getDownloadURL(imageRef);

      // Обновляем документ в Firestore
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        imageUrl: downloadUrl
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const addNewProject = async () => {
    try {
      await addDoc(collection(db, 'projects'), {
        name: 'New Project',
        status: 'Not Started',
        imageUrl: null,
        milestones: [],
        notes: [],
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const updateProjectName = async (projectId: string, newName: string) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { name: newName });
    } catch (error) {
      console.error('Error updating project name:', error);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      // Также удаляем изображение из Storage, если оно есть
      const project = projects.find(p => p.id === projectId);
      if (project?.imageUrl) {
        const imageRef = ref(storage, project.imageUrl);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const addMilestone = async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const newMilestone = {
        id: Date.now().toString(),
        name: 'New Milestone',
        completed: false
      };

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        milestones: [...project.milestones, newMilestone]
      });
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  const updateMilestone = async (projectId: string, milestoneId: string, newName: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const updatedMilestones = project.milestones.map(m =>
        m.id === milestoneId ? { ...m, name: newName } : m
      );

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { milestones: updatedMilestones });
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const toggleMilestone = async (projectId: string, milestoneId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const updatedMilestones = project.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );

      const updatedStatus = updateProjectStatus({
        ...project,
        milestones: updatedMilestones
      });

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        milestones: updatedMilestones,
        status: updatedStatus
      });
    } catch (error) {
      console.error('Error toggling milestone:', error);
    }
  };

  const deleteMilestone = async (projectId: string, milestoneId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const updatedMilestones = project.milestones.filter(m => m.id !== milestoneId);

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { milestones: updatedMilestones });
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  const addNote = async (projectId: string, noteText: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const newNote = {
        id: Date.now().toString(),
        text: noteText,
        timestamp: Timestamp.now()
      };

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        notes: [newNote, ...project.notes]
      });
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteNote = async (projectId: string, noteId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const updatedNotes = project.notes.filter(n => n.id !== noteId);

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { notes: updatedNotes });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
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
          onClick={addNewProject}
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
                {project.imageUrl ? (
                  <img
                    src={project.imageUrl}
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
                onChange={(e) => updateProjectName(project.id, e.target.value)}
                className="bg-transparent font-semibold text-sm sm:text-base outline-none max-w-[60%]"
              />
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm px-2 py-1 rounded bg-gray-800 whitespace-nowrap">
                  {project.status}
                </span>
                <button
                  onClick={() => deleteProject(project.id)}
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
                  onClick={() => addMilestone(project.id)}
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
                    onToggle={() => toggleMilestone(project.id, milestone.id)}
                    onUpdate={(name) => updateMilestone(project.id, milestone.id, name)}
                    onDelete={() => deleteMilestone(project.id, milestone.id)}
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
                    note={{
                      ...note,
                      timestamp: note.timestamp.toDate().toISOString()
                    }}
                    onDelete={() => deleteNote(project.id, note.id)}
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
