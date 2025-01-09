import React, { useState } from 'react';
import { Activity, BarChart2, Target, Brain, Plus } from 'lucide-react';
import ProjectTracker from './components/trackers/ProjectTracker';
import GoalsTracker from './components/trackers/GoalsTracker';
import MoodTracker from './components/trackers/MoodTracker';
import LifeEQTracker from './components/trackers/LifeEQTracker';
import TodoTracker from './components/trackers/TodoTracker';

type TabId = 'projects' | 'goals' | 'mood' | 'lifeEQ' | 'todos';

interface Tab {
  id: TabId;
  name: string;
  Icon: React.FC<any>;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('projects');

  const tabs: Tab[] = [
    { id: 'projects', name: 'Project Tracker', Icon: Activity },
    { id: 'goals', name: 'Goals Tracker', Icon: Target },
    { id: 'mood', name: 'Mood Tracker', Icon: BarChart2 },
    { id: 'lifeEQ', name: 'LifeEQ Tracker', Icon: Brain },
    { id: 'todos', name: 'ToDo\'s', Icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <nav className="mb-8">
          <div className="flex space-x-4 justify-center bg-gray-800/50 p-4 rounded-lg">
            {tabs.map((tab) => {
              const IconComponent = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    activeTab === tab.id ? 'bg-blue-500 shadow-lg' : 'hover:bg-gray-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="bg-gray-800/50 rounded-lg p-6">
          {activeTab === 'projects' && <ProjectTracker />}
          {activeTab === 'goals' && <GoalsTracker />}
          {activeTab === 'mood' && <MoodTracker />}
          {activeTab === 'lifeEQ' && <LifeEQTracker />}
          {activeTab === 'todos' && <TodoTracker />}
        </div>
      </div>
    </div>
  );
};

export default App;
