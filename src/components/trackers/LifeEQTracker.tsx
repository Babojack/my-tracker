import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Category {
  name: string;
  value: number;
}

const LifeEQTracker: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([
    { name: 'Health', value: 8 },
    { name: 'Relationships', value: 7 },
    { name: 'Career', value: 6 },
    { name: 'Finance', value: 5 },
    { name: 'Growth', value: 7 },
    { name: 'Leisure', value: 6 }
  ]);
  const [newCategory, setNewCategory] = useState('');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex justify-center items-center bg-gray-700/50 rounded-lg p-4">
          <RadarChart width={300} height={300} data={categories}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis domain={[0, 10]} />
            <Radar
              name="Balance"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
          </RadarChart>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Life Balance</h2>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New Category"
                className="bg-gray-800 p-2 rounded"
              />
              <button
                onClick={() => {
                  if (newCategory.trim()) {
                    setCategories([...categories, { name: newCategory, value: 5 }]);
                    setNewCategory('');
                  }
                }}
                className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {categories.map((category, index) => (
            <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span>{category.name}</span>
                <button
                  onClick={() => setCategories(categories.filter(c => c.name !== category.name))}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={category.value}
                onChange={(e) => setCategories(categories.map(c =>
                  c.name === category.name ? {...c, value: parseInt(e.target.value)} : c
                ))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>0</span>
                <span>{category.value}/10</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LifeEQTracker;
