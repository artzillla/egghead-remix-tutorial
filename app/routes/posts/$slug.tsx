import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getPost } from "~/models/post.server";
import { marked } from "marked";
import invariant from "tiny-invariant";

type LoaderData = {
  title: string;
  html: string;
};

export const loader = async ({ params }) => {
  const { slug } = params;
  invariant(slug, "Slug is required");
  const post = await getPost(params.slug);
  invariant(post, `Post ${params.slug} not found`);
  return json<LoaderData>({ title: post.title, html: marked(post.markdown) });
};

export default function PostRoute() {
  const { title, html } = useLoaderData() as LoaderData;

  return (
    <main className="mx-auto flex max-w-sm flex-col rounded-xl bg-white p-6 shadow-lg">
      <h1 className="font-medium text-black">{title}</h1>
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="text-slate-500"
      />
    </main>
  );
}
