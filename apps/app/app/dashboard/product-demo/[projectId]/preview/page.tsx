import ProductDemoPreview from "./ProductDemoPreview";

type ProductDemoPreviewPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProductDemoPreviewPage({ params }: ProductDemoPreviewPageProps) {
  const { projectId } = await params;

  return <ProductDemoPreview projectId={projectId} />;
}
