import { getRoutine, getAllTasks } from '@/app/actions/routine';
import RoutineList from './RoutineList';
import NewTaskForm from './NewTaskForm';
import { headers } from 'next/headers';

// Force dynamic rendering since routine depends on current date/time
export const dynamic = 'force-dynamic';

export default async function RoutinePage() {
  console.log('[RoutinePage] Loading routine page');
  // Get tasks for today (server-side uses IST day)
  // Client will re-fetch with correct timezone
  const { routine: tasks, specialTasks } = await getRoutine();
  console.log('[RoutinePage] Tasks loaded:', { tasksCount: tasks.length, specialTasksCount: specialTasks.length });
  console.log('[RoutinePage] Special tasks:', specialTasks);
  const allTasks = await getAllTasks();

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Daily Routine</h1>
        <p className="text-muted-foreground">
          Build your better version, one habit at a time.
        </p>
      </header>

      <RoutineList initialTasks={tasks} allTasks={allTasks} initialSpecialTasks={specialTasks} />

      <NewTaskForm />
    </div>
  );
}
