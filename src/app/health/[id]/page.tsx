import { getHealthPageData } from '@/app/actions/health';
import WorkoutClient from './WorkoutClient';
import { notFound } from 'next/navigation';

export default async function WorkoutPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date } = await searchParams;
  const data = await getHealthPageData(id, date);

  if (!data) {
    notFound();
  }

  return <WorkoutClient initialData={data} />;
}
