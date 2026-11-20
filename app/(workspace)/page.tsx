import { redirect } from "next/navigation";

/** Home of the standalone Items app: goes straight to the Items module. */
export default function Home() {
  redirect("/items");
}
