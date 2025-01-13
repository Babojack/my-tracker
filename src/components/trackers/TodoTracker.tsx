import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Note from '../shared/Note';

interface TodoNote {
  id: number;
  text: string;
  timestamp: string;
}

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  notes: TodoNote[];
}

interface TodoGroup {
  id: number;
  title: string;
  todos: Todo[];
}

const TodoTracker: React.FC = () => {
  const [todoGroups, setTodoGroups] = useState<TodoGroup[]>([
    {
      id: Date.now(),
      title: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      todos: []
    }
  ]);

  const addNewGroup = () => {
    const newGroup = {
      id: Date.now(),
      title: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      todos: []
    };
    setTodoGroups([newGroup, ...todoGroups]);
  };

  const addTodo = (groupId: number, text: string) => {
    if (text.trim()) {
      const newTodo = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        notes: []
      };

      setTodoGroups(todoGroups.map(group =>
        group.id === groupId
          ? { ...group, todos: [newTodo, ...group.todos] }
          : group
      ));
    }
  };

  const toggleTodo = (groupId: number, todoId: number) => {
    setTodoGroups(todoGroups.map(group =>
      group.id === groupId
        ? {
            ...group,
            todos: group.todos.map(todo =>
              todo.id === todoId
                ? { ...todo, completed: !todo.completed }
                : todo
            )
          }
        : group
    ));
  };

  const addNote = (groupId: number, todoId: number, noteText: string) => {
    if (noteText.trim()) {
      setTodoGroups(todoGroups.map(group =>
        group.id === groupId
          ? {
              ...group,
              todos: group.todos.map(todo =>
                todo.id === todoId
                  ? {
                      ...todo,
                      notes: [...todo.notes, {
                        id: Date.now(),
                        text: noteText.trim(),
                        timestamp: new Date().toISOString()
                      }]
                    }
                  : todo
              )
            }
          : group
      ));
    }
  };

  const deleteTodo = (groupId: number, todoId: number) => {
    setTodoGroups(todoGroups.map(group =>
      group.id === groupId
        ? { ...group, todos: group.todos.filter(todo => todo.id !== todoId) }
        : group
    ));
  };

  const deleteNote = (groupId: number, todoId: number, noteId: number) => {
    setTodoGroups(todoGroups.map(group =>
      group.id === groupId
        ? {
            ...group,
            todos: group.todos.map(todo =>
              todo.id === todoId
                ? {
                    ...todo,
                    notes: todo.notes.filter(note => note.id !== noteId)
                  }
                : todo
            )
          }
        : group
    ));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">ToDo's</h2>
        <button
          onClick={addNewGroup}
          className="p-1.5 sm:p-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {todoGroups.map(group => (
          <div key={group.id} className="bg-gray-800 rounded-lg p-3 sm:p-4">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 break-words">{group.title}</h3>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new task..."
                  className="flex-1 bg-gray-700 p-2 rounded text-sm sm:text-base placeholder:text-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                      addTodo(group.id, (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) {
                      addTodo(group.id, input.value);
                      input.value = '';
                    }
                  }}
                  className="p-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {group.todos.map(todo => (
                  <div key={todo.id} className="bg-gray-700/50 p-3 sm:p-4 rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(group.id, todo.id)}
                          className="w-4 h-4 rounded shrink-0"
                        />
                        <span className={`${todo.completed ? 'line-through text-gray-400' : ''} break-words text-sm sm:text-base`}>
                          {todo.text}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTodo(group.id, todo.id)}
                        className="p-1 hover:bg-gray-600 rounded shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Add a note and press Enter..."
                      className="w-full bg-gray-800 p-2 rounded text-sm placeholder:text-gray-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                          addNote(group.id, todo.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />

                    <div className="space-y-2 ml-4 sm:ml-6">
                      {todo.notes.map(note => (
                        <div key={note.id} className="text-sm text-gray-400 flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="break-words">{note.text}</div>
                            <span className="text-xs opacity-75 block sm:inline sm:ml-2">
                              {new Date(note.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteNote(group.id, todo.id, note.id)}
                            className="p-1 hover:bg-gray-600 rounded shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodoTracker;
