import ProductDemoEditor from "./ProductDemoEditor";

type ProductDemoEditorPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProductDemoEditorPage({ params }: ProductDemoEditorPageProps) {
  const { projectId } = await params;

  return <ProductDemoEditor projectId={projectId} />;
}
