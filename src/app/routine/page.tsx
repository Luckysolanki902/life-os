import { getRoutine, getAllTasks } from '@/app/actions/routine';
import RoutineList from './RoutineList';
import NewTaskForm from './NewTaskForm';
import { headers } from 'next/headers';

export default async function RoutinePage() {
  // Get tasks for today (server-side uses UTC day by default)
  // Client will re-fetch with correct timezone
  const tasks = await getRoutine();
  const allTasks = await getAllTasks();

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Daily Routine</h1>
        <p className="text-muted-foreground">
          Build your better version, one habit at a time.
        </p>
      </header>

      <RoutineList initialTasks={tasks} allTasks={allTasks} />

      <NewTaskForm />
    </div>
  );
}
