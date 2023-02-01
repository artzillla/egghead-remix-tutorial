import { Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import { requireAdminUser } from "~/session.server";

export const loader = async ({ request }) => {
  await requireAdminUser(request);
  return json({});
};

export default function AdminIndexRoute() {
  return (
    <Link to="new" className="text-blue-600 underline">
      Create New Post
    </Link>
  );
}
