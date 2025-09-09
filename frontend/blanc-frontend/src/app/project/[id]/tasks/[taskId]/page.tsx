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
import { SaveIcon, SlashIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/lib/components/ui/button";

import {
  fetchTaskById,
  updateTask,
  fetchTaskTags,
  assignTaskTag,
  unassignTaskTag,
} from "@/lib/routes/task";
import { fetchTags, createTag } from "@/lib/routes/Tags";
import { fetchProjectById } from "@/lib/routes/project";
import AssignUsers from "@/lib/components/assignUsers";
import AssignedUsersTable from "@/lib/components/assignedUserTable";
import MessageBox from "@/lib/components/core/chat";

export default function TaskFormPage() {
  const params = useParams();
  const projectId = Number(params?.id);
  const [project, setProject] = useState<any | null>(null);

  useEffect(() => {
    async function loadProject() {
      if (projectId) {
        const proj = await fetchProjectById(projectId); // you’ll need this helper
        setProject(proj);
      }
    }
    loadProject();
  }, [projectId]);
  const taskId = Number(params?.taskId);

  const [formData, setFormData] = useState<any | null>(null);
  const [originalData, setOriginalData] = useState<any | null>(null);
  const [availableTags, setAvailableTags] = useState<
    { id?: number; name: string }[]
  >([]);

  // fetch task by ID + tags
  useEffect(() => {
    async function loadTask() {
      const task = await fetchTaskById(taskId);

      const [allTags, taskTags] = await Promise.all([
        fetchTags(),
        fetchTaskTags(taskId),
      ]);

      setAvailableTags(allTags);
      setFormData({ ...task, tags: taskTags });
      setOriginalData({ ...task, tags: taskTags });
    }
    if (taskId) loadTask();
  }, [taskId]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  const router = useRouter();

  const handleSave = async () => {
    if (!formData) return;

    // 1. save main task
    await updateTask(taskId, {
      name: formData.name,
      description: formData.description,
      due_date: formData.due_date,
    });

    // 2. process tags
    const currentTags = formData.tags || [];
    const originalTags = originalData?.tags || [];

    const newTags = currentTags.filter((t: any) => !t.id);

    const addedExistingTags = currentTags.filter(
      (t: any) => t.id && !originalTags.some((ot: any) => ot.id === t.id)
    );

    const removedTags = originalTags.filter(
      (t: any) => !currentTags.some((ct: any) => ct.id === t.id)
    );

    // Create + assign new tags
    for (const tag of newTags) {
      const created = await createTag(tag.name, "#F5B027");
      await assignTaskTag(taskId, created.id);
    }

    // Assign existing tags
    for (const tag of addedExistingTags) {
      await assignTaskTag(taskId, tag.id);
    }

    // Unassign removed tags
    for (const tag of removedTags) {
      if (tag.id) await unassignTaskTag(taskId, tag.id);
    }

    setOriginalData(formData);
    router.refresh();
  };

  const handleDiscard = () => {
    setFormData(originalData);
  };

  if (!formData) return <p>Loading...</p>;

  return (
    <MainLayout>
      <div className="bg-[#f5f6f8] w-full p-4 h-full">
        <div className="flex gap-4 w-fit flex-row-reverse items-center">
          {isDirty && (
            <div className="flex gap-2 items-center">
              <Button onClick={handleSave} className="h-8 hover:bg-green-600">
                <SaveIcon /> Save
              </Button>
              <Button onClick={handleDiscard} variant="outline" className="h-8">
                <XIcon /> Discard
              </Button>
            </div>
          )}
          <Breadcrumb className="text-sm">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Projects</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <SlashIcon />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/project/${projectId}/tasks`}>
                    {project?.name || `Project ${projectId}`}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <SlashIcon />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{formData.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex h-[94%] gap-2 justify-between mt-4 w-full ">
          <div className="bg-white w-[68%] h-full border-1 border-solid border-sidebar-border">
            <div className="p-5">
              <input
                value={formData.name || ""}
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
                      initialTags={formData.tags || []}
                      onChange={(tags) => handleChange("tags", tags)}
                    />
                  </div>
                  <div className="w-full flex items-center gap-10 mt-4">
                    <label htmlFor="date" className="text-sm font-medium">
                      Due Date
                    </label>
                    <div className="w-[60%]">
                      <DateRangePicker
                        value={{
                          from: formData.due_date
                            ? new Date(formData.due_date)
                            : undefined,
                          to: undefined, // tasks may only need due_date
                        }}
                        onChange={(range) =>
                          handleChange("due_date", range?.from?.toISOString())
                        }
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
                      value={formData.description || ""}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      className="w-full resize-none text-sm border-0 outline-none h-80"
                      placeholder="Task description..."
                    />
                  ),
                },

                {
                  title: "Assigned Users",
                  content: (
                    <>
                      <AssignUsers taskId={taskId} projectId={projectId} />
                      <div className="mt-4">
                        <AssignedUsersTable taskId={taskId} />
                      </div>
                    </>
                  ),
                },
              ]}
            />
          </div>
          <MessageBox object_type="task" object_id={taskId} />
        </div>
      </div>
    </MainLayout>
  );
}
