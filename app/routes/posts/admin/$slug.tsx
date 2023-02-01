import {
  Form,
  useActionData,
  useCatch,
  useLoaderData,
  useParams,
  useTransition,
} from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import type { Post } from "~/models/post.server";
import {
  createPost,
  deletePost,
  getPost,
  updatePost,
} from "~/models/post.server";
import invariant from "tiny-invariant";
import { requireAdminUser } from "~/session.server";

type ActionData =
  | {
      title?: string;
      slug?: string;
      markdown?: string;
    }
  | undefined;

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  invariant(params.slug, "Slug is required");

  if (formData.get("intent") === "delete") {
    await deletePost(params.slug);
    return redirect("/posts/admin");
  }

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  console.log({ title, slug, markdown });

  const errors = {
    title: !title ? "Title is required" : undefined,
    slug: !slug ? "Slug is required" : undefined,
    markdown: !markdown ? "Markdown is required" : undefined,
  };

  const hasErrors = Object.values(errors).some((error) => error);
  if (hasErrors) {
    return json<ActionData>(errors, { status: 400 });
  }

  invariant(typeof title === "string", "title must be a string");
  invariant(typeof slug === "string", "slug must be a string");
  invariant(typeof markdown === "string", "markdown must be a string");

  if (params.slug === "new") {
    await createPost({ title, slug, markdown });
  } else {
    await updatePost(params.slug, { title, slug, markdown });
  }

  return redirect("/posts/admin");
};

type LoaderData = { post?: Post };

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireAdminUser(request);

  // throw new Error("oops");

  invariant(params.slug, "Slug is required");

  if (params.slug === "new") {
    return json<LoaderData>({});
  }

  const post = await getPost(params.slug);
  if (!post) {
    throw new Response("Not found", { status: 404 });
  }

  return json<LoaderData>({ post: post as Post });
};

export default function AdminNewRoute() {
  const errors = useActionData() as ActionData;
  const transition = useTransition();
  const data = useLoaderData<LoaderData>();

  const isNewPost = !data.post;
  const isCreating = transition.submission?.formData.get("intent") === "create";
  const isUpdating = transition.submission?.formData.get("intent") === "update";
  const isDeleting = transition.submission?.formData.get("intent") === "delete";

  return (
    <section>
      <h1>Create New Post</h1>

      <Form method="post" key={data.post?.slug ?? "new"}>
        <div className="mb-4">
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Title{" "}
            {errors?.title && <em className="text-red-600">{errors.title}</em>}
          </label>
          <input
            type="text"
            name="title"
            id="title"
            defaultValue={data.post?.title}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Slug{" "}
            {errors?.slug && <em className="text-red-600">{errors.slug}</em>}
          </label>
          <input
            type="text"
            name="slug"
            id="slug"
            defaultValue={data.post?.slug}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="markdown"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Markdown{" "}
            {errors?.markdown && (
              <em className="text-red-600">{errors.markdown}</em>
            )}
          </label>
          <input
            type="text"
            name="markdown"
            id="markdown"
            defaultValue={data.post?.markdown}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
        </div>
        {!isNewPost && (
          <button
            name="intent"
            value="delete"
            type="submit"
            className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 disabled:bg-red-400"
            disabled={isCreating || isUpdating}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
        <button
          name="intent"
          value={isNewPost ? "create" : "update"}
          type="submit"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 disabled:bg-blue-400"
          disabled={isCreating || isUpdating}
        >
          {isNewPost ? (isCreating ? "Creating..." : "Create Post") : null}
          {isNewPost ? null : isUpdating ? "Updating..." : "Update"}
        </button>
      </Form>
    </section>
  );
}

export function CatchBoundary() {
  const error = useCatch();
  const params = useParams();

  if (error.status === 404) {
    return (
      <div>
        <h1>Oh no!</h1>
        <pre>The post with the slug "${params.slug}" doesn't exist!</pre>
      </div>
    );
  }

  throw new Error("Unhandled error");
}
