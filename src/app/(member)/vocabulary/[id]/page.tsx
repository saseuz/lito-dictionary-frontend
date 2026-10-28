import { notFound } from "next/navigation";
import { SavedWordPage } from "@/features/vocabulary/components/vocabulary";
export const metadata = { title: "Saved word" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9][0-9]*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  return <SavedWordPage id={Number(id)} />;
}
