/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DateRangePicker } from "@/lib/components/date-range";
import { MainLayout } from "@/lib/components/layout";
import Notebook from "@/lib/components/core/notebook";
import TagsInput from "@/lib/components/core/tags";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/lib/components/ui/breadcrumb";
import { SaveIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/lib/components/ui/button";

import { fetchTags, createTag } from "@/lib/routes/Tags";
import { fetchProjectById } from "@/lib/routes/project";
import { createTask, assignTaskTag } from "@/lib/routes/task";
import PriorityRating from "@/lib/components/core/pRating";
import { DatePicker } from "@/lib/components/date-pick";
import ProtectedRoute from "@/lib/components/portectedRoute";

export default function TaskNew() {
  const params = useParams();
  const projectId = Number(params?.id);
  const router = useRouter();

  const [project, setProject] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    due_date: null,
    priority: 0,
    tags: [],
  });
  const [availableTags, setAvailableTags] = useState<
    { id?: number; name: string }[]
  >([]);

  useEffect(() => {
    async function loadData() {
      if (projectId) {
        const proj = await fetchProjectById(projectId);
        setProject(proj);
      }
      const tags = await fetchTags();
      setAvailableTags(tags);
    }
    loadData();
  }, [projectId]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const isDirty = useMemo(() => true, []);

  const handleSave = async () => {
    const task = await createTask(projectId, {
      name: formData.name,
      description: formData.description,
      due_date: formData.due_date,
      priority: formData.priority,
    });

    const newTags = formData.tags.filter((t: any) => !t.id);
    for (const tag of newTags) {
      const created = await createTag(tag.name, "#F5B027");
      await assignTaskTag(task.id, created.id);
    }

    for (const tag of formData.tags.filter((t: any) => t.id)) {
      await assignTaskTag(task.id, tag.id);
    }

    // redirect to new task detail page
    router.push(`/project/${projectId}/tasks/${task.id}`);
  };

  const handleDiscard = () => {
    router.push(`/project/${projectId}/tasks`);
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="bg-[#f5f6f8] w-full p-4 h-full">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 w-fit flex-row-reverse items-center">
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
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <Breadcrumb>
                    <BreadcrumbList className="text-xs">
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href="/projects">Projects</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href={`/project/${projectId}/tasks`}>
                            {project?.name || `Project ${projectId}`}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>New Task</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  <p className="text-xs font-medium text-teal-900">
                    {formData.name || "New Task"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-[94%] gap-2 justify-between mt-4 w-full">
            <div className="bg-white w-[68%] h-full border border-sidebar-border">
              <div className="p-5">
                <input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  type="text"
                  className="w-[60%] border-[transparent] text-3xl font-semibold h-10 border-0 border-b-1 hover:border-gray-400 focus:border-teal-700 outline-none"
                  placeholder="Task title..."
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
                        initialTags={formData.tags}
                        onChange={(tags) => handleChange("tags", tags)}
                      />
                    </div>
                    <div className="w-full flex items-center gap-10 mt-4">
                      <label htmlFor="date" className="text-sm font-medium">
                        Due Date
                      </label>
                      <div className="w-[60%]">
                        <DatePicker
                          value={
                            formData.due_date
                              ? new Date(formData.due_date)
                              : undefined
                          }
                          onChange={(date) =>
                            handleChange("due_date", date?.toISOString())
                          }
                          placeholder="Due date"
                        />
                      </div>
                    </div>
                    <div className="w-full flex items-center gap-10 mt-4">
                      <label htmlFor="priority" className="text-sm font-medium">
                        Priority
                      </label>
                      <PriorityRating
                        deferUpdate
                        initialPriority={formData.priority}
                        onUpdated={(p) => handleChange("priority", p)}
                      />
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
                        className="w-full resize-none text-sm border-0 outline-none h-80"
                        placeholder="Task description..."
                      />
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
