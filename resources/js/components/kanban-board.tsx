import { useState, useEffect, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'

export interface KanbanTask {
  id: number
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: { name: string; avatar?: string | null } | null
  due_date?: string
  [key: string]: any
}

export interface KanbanColumn {
  id: string
  title: string
  color: string
}

export interface KanbanBoardProps {
  tasks: Record<string, KanbanTask[]>
  columns: KanbanColumn[]
  onMove?: (taskId: number, fromStatus: string, toStatus: string) => void
  kanbanActions?: React.ReactNode | ((columnId: string) => React.ReactNode)
  taskCard?: React.ComponentType<{ task: KanbanTask }>
}





function KanbanColumnComponent({ 
  column, 
  tasks, 
  onMove,
  kanbanActions,
  TaskCard
}: { 
  column: KanbanColumn
  tasks: KanbanTask[]
  onMove?: (taskId: number, fromStatus: string, toStatus: string) => void
  kanbanActions?: React.ReactNode | ((columnId: string) => React.ReactNode)
  TaskCard?: React.ComponentType<{ task: KanbanTask }>
}) {
  const { t } = useTranslation()
  const [isDragOver, setIsDragOver] = useState(false)
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.taskId && onMove) {
        onMove(data.taskId, '', column.id)
      }
    } catch (error) {
      console.error('Error parsing drag data:', error)
    }
  }
  
  return (
    <div 
      className="flex-1 min-w-[300px] max-w-[320px]"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`h-full rounded-2xl border transition-all duration-200 ${
          isDragOver
            ? 'ring-2 ring-blue-400 ring-offset-1 border-blue-200 dark:bg-blue-900/10'
            : 'border-gray-200 dark:border-gray-700'
        }`}
        style={{ backgroundColor: isDragOver ? undefined : `${column.color}12` }}
      >
        {/* Column header */}
        <div className="px-4 py-3 rounded-t-2xl flex items-center justify-between" style={{ borderBottom: `2px solid ${column.color}30` }}>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 tracking-wide capitalize">
              {column.title}
            </h3>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${column.color}18`, color: column.color }}
            >
              {tasks.length}
            </span>
          </div>
          {typeof kanbanActions === 'function' ? kanbanActions(column.id) : kanbanActions}
        </div>

        {/* Tasks list */}
        <div className="p-3 min-h-[700px] max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {tasks.map((task) => (
            TaskCard ? <TaskCard key={task.id} task={task} /> : <div key={task.id}>{task.title}</div>
          ))}

          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300 dark:text-gray-600 select-none">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center mb-3">
                <span className="text-lg">↓</span>
              </div>
              <p className="text-xs font-medium">{t('Drop tasks here')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const KanbanBoard = forwardRef<any, KanbanBoardProps>(function KanbanBoard({
  tasks: initialTasks,
  columns,
  onMove,
  kanbanActions,
  taskCard: TaskCard
}, ref) {
  const { t } = useTranslation()
  const [tasks, setTasks] = useState(initialTasks)

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  
  const handleMove = (taskId: number, fromStatus: string, toStatus: string) => {
    setTasks(prevTasks => {
      const newTasks = { ...prevTasks }
      let movedTask: KanbanTask | null = null
      
      Object.keys(newTasks).forEach(status => {
        const taskIndex = newTasks[status].findIndex(task => task.id === taskId)
        if (taskIndex !== -1) {
          movedTask = newTasks[status][taskIndex]
          newTasks[status] = newTasks[status].filter(task => task.id !== taskId)
        }
      })
      
      if (movedTask) {
        newTasks[toStatus] = [...(newTasks[toStatus] || []), movedTask]
      }
      
      return newTasks
    })
    
    if (onMove) {
      onMove(taskId, fromStatus, toStatus)
    }
  }
  

  

  
  return (
    <div className="flex gap-5 overflow-x-auto pb-6">
      {columns.map((column) => (
        <KanbanColumnComponent
          key={column.id}
          column={column}
          tasks={tasks[column.id] || []}
          onMove={handleMove}
          kanbanActions={kanbanActions}
          TaskCard={TaskCard}
        />
      ))}
    </div>
  )
})

export default KanbanBoard