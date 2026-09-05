import ProductDemoExport from "./ProductDemoExport";

type ProductDemoExportPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProductDemoExportPage({ params }: ProductDemoExportPageProps) {
  const { projectId } = await params;

  return <ProductDemoExport projectId={projectId} />;
}
