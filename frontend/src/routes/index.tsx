import { Title } from "@solidjs/meta";
import { onMount } from "solid-js";
import PageContent from "~/components/Page/PageContent";
import PageHeader from "~/components/Page/PageHeader";
import { useSidebar } from "~/providers/SidebarProvider";

export default function Home() {
  const { setIsOpen } = useSidebar()

  onMount(() => {
    setIsOpen(true)
  })
  
  return (
    <div class="w-full">
      <PageHeader></PageHeader>
      <PageContent>
        <div class="card card-body text-center py-12">
          <span class="text-2xl font-bold font-display text-gray-500">Select a wallet in the sidebar</span>
        </div>
      </PageContent>
    </div>
  );
}
