import { redirect } from "next/navigation";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const urlValue = params.url;
  const url = typeof urlValue === "string" ? urlValue.trim() : "";

  if (url) {
    redirect(`/analyse?url=${encodeURIComponent(url)}`);
  }

  redirect("/analyse");
}
