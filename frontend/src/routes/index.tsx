import { createEffect, onMount } from "solid-js";
import { useSidebar } from "~/providers/SidebarProvider";

export default function Home() {
  const { setIsOpen } = useSidebar()

  onMount(() => {
    setIsOpen(true)
  })
  
  return (
    <></>
  );
}
