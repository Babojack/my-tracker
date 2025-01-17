import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import Note from '../shared/Note';
import Milestone from '../shared/Milestone';
import { PriorityRating, priorityCriteria, sortOptions } from './PriorityRating';
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
import { Goal, Priority } from './types';

const GoalsTracker: React.FC = () => {
  const [sortBy, setSortBy] = useState<string>('default');
  const [goals, setGoals] = useState<Goal[]>([]);

  // Подписка на обновления из Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'goals'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Goal[];
      setGoals(goalsData);
    });

    return () => unsubscribe();
  }, []);

  const calculatePriority = (priority: Priority): number => {
    return priorityCriteria.reduce((sum, criterion) =>
      sum + (priority[criterion.id] * criterion.weight), 0
    );
  };

  const handleImageUpload = async (goalId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Создаем reference для изображения в Storage
      const imageRef = ref(storage, `goal-images/${goalId}/${file.name}`);

      // Загружаем файл
      await uploadBytes(imageRef, file);

      // Получаем URL загруженного файла
      const downloadUrl = await getDownloadURL(imageRef);

      // Обновляем документ в Firestore
      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        imageUrl: downloadUrl
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const addNote = async (goalId: string, noteText: string) => {
    if (!noteText.trim()) return;

    try {
      const goalRef = doc(db, 'goals', goalId);
      const newNote = {
        id: Date.now().toString(),
        text: noteText.trim(),
        timestamp: Timestamp.now()
      };

      await updateDoc(goalRef, {
        notes: [...goals.find(g => g.id === goalId)?.notes || [], newNote]
      });
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const updateGoalStatus = (goal: Goal): string => {
    const hasStarted = goal.milestones.some(m => m.completed);
    const allCompleted = goal.milestones.every(m => m.completed);
    return allCompleted ? 'Completed' : (hasStarted ? 'In Progress' : 'Not Started');
  };

  const updatePriority = async (goalId: string, criteriaId: keyof Priority, value: number) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      await updateDoc(goalRef, {
        priority: { ...goal.priority, [criteriaId]: value }
      });
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const addNewGoal = async () => {
    try {
      const maxOrder = Math.max(...goals.map(g => g.order), -1);
      await addDoc(collection(db, 'goals'), {
        name: 'New Goal',
        deadline: new Date().toISOString().split('T')[0],
        status: 'Not Started',
        imageUrl: null,
        priority: {
          importance: 5,
          urgency: 5,
          effort: 5,
          impact: 5
        },
        milestones: [],
        notes: [],
        order: maxOrder + 1,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoalName = async (goalId: string, newName: string) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, { name: newName });
    } catch (error) {
      console.error('Error updating goal name:', error);
    }
  };

  const updateGoalDeadline = async (goalId: string, newDeadline: string) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, { deadline: newDeadline });
    } catch (error) {
      console.error('Error updating deadline:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      // Удаляем изображение из Storage, если оно есть
      const goal = goals.find(g => g.id === goalId);
      if (goal?.imageUrl) {
        const imageRef = ref(storage, goal.imageUrl);
        await deleteObject(imageRef);
      }

      // Удаляем документ из Firestore
      await deleteDoc(doc(db, 'goals', goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const addMilestone = async (goalId: string) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const newMilestone = {
        id: Date.now().toString(),
        name: 'New Milestone',
        completed: false
      };

      await updateDoc(goalRef, {
        milestones: [...goal.milestones, newMilestone]
      });
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  const updateMilestone = async (goalId: string, milestoneId: string, name: string) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const updatedMilestones = goal.milestones.map(m =>
        m.id === milestoneId ? { ...m, name } : m
      );

      await updateDoc(goalRef, { milestones: updatedMilestones });
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const updatedMilestones = goal.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );

      await updateDoc(goalRef, {
        milestones: updatedMilestones,
        status: updateGoalStatus({ ...goal, milestones: updatedMilestones })
      });
    } catch (error) {
      console.error('Error toggling milestone:', error);
    }
  };

  const deleteMilestone = async (goalId: string, milestoneId: string) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      await updateDoc(goalRef, {
        milestones: goal.milestones.filter(m => m.id !== milestoneId)
      });
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  const deleteNote = async (goalId: string, noteId: string) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      await updateDoc(goalRef, {
        notes: goal.notes.filter(n => n.id !== noteId)
      });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getDisplayedGoals = () => {
    const goalsCopy = [...goals];

    switch (sortBy) {
      case 'priority-high':
        return goalsCopy.sort((a, b) =>
          calculatePriority(b.priority) - calculatePriority(a.priority)
        );
      case 'priority-low':
        return goalsCopy.sort((a, b) =>
          calculatePriority(a.priority) - calculatePriority(b.priority)
        );
      case 'deadline':
        return goalsCopy.sort((a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        );
      case 'name':
        return goalsCopy.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      default:
        return goalsCopy.sort((a, b) => a.order - b.order);
    }
  };

  return (
    <div className="space-y-4 w-full px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold">Goals</h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto bg-gray-800 text-white p-2 rounded hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={addNewGoal}
          className="w-full sm:w-auto p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
          <span className="ml-2 sm:hidden">Add New Goal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {getDisplayedGoals().map(goal => (
          <div key={goal.id} className="bg-gray-700/50 p-3 sm:p-4 rounded-lg space-y-4">
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(goal.id, e)}
                className="hidden"
                id={`goal-${goal.id}`}
              />
              <label
                htmlFor={`goal-${goal.id}`}
                className="cursor-pointer block"
              >
                {goal.imageUrl ? (
                  <img
                    src={goal.imageUrl}
                    alt="Goal"
                    className="w-full h-24 sm:h-32 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-24 sm:h-32 bg-gray-800 rounded flex items-center justify-center">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </label>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
              <input
                type="text"
                value={goal.name}
                onChange={(e) => updateGoalName(goal.id, e.target.value)}
                className="bg-transparent font-semibold outline-none text-sm sm:text-base w-full sm:w-auto"
              />
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={goal.deadline}
                  onChange={(e) => updateGoalDeadline(goal.id, e.target.value)}
                  className="bg-gray-800 p-2 rounded text-sm flex-1 sm:flex-none"
                />
                <span className="text-xs sm:text-sm px-2 py-1 rounded bg-gray-800">{goal.status}</span>
                <span className="text-xs sm:text-sm px-2 py-1 rounded bg-blue-500">
                  Priority: {calculatePriority(goal.priority).toFixed(2)}
                </span>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-1 hover:bg-gray-600 rounded ml-auto sm:ml-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <PriorityRating
              priority={goal.priority}
              onChange={(criteriaId, value) => updatePriority(goal.id, criteriaId, value)}
            />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold">Milestones</h3>
                <button
                  onClick={() => addMilestone(goal.id)}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {goal.milestones.map(milestone => (
                  <Milestone
                    key={milestone.id}
                    milestone={milestone}
                    onToggle={() => toggleMilestone(goal.id, milestone.id)}
                    onUpdate={(name) => updateMilestone(goal.id, milestone.id, name)}
                    onDelete={() => deleteMilestone(goal.id, milestone.id)}
                  />
                ))}
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Add a note and press Enter..."
                className="w-full bg-gray-800 rounded p-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                    addNote(goal.id, (e.target as HTMLInputElement).value.trim());
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <div className="space-y-2 mt-2">
                {goal.notes.map(note => (
                  <Note
                    key={note.id}
                    note={{
                      ...note,
                      timestamp: note.timestamp.toDate().toISOString()
                    }}
                    onDelete={() => deleteNote(goal.id, note.id)}
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

export default GoalsTracker;
