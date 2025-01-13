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
    <div className="w-full space-y-6 p-4">
      {/* Заголовок и фильтр */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Mood Tracker</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-auto bg-gray-800 p-2 rounded text-sm sm:text-base"
        >
          <option value="all">All Moods</option>
          {moodLevels.map(mood => (
            <option key={mood.id} value={mood.id}>
              {mood.label} Only
            </option>
          ))}
        </select>
      </div>

      {/* Кнопки настроения */}
      <div className="flex flex-wrap sm:flex-nowrap justify-center gap-2 sm:gap-4">
        {moodLevels.map(mood => (
          <button
            key={mood.id}
            onClick={() => addEntry(mood)}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full transition-all
              hover:opacity-80 ${mood.color} flex items-center justify-center
              text-xl sm:text-2xl shadow-lg hover:scale-110
              active:scale-95 transform duration-150`}
            title={mood.label}
          >
            {mood.emoji}
          </button>
        ))}
      </div>

      {/* Записи настроения */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEntries.map(entry => (
          <div
            key={entry.id}
            className={`p-3 sm:p-4 rounded-lg ${entry.mood.color} bg-opacity-20
              backdrop-blur-sm transition-all duration-300 hover:bg-opacity-25`}
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl">{entry.mood.emoji}</span>
                <span className="font-medium text-sm sm:text-base">{entry.mood.label}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                <span className="text-xs sm:text-sm text-gray-300">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <button
                  onClick={() => setEntries(entries.filter(e => e.id !== entry.id))}
                  className="p-1 hover:bg-gray-600 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Поле ввода заметки */}
            <input
              type="text"
              placeholder="Add a note and press Enter..."
              className="w-full bg-gray-800 rounded p-2 mt-2 text-sm sm:text-base
                placeholder:text-gray-500 focus:outline-none focus:ring-2
                focus:ring-blue-500 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                  addNote(entry.id, (e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />

            {/* Список заметок */}
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

      {/* Сообщение, если нет записей */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-lg">No mood entries yet.</p>
          <p className="text-sm mt-2">Click on any mood button above to start tracking!</p>
        </div>
      )}
    </div>
  );
};

export default MoodTracker;
