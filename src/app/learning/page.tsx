import { getSimpleLearningData } from '@/app/actions/simple-learning';
import SimpleLearningClient from './SimpleLearningClient';

export const dynamic = 'force-dynamic';

export default async function LearningPage() {
  const data = await getSimpleLearningData();
  
  return (
    <SimpleLearningClient initialData={data} />
  );
}
