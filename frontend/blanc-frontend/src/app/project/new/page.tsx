/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DateRangePicker } from "@/lib/components/date-range";
import { MainLayout } from "@/lib/components/layout";
import Notebook from "@/lib/components/core/notebook";
import TagsInput from "@/lib/components/core/tags";
import { useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/lib/components/ui/breadcrumb";
import { SaveIcon, XIcon, SlashIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/lib/components/ui/button";
import MessageBox from "@/lib/components/core/chat";
import { fetchTags, createTag, assignTag } from "@/lib/routes/Tags";
import { createProject } from "@/lib/routes/project";
import ProtectedRoute from "@/lib/components/portectedRoute";

export default function ProjectNew() {
  const router = useRouter();

  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    start_date: null,
    end_date: null,
    tags: [],
  });
  const [availableTags, setAvailableTags] = useState<
    { id?: number; name: string }[]
  >([]);

  // preload tags for autocomplete
  useEffect(() => {
    let mounted = true;
    fetchTags()
      .then((tags) => {
        if (mounted) setAvailableTags(tags);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const isDirty = useMemo(() => true, []);

  const handleSave = async () => {
    // create project
    const project = await createProject({
      name: formData.name,
      description: formData.description,
      start_date: formData.start_date,
      end_date: formData.end_date,
    });

    // assign tags if needed
    const newTags = formData.tags.filter((t: any) => !t.id);
    for (const tag of newTags) {
      const created = await createTag(tag.name, "#F5B027");
      await assignTag(project.id, created.id);
    }

    for (const tag of formData.tags.filter((t: any) => t.id)) {
      await assignTag(project.id, tag.id);
    }

    // redirect to new project
    router.push(`/project/${project.id}`);
  };

  const handleDiscard = () => {
    router.push("/projects");
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="bg-[#f5f6f8] w-full p-4 h-full">
          <div className="flex gap-4 w-fit flex-row-reverse items-center">
            <div className="flex gap-2 items-center">
              {isDirty && (
                <div className="flex gap-2 items-center">
                  <Button
                    onClick={handleSave}
                    className="h-7 text-xs hover:bg-green-600"
                  >
                    <SaveIcon /> Save
                  </Button>
                  <Button
                    onClick={handleDiscard}
                    variant="outline"
                    className="h-7 text-xs"
                  >
                    <XIcon /> Discard
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Breadcrumb className="text-lg">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/projects">Projects</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <SlashIcon />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage>New</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <div className="flex h-[94%] gap-2 justify-between mt-4 w-full">
            <div className="bg-white w-[68%] h-full border border-sidebar-border">
              <div className="p-5">
                <input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  type="text"
                  className="w-[60%] border-[transparent] text-3xl placeholder:text-3xl placeholder:font-normal font-semibold h-10 border-0 border-b-1 hover:border-gray-400 focus:border-teal-700 outline-none"
                  placeholder="eg. Office Party"
                  name="name"
                  id="name"
                />

                <div className="column w-full flex mt-5">
                  <div className="w-[60%]">
                    <div className="flex w-full gap-10">
                      <label htmlFor="tags" className="text-sm font-medium">
                        Tags
                      </label>
                      <TagsInput
                        availableTags={availableTags}
                        initialTags={formData.tags || []}
                        onChange={(tags) => handleChange("tags", tags)}
                      />
                    </div>
                    <div className="w-full flex items-center gap-10 mt-5">
                      <label htmlFor="date" className="text-sm font-medium">
                        Planned Date
                      </label>
                      <div className="w-[60%] flex gap-5 items-center">
                        <DateRangePicker
                          value={{
                            from: formData.start_date
                              ? new Date(formData.start_date)
                              : undefined,
                            to: formData.end_date
                              ? new Date(formData.end_date)
                              : undefined,
                          }}
                          onChange={(range) => {
                            handleChange(
                              "start_date",
                              range?.from?.toISOString()
                            );
                            handleChange("end_date", range?.to?.toISOString());
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Notebook
                pages={[
                  {
                    title: "Description",
                    content: (
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          handleChange("description", e.target.value)
                        }
                        className="w-full resize-none text-sm placeholder:text-sm border-0 outline-none h-80"
                        placeholder="Project description..."
                      />
                    ),
                  },
                ]}
              />
            </div>
            <MessageBox object_type="project" object_id={0} />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
