import { redirect } from "next/navigation";

/**
 * The standalone project index was folded into the workspace desktop —
 * workspaces are the single organizing unit and projects live inside them.
 * Kept as a redirect so old links and bookmarks stay alive.
 */
export default function ProjectsIndexRedirect() {
  redirect("/workspaces");
}
