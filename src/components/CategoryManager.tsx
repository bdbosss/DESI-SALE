import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, INITIAL_CATEGORIES } from '../lib/db';
import { Plus, Trash2, Tag, Edit2, Check, RefreshCcw, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Category } from '../types';

interface SortableItemProps {
  key?: string;
  cat: Category;
  editingId: string | null;
  editValue: string;
  setEditValue: (val: string) => void;
  handleSaveEdit: (id: string) => void;
  handleEdit: (id: string, name: string) => void;
  handleDelete: (id: string) => void;
}

function SortableItem({ 
  cat, 
  editingId, 
  editValue, 
  setEditValue, 
  handleSaveEdit, 
  handleEdit, 
  handleDelete 
}: SortableItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const onDeleteClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    if (showConfirm) {
      handleDelete(cat.id);
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Auto-cancel after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg group transition-all shadow-sm",
        isDragging ? "opacity-50 scale-105 border-primary ring-2 ring-primary/10" : "hover:border-slate-300"
      )}
    >
      <div className="flex-1 flex items-center gap-2 overflow-hidden mr-2">
        <button 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors p-1"
        >
          <GripVertical size={16} />
        </button>
        <Tag size={14} className="text-slate-400 shrink-0" />
        {editingId === cat.id ? (
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSaveEdit(cat.id)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(cat.id)}
            className="w-full text-xs font-bold text-slate-800 outline-none border-b border-primary/30 bg-transparent"
          />
        ) : (
          <span className={cn(
            "text-xs font-bold truncate",
            cat.type === 'INCOME' ? "text-success" : "text-danger"
          )}>
            {cat.name}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        {editingId === cat.id ? (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSaveEdit(cat.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-2 text-success hover:bg-success/10 rounded-md"
          >
            <Check size={16} />
          </button>
        ) : (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(cat.id, cat.name);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-md md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          >
            <Edit2 size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onDeleteClick}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "p-2 rounded-md transition-all flex items-center gap-1",
            showConfirm 
              ? "bg-danger text-white text-[10px] font-bold px-3" 
              : "text-slate-300 hover:text-danger hover:bg-danger/5 md:opacity-0 md:group-hover:opacity-100"
          )}
        >
          {showConfirm ? "CONFIRM?" : <Trash2 size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function CategoryManager() {
  const { t } = useTranslation();
  const [activeType, setActiveType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const categories = useLiveQuery(
    () => db.categories.where('type').equals(activeType).sortBy('order'),
    [activeType]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && categories) {
      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);
      
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      
      // Update order in database for all affected categories
      await db.transaction('rw', db.categories, async () => {
        for (let i = 0; i < newOrder.length; i++) {
          await db.categories.update(newOrder[i].id, { order: i });
        }
      });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    const id = `${activeType.toLowerCase()}_${newCatName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    const currentMaxOrder = categories?.reduce((max, c) => Math.max(max, c.order || 0), -1) ?? -1;
    
    await db.categories.add({
      id,
      name: newCatName.trim(),
      icon: 'Tag',
      type: activeType,
      order: currentMaxOrder + 1
    });
    setNewCatName('');
  };

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValue.trim()) return;
    await db.categories.update(id, { name: editValue.trim() });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await db.categories.delete(id);
  };

  const handleReset = async () => {
    if (confirm("Reset to default categories? All custom categories will be removed.")) {
      await db.categories.clear();
      await db.categories.bulkAdd(INITIAL_CATEGORIES);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveType('INCOME')}
          className={cn(
            "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
            activeType === 'INCOME' ? "bg-white text-success shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          {t('income')}
        </button>
        <button
          onClick={() => setActiveType('EXPENSE')}
          className={cn(
            "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
            activeType === 'EXPENSE' ? "bg-white text-danger shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          {t('expense')}
        </button>
      </div>

      <div className="flex gap-2">
        <form onSubmit={handleAdd} className="flex-1 flex gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New Category Name..."
            className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10"
          />
          <button
            type="submit"
            className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark transition-all"
          >
            <Plus size={20} />
          </button>
        </form>
        <button
          onClick={handleReset}
          title="Reset to Defaults"
          className="bg-slate-100 text-slate-500 p-2 rounded-lg hover:bg-slate-200 transition-all"
        >
          <RefreshCcw size={20} />
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories?.map(c => c.id) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-3">
            {categories?.map((cat) => (
              <SortableItem 
                key={cat.id} 
                cat={cat}
                editingId={editingId}
                editValue={editValue}
                setEditValue={setEditValue}
                handleSaveEdit={handleSaveEdit}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

