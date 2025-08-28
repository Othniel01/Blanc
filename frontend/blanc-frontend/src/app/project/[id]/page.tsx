"use client";
import { MainLayout } from "@/lib/components/layout";
import Notebook from "@/lib/components/notebook";
import { ArrowRightIcon } from "lucide-react";
// import { FormSchema } from "@/lib/components/views/form/form";
// import FormView from "@/lib/components/views/form/formView";


// const projectForm: FormSchema = {
//   title: "Create New Project",
//   fields: [
//     { name: "name", label: "Project Name", type: "text", required: true },
//     { name: "description", label: "Description", type: "textarea" },
//     { name: "deadline", label: "Deadline", type: "date" },
//     {
//       name: "status",
//       label: "Status",
//       type: "select",
//       options: [
//         { value: "draft", label: "Draft" },
//         { value: "active", label: "Active" },
//         { value: "done", label: "Completed" },
//       ],
//     },
//   ],
//   submitLabel: "Save Project",
// };


export default function project_id(){
//      const handleSubmit = (data: Record<string, any>) => {
//     console.log("Form submitted:", data);
//     // call API
//   };

    return(
        
        <MainLayout>
            <div className="bg-[#f5f6f8] w-full p-4 h-full">



            <div className="bg-white w-[70%]   border-1 border-solid border-sidebar-border h-full">
                {/* title input */}
                <div className="p-5">
                <input type="text" className="w-[60%] border-[transparent] text-3xl placeholder:text-3xl placeholder:font-normal font-semibold h-10 border-0 border-b-1   hover:border-gray-400   focus:border-teal-700 outline-none" placeholder="eg. Office Party" name="name" id="name" />

                <div className="column w-full flex mt-5 ">
                        <div className=" w-full  ">
                            {/* tags one to many field */}
                            <div className="flex w-full items-center gap-10">
                                <label htmlFor="tags" className="text-sm font-medium">Tags</label>
                                <input type="text" className="w-[60%] border-[transparent] text-sm placeholder:text-sm font-normal h-10 border-0 border-b-1   hover:border-gray-200   focus:border-teal-700 outline-none" name="timeline" id="timeline" />
                            </div>
                            <div className="w-full flex items-center gap-10">
                                <label htmlFor="tags" className="text-sm font-medium">Planned Date</label>
                                <div className="w-[60%] flex gap-5 items-center">
                                    <input type="date" className="w-full border-[transparent] text-sm placeholder:text-sm font-normal h-10 border-0 border-b-1   hover:border-gray-200   focus:border-teal-700 outline-none" name="start_date" id="start_date" />
                                    <ArrowRightIcon className="h-8 w-8" />
                                    <input type="date" className="w-full border-[transparent] text-sm placeholder:text-sm font-normal h-10 border-0 border-b-1   hover:border-gray-200   focus:border-teal-700 outline-none" name="end_date" id="end_date" />
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
                {/* <div className="notebook pl-5  mt-10 navbar">
                    <ul className="text-sm  flex  items-center">
                        <li className="active-note-page border-1  border-r-0 z-[2] cursor-pointer border-b-1 hover:text-teal-700  border-b-white border-gray-200 pt-2 pb-2 pr-4 pl-4">Description</li>
                        <li className="border-1 border-b-0 cursor-pointer border-gray-200 hover:text-teal-700 pt-2 pb-2 pr-4 pl-4">Project Members</li>
                    </ul>
                    
                </div>
                <div className="notebook-content-1 border-t-1 border-gray-200 w-full h-1/2">
                        <div className="p-3 w-full h-full">
                            <textarea name="" id="" className="w-full resize-none border-0 outline-none h-full" placeholder="Description..."></textarea>
                        </div>
                    </div>

                    <div className="notebook-content-2 border-t-1 border-gray-200 w-full h-1/2">
                        <div className="p-3 w-full h-full">
                            <textarea name="" id="" className="w-full resize-none border-0 outline-none h-full" placeholder="Description..."></textarea>
                        </div>
                    </div> */}
                    <Notebook pages={[
        {
          title: "Description",
          content: (
            <textarea
              className="w-full resize-none border-0 outline-none h-80"
              placeholder="Description..."
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