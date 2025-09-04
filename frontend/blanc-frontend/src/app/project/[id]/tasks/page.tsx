import Kanban from "@/lib/components/core/kanban";
import { MainLayout } from "@/lib/components/layout";

import { Button } from "@/lib/components/ui/button";

export default function Tasks() {
  return (
    <MainLayout>
      <div className="flex p-2 items-center">
        <input
          type="text"
          placeholder="Add stages..."
          className="border  rounded-tl-sm rounded-bl-sm h-8 pl-2 text-sm border-sidebar-border"
          name=""
          id=""
        />
        <Button className="rounded-tr-sm text-sm rounded-tl-none rounded-bl-none rounded-br-sm  h-8">
          Add
        </Button>
      </div>
      <div className="bg-[#f5f6f8] p-4 flex gap-6 w-full h-full">
        <Kanban />
      </div>
    </MainLayout>
  );
}
