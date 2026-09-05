import GeneratingVideo from "./GeneratingVideo";

type GeneratingVideoPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function GeneratingVideoPage({ params }: GeneratingVideoPageProps) {
  const { projectId } = await params;

  return <GeneratingVideo projectId={projectId} />;
}
