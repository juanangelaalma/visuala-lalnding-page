import VideoPlanStudio from "./VideoPlanStudio";

type VideoPlanPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function VideoPlanPage({ params }: VideoPlanPageProps) {
  const { projectId } = await params;

  return <VideoPlanStudio projectId={projectId} />;
}
