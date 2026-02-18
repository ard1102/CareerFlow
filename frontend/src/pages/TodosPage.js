import React, { useState, useEffect } from 'react';
import { todosApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TodosPage = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await todosApi.getAll();
      setTodos(response.data);
    } catch (error) {
      toast.error('Failed to fetch todos');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      await todosApi.create({ title: newTodo });
      toast.success('Todo added!');
      setNewTodo('');
      fetchTodos();
    } catch (error) {
      toast.error('Failed to add todo');
    }
  };

  const handleToggle = async (id) => {
    try {
      await todosApi.toggle(id);
      fetchTodos();
    } catch (error) {
      toast.error('Failed to update todo');
    }
  };

  const handleDelete = async (id) => {
    try {
      await todosApi.delete(id);
      toast.success('Deleted');
      fetchTodos();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-2 tracking-tight">To-Do Lists</h1>
        <p className="text-slate-600 text-lg mb-8">Track your tasks and goals</p>

        <form onSubmit={handleAdd} className="flex gap-3 mb-8">
          <Input
            placeholder="Add a new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="h-14 rounded-xl text-lg"
          />
          <Button type="submit" className="h-14 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500">
            <Plus className="w-5 h-5 mr-2" />
            Add
          </Button>
        </form>

        <div className="space-y-3">
          {todos.map((todo) => (
            <Card key={todo.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <button onClick={() => handleToggle(todo.id)} className="flex-shrink-0">
                  {todo.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-400" />
                  )}
                </button>
                <span className={`flex-1 ${todo.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {todo.title}
                </span>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(todo.id)} className="text-rose-600 hover:bg-rose-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TodosPage;
