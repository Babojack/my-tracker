import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Note from '../shared/Note';
import Milestone from '../shared/Milestone';

interface Priority {
  importance: number;
  urgency: number;
  effort: number;
  impact: number;
}

interface Goal {
  id: number;
  name: string;
  deadline: string;
  status: string;
  image: string | null;
  priority: Priority;
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
  order: number;
}

interface PriorityCriterion {
  id: keyof Priority;
  name: string;
  weight: number;
}

interface SortOption {
  value: string;
  label: string;
}

const priorityCriteria: PriorityCriterion[] = [
  { id: 'importance', name: 'Importance', weight: 0.4 },
  { id: 'urgency', name: 'Urgency', weight: 0.3 },
  { id: 'effort', name: 'Complexity', weight: 0.2 },
  { id: 'impact', name: 'Impact', weight: 0.1 }
];

const sortOptions: SortOption[] = [
  { value: 'default', label: 'default' },
  { value: 'priority-high', label: 'priority-high' },
  { value: 'priority-low', label: 'priority-low' },
  { value: 'deadline', label: 'deadline' },
  { value: 'name', label: 'name' }
];

interface PriorityRatingProps {
  priority: Priority;
  onChange: (criteriaId: keyof Priority, value: number) => void;
}

const PriorityRating: React.FC<PriorityRatingProps> = ({ priority, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {priorityCriteria.map(criterion => (
      <div key={criterion.id} className="bg-gray-800/50 p-3 rounded">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs sm:text-sm">{criterion.name}</span>
          <span className="text-xs text-gray-400">{criterion.weight * 100}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs">1</span>
          <input
            type="range"
            min="1"
            max="10"
            value={priority[criterion.id]}
            onChange={(e) => onChange(criterion.id, parseInt(e.target.value))}
            className="flex-1 h-1 sm:h-2"
          />
          <span className="text-xs">10</span>
        </div>
        <div className="text-center text-xs text-gray-400 mt-1">
          {priority[criterion.id]}
        </div>
      </div>
    ))}
  </div>
);

const GoalsTracker: React.FC = () => {
  const [sortBy, setSortBy] = useState<string>('default');
  const [goals, setGoals] = useState<Goal[]>([{
    id: 1,
    name: 'Goal 1',
    deadline: new Date().toISOString().split('T')[0],
    status: 'Not Started',
    image: null,
    priority: {
      importance: 5,
      urgency: 5,
      effort: 5,
      impact: 5
    },
    milestones: [
      { id: 1, name: 'Research', completed: false },
      { id: 2, name: 'Implementation', completed: false }
    ],
    notes: [],
    order: 0
  }]);

  const calculatePriority = (priority: Priority): number => {
    return priorityCriteria.reduce((sum, criterion) =>
      sum + (priority[criterion.id] * criterion.weight), 0
    );
  };

  const handleImageUpload = (goalId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGoals(prevGoals =>
          prevGoals.map(g => g.id === goalId ? {...g, image: reader.result as string} : g)
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const addNote = (goalId: number, note: string) => {
    if (note.trim()) {
      setGoals(prevGoals =>
        prevGoals.map(g =>
          g.id === goalId ? {
            ...g,
            notes: [{
              id: Date.now(),
              text: note.trim(),
              timestamp: new Date().toISOString()
            }, ...g.notes]
          } : g
        )
      );
    }
  };

  const updateGoalStatus = (goal: Goal): string => {
    const hasStarted = goal.milestones.some(m => m.completed);
    const allCompleted = goal.milestones.every(m => m.completed);
    return allCompleted ? 'Completed' : (hasStarted ? 'In Progress' : 'Not Started');
  };

  const updatePriority = (goalId: number, criteriaId: keyof Priority, value: number) => {
    setGoals(prevGoals =>
      prevGoals.map(g =>
        g.id === goalId
          ? { ...g, priority: { ...g.priority, [criteriaId]: value } }
          : g
      )
    );
  };

  const addNewGoal = () => {
    const maxOrder = Math.max(...goals.map(g => g.order), -1);
    setGoals(prevGoals => [...prevGoals, {
      id: Date.now(),
      name: 'New Goal',
      deadline: new Date().toISOString().split('T')[0],
      status: 'Not Started',
      image: null,
      priority: {
        importance: 5,
        urgency: 5,
        effort: 5,
        impact: 5
      },
      milestones: [],
      notes: [],
      order: maxOrder + 1
    }]);
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
                {goal.image ? (
                  <img
                    src={goal.image}
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
                onChange={(e) => setGoals(prevGoals =>
                  prevGoals.map(g =>
                    g.id === goal.id ? {...g, name: e.target.value} : g
                  )
                )}
                className="bg-transparent font-semibold outline-none text-sm sm:text-base w-full sm:w-auto"
              />
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={goal.deadline}
                  onChange={(e) => setGoals(prevGoals =>
                    prevGoals.map(g =>
                      g.id === goal.id ? {...g, deadline: e.target.value} : g
                    )
                  )}
                  className="bg-gray-800 p-2 rounded text-sm flex-1 sm:flex-none"
                />
                <span className="text-xs sm:text-sm px-2 py-1 rounded bg-gray-800">{goal.status}</span>
                <span className="text-xs sm:text-sm px-2 py-1 rounded bg-blue-500">
                  Priority: {calculatePriority(goal.priority).toFixed(2)}
                </span>
                <button
                  onClick={() => setGoals(prevGoals => prevGoals.filter(g => g.id !== goal.id))}
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
                  onClick={() => setGoals(prevGoals =>
                    prevGoals.map(g =>
                      g.id === goal.id ? {
                        ...g,
                        milestones: [...g.milestones, {
                          id: Date.now(),
                          name: 'New Milestone',
                          completed: false
                        }]
                      } : g
                    )
                  )}
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
                    onToggle={() => {
                      const updatedGoal = {
                        ...goal,
                        milestones: goal.milestones.map(m =>
                          m.id === milestone.id ? {...m, completed: !m.completed} : m
                        )
                      };
                      updatedGoal.status = updateGoalStatus(updatedGoal);
                      setGoals(prevGoals => prevGoals.map(g =>
                        g.id === goal.id ? updatedGoal : g
                      ));
                    }}
                    onUpdate={(name) => setGoals(prevGoals => prevGoals.map(g => ({
                      ...g,
                      milestones: g.id === goal.id
                        ? g.milestones.map(m =>
                            m.id === milestone.id ? {...m, name} : m
                          )
                        : g.milestones
                    })))}
                    onDelete={() => setGoals(prevGoals => prevGoals.map(g => ({
                      ...g,
                      milestones: g.id === goal.id
                        ? g.milestones.filter(m => m.id !== milestone.id)
                        : g.milestones
                    })))}
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
                    note={note}
                    onDelete={() => setGoals(prevGoals => prevGoals.map(g => ({
                      ...g,
                      notes: g.id === goal.id
                        ? g.notes.filter(n => n.id !== note.id)
                        : g.notes
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

export default GoalsTracker;
