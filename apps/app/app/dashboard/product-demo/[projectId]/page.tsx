import ProductBriefStudio from "./ProductBriefStudio";

type ProductDemoProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProductDemoProjectPage({ params }: ProductDemoProjectPageProps) {
  const { projectId } = await params;

  return <ProductBriefStudio projectId={projectId} />;
}
