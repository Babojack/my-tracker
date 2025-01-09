import React, { useState } from 'react';
import { X } from 'lucide-react';
import Note from '../shared/Note';

interface MoodEntry {
  id: number;
  mood: {
    id: number;
    label: string;
    color: string;
    emoji: string;
  };
  timestamp: string;
  notes: {
    id: number;
    text: string;
    timestamp: string;
  }[];
}

const MoodTracker: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const moodLevels = [
    { id: 5, label: 'Excellent', color: 'bg-green-500', emoji: '😃' },
    { id: 4, label: 'Good', color: 'bg-blue-500', emoji: '🙂' },
    { id: 3, label: 'Neutral', color: 'bg-yellow-500', emoji: '😐' },
    { id: 2, label: 'Poor', color: 'bg-orange-500', emoji: '🙁' },
    { id: 1, label: 'Bad', color: 'bg-red-500', emoji: '😞' }
  ];

  const addEntry = (mood: typeof moodLevels[0]) => {
    setEntries([
      {
        id: Date.now(),
        mood,
        timestamp: new Date().toISOString(),
        notes: []
      },
      ...entries
    ]);
  };

  const addNote = (entryId: number, noteText: string) => {
    if (noteText.trim()) {
      setEntries(entries.map(entry =>
        entry.id === entryId ? {
          ...entry,
          notes: [...(entry.notes || []), {
            id: Date.now(),
            text: noteText.trim(),
            timestamp: new Date().toISOString()
          }]
        } : entry
      ));
    }
  };

  const filteredEntries = filter === 'all'
    ? entries
    : entries.filter(entry => entry.mood.id === parseInt(filter));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mood Tracker</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 p-2 rounded"
        >
          <option value="all">All Moods</option>
          {moodLevels.map(mood => (
            <option key={mood.id} value={mood.id}>
              {mood.label} Only
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-center gap-4">
        {moodLevels.map(mood => (
          <button
            key={mood.id}
            onClick={() => addEntry(mood)}
            className={`w-16 h-16 rounded-full transition-all hover:opacity-80 ${mood.color} flex items-center justify-center text-2xl shadow-lg hover:scale-110`}
          >
            {mood.emoji}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredEntries.map(entry => (
          <div key={entry.id} className={`p-4 rounded-lg ${entry.mood.color} bg-opacity-20`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{entry.mood.emoji}</span>
                <span className="font-medium">{entry.mood.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <button
                  onClick={() => setEntries(entries.filter(e => e.id !== entry.id))}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Add a note and press Enter..."
              className="w-full bg-gray-800 rounded p-2 mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                  addNote(entry.id, (e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />

            <div className="space-y-2 mt-2">
              {entry.notes && entry.notes.map(note => (
                <Note
                  key={note.id}
                  note={note}
                  onDelete={() => setEntries(entries.map(e => ({
                    ...e,
                    notes: e.id === entry.id
                      ? e.notes.filter(n => n.id !== note.id)
                      : e.notes
                  })))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoodTracker;
