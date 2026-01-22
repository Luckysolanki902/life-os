import { getBooksDashboardData } from '@/app/actions/books';
import SimpleBooksClient from './SimpleBooksClient';

export const dynamic = 'force-dynamic';

export default async function BooksPage() {
  const data = await getBooksDashboardData();
  
  return <SimpleBooksClient initialData={data} />;
}
