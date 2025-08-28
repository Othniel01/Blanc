import { MainLayout } from "@/lib/components/layout";
import { Flag, Star} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/lib/components/ui/avatar"
import { MoreButton } from "@/lib/components/core/more";
import { Button } from "@/lib/components/ui/button"


const projects = [
  {
    id: 1,
    title: "Office Cleaning",
    tags: ["Cleaning", "Corporate"],
    tasks: 10,
    dueDate: "21/03/2024",
    avatar: "https://github.com/shadcn.png",
  },
  {
    id: 2,
    title: "Website Redesign",
    tags: ["Design", "UI/UX"],
    tasks: 8,
    dueDate: "15/04/2024",
    avatar: "https://github.com/shadcn.png",
  },
  {
    id: 3,
    title: "Marketing Campaign",
    tags: ["Marketing", "Ads"],
    tasks: 12,
    dueDate: "01/05/2024",
    avatar: "https://github.com/shadcn.png",
  },
  {
    id: 4,
    title: "Product Launch",
    tags: ["Launch", "Sales"],
    tasks: 5,
    dueDate: "10/06/2024",
    avatar: "https://github.com/shadcn.png",
  },
];


export default function Page() {
  return (
    <MainLayout>
        {/* <div className="flex flex-1 flex-col gap-4 px-4 py-10">
          <div className="bg-muted/50 mx-auto h-24 w-full max-w-3xl rounded-xl" />
          <div className="bg-muted/50 mx-auto h-full w-full max-w-3xl rounded-xl" />
        </div> */}
        {/* <div className="bg-white border-t-sidebar-border border-t border-solid p-4 w-full h-20">
         <div className="font-bold text-lg">Welcome, John</div>
        </div> */}
        <div className="grid w-full h-full bg-[#f5f6f8] p-4 gap-y-10  gap-x-1
            grid-cols-[repeat(auto-fit,minmax(320px,1fr))] auto-rows-min">
            {projects.map((project) => (
            <div 
            key={project.id}
            className="bg-white cursor-pointer rounded-[10px]  relative w-[360px] p-4 max-h-fit">
                <div className="flex-col flex">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon"  className="h-7 hover:bg-yellow-300  w-7">
                        <Star />
                    </Button>
                    {/* <Star className="w-[18px] h-[19px]"/> */}
                         <h1 className="font-medium text-base">{project.title}</h1>
                    </div>
                     <div className="flex mt-2 gap-2 items-center">
                        {project.tags.map((tag, i) => (
                        <div key={i} className="text-xs pt-1 pb-1 pl-2 pr-2 text-amber-800 bg-amber-400 rounded-full">{tag}</div>
                         ))}
                    </div>
                    <div className="w-full h-[40px]"></div>
                </div>
                <div className="absolute right-4 top-4">
                    <MoreButton />
                </div>
                <div className="absolute pr-8 bottom-2 w-full">
                    <div className="flex  items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className=" flex text-xs items-center gap-1 ">
                                <p>{project.tasks}</p>
                                <p className="font-medium">Tasks</p>
                                </div>

                                <div className="text-xs items-center gap-1 flex">
                                    <Flag size="icon" className="w-3  h-3"/>
                                    <p className="text-gray-700">{project.dueDate}</p>
                                </div>
                        </div>
                    <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    </div>
                </div>
            </div>
             ))}
        </div>
    </MainLayout>
  )
}
