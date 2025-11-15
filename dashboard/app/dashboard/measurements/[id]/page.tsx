import { notFound } from 'next/navigation';
import { getMeasurementById } from '../_lib/queries';
import { MeasurementDetail } from './_components/measurement-detail';

interface MeasurementDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MeasurementDetailPage({ params }: MeasurementDetailPageProps) {
  const { id } = await params;
  const measurement = await getMeasurementById(id);

  if (!measurement) {
    notFound();
  }

  return <MeasurementDetail measurement={measurement} />;
}
