"use client";
import { DateRangePicker } from "@/lib/components/date-range";
import { MainLayout } from "@/lib/components/layout";
import Notebook from "@/lib/components/notebook";
import TagsInput from "@/lib/components/tags";
import { ArrowRightIcon } from "lucide-react";
// import { FormSchema } from "@/lib/components/views/form/form";
// import FormView from "@/lib/components/views/form/formView";





export default function project_id(){
   const availableTags = [
    { id: 1, name: "Urgent" },
    { id: 2, name: "Backend" },
    { id: 3, name: "Frontend" },
  ]; // normally fetched from API

  const handleTagsChange = (tags: { id?: number; name: string }[]) => {
    console.log("Selected tags:", tags);
    // send to backend: IDs for existing tags, new names for creation
  };

    return(
        
        <MainLayout>
            <div className="bg-[#f5f6f8] w-full p-4 h-full">

            



            <div className="bg-white w-[70%]   border-1 border-solid border-sidebar-border h-full">
                {/* title input */}
                <div className="p-5">
                <input type="text" className="w-[60%] border-[transparent] text-3xl placeholder:text-3xl placeholder:font-normal font-semibold h-10 border-0 border-b-1   hover:border-gray-400   focus:border-teal-700 outline-none" placeholder="eg. Office Party" name="name" id="name" />

                <div className="column w-full  flex mt-5 ">
                        <div className=" w-full  ">
                            {/* tags one to many field */}
                            <div className="flex w-full  gap-10">
                                <label htmlFor="tags" className="text-sm font-medium">Tags</label>
                                <TagsInput availableTags={availableTags} onChange={handleTagsChange} />
                                {/* <input type="text" className="w-[60%] border-[transparent] text-sm placeholder:text-sm font-normal h-10 border-0 border-b-1   hover:border-gray-200   focus:border-teal-700 outline-none" name="timeline" id="timeline" /> */}
                            </div>
                            <div className="w-full flex items-center gap-10">
                                <label htmlFor="tags" className="text-sm font-medium">Planned Date</label>
                                <div className="w-[60%] flex gap-5 items-center">
                                    <DateRangePicker value={{ from: new Date(2025, 0, 1), to: new Date(2025, 0, 15) }} onChange={(range) => console.log("Picked:", range)}/>
                                </div>
                                
                            </div>
                        </div>
                         <div className="w-full ">
                            <div className="flex w-full items-center gap-10">
                                <label htmlFor="project-manager" className="text-sm font-medium">Project Manager</label>
                            <input type="text" className="w-[60%] border-[transparent] text-sm placeholder:text-sm font-normal h-10 border-0 border-b-1   hover:border-gray-200   focus:border-teal-700 outline-none" name="project-manager" id="project-manager" />
                            </div>
                            {/* project manager many to one field */}
                            
                        </div>
                </div>
                </div>
                    <Notebook pages={[
        {
          title: "Description",
          content: (
            <textarea
              className="w-full resize-none text-sm placeholder:text-sm border-0 outline-none h-80"
              placeholder="Project description..."
            />
          ),
        },
        {
          title: "Project Members",
          content: <div>Members form / list here</div>,
        },
        {
          title: "Users",
          content: <div>Users form / list here</div>,
        },
      ]} />
            </div>

            

            </div>
        </MainLayout>
    )
}