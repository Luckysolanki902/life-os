import { getBooksReport } from '../../actions/reports';
import BooksReportClient from './BooksReportClient';

export default async function BooksReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || 'thisWeek';
  const data = await getBooksReport(period);

  return <BooksReportClient initialData={data} initialPeriod={period} />;
}
