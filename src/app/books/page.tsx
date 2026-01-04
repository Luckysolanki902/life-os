import { getBooksDashboardData, getBooksTableData } from '@/app/actions/books';
import BooksClient from './BooksClient-new';

export default async function BooksPage() {
  const data = await getBooksDashboardData();
  const tableData = await getBooksTableData();
  
  return <BooksClient initialData={data} tableData={tableData} />;
}
