import BrandSetupStudio from "./BrandSetupStudio";

type BrandSetupPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function BrandSetupPage({ params }: BrandSetupPageProps) {
  const { projectId } = await params;

  return <BrandSetupStudio projectId={projectId} />;
}
