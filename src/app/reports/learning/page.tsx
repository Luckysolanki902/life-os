import { getLearningReport } from '../../actions/reports';
import LearningReportClient from './LearningReportClient';

export default async function LearningReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; skillId?: string; areaId?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || 'last7Days';
  const skillId = params.skillId || undefined;
  const areaId = params.areaId || undefined;
  
  const data = await getLearningReport(period, skillId, areaId);

  return (
    <LearningReportClient 
      initialData={data} 
      initialPeriod={period}
      initialSkillId={skillId}
      initialAreaId={areaId}
    />
  );
}
