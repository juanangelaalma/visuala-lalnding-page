import { getProductDemoStoryboard } from "@/features/product-demo/actions/product-demo-storyboard-queries";
import StoryboardStudio from "./StoryboardStudio";

type StoryboardPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function StoryboardPage({ params }: StoryboardPageProps) {
  const { projectId } = await params;

  const scenes = await getProductDemoStoryboard(projectId);

  return <StoryboardStudio projectId={projectId} initialScenes={scenes} />;
}
