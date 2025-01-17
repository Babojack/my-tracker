import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Note from '../shared/Note';
import { db } from '../../firebase';
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

interface MoodEntry {
  id: string;
  mood: {
    id: number;
    label: string;
    color: string;
    emoji: string;
  };
  timestamp: Timestamp;
  notes: {
    id: string;
    text: string;
    timestamp: Timestamp;
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

  // Подписка на обновления из Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'moodEntries'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MoodEntry[];
      setEntries(entriesData);
    });

    return () => unsubscribe();
  }, []);

  const addEntry = async (mood: typeof moodLevels[0]) => {
    try {
      await addDoc(collection(db, 'moodEntries'), {
        mood,
        timestamp: Timestamp.now(),
        notes: []
      });
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };

  const addNote = async (entryId: string, noteText: string) => {
    if (noteText.trim()) {
      try {
        const entry = entries.find(e => e.id === entryId);
        if (!entry) return;

        const newNote = {
          id: Date.now().toString(),
          text: noteText.trim(),
          timestamp: Timestamp.now()
        };

        const entryRef = doc(db, 'moodEntries', entryId);
        await updateDoc(entryRef, {
          notes: [...entry.notes, newNote]
        });
      } catch (error) {
        console.error('Error adding note:', error);
      }
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      await deleteDoc(doc(db, 'moodEntries', entryId));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const deleteNote = async (entryId: string, noteId: string) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;

      const updatedNotes = entry.notes.filter(note => note.id !== noteId);

      const entryRef = doc(db, 'moodEntries', entryId);
      await updateDoc(entryRef, { notes: updatedNotes });
    } catch (error) {
      console.error('Error deleting note:', error);
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
                  {entry.timestamp.toDate().toLocaleString()}
                </span>
                <button
                  onClick={() => deleteEntry(entry.id)}
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
                  note={{
                    ...note,
                    timestamp: note.timestamp.toDate().toISOString()
                  }}
                  onDelete={() => deleteNote(entry.id, note.id)}
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
