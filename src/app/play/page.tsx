import { redirect } from "next/navigation";

// the room moved to the front page
export default function Page() {
  redirect("/");
}
