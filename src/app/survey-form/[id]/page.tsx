import SurveyForm from '@/components/forms/SurveyForm';

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <SurveyForm surveyId={id} />;
}
