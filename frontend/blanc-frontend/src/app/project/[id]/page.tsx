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
// import { TableDemo } from "@/lib/components/core/table";
import MessageBox from "@/lib/components/core/chat";
import {
  fetchProjectById,
  updateProject,
  fetchProjectTags,
} from "@/lib/routes/project";
import { fetchTags, createTag, assignTag, unassignTag } from "@/lib/routes/tag"; // 🟢 tag routes
import InviteMembers from "@/lib/components/core/inviteMembers";

export default function ProjectId() {
  const params = useParams();
  const projectId = Number(params?.id);

  const [formData, setFormData] = useState<any | null>(null);
  const [originalData, setOriginalData] = useState<any | null>(null);
  const [availableTags, setAvailableTags] = useState<
    { id?: number; name: string }[]
  >([]); // 🟢

  // fetch project by ID + tags
  useEffect(() => {
    async function loadProject() {
      const project = await fetchProjectById(projectId);

      // 🟢 fetch all tags + assigned tags
      const [allTags, projectTags] = await Promise.all([
        fetchTags(),
        fetchProjectTags(projectId),
      ]);

      setAvailableTags(allTags);
      setFormData({ ...project, tags: projectTags });
      setOriginalData({ ...project, tags: projectTags });
    }
    if (projectId) loadProject();
  }, [projectId]);

  // generic change handler
  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  // check if formData has changed
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  const router = useRouter();

  const handleSave = async () => {
    if (!formData) return;

    // 1. save main project
    await updateProject(projectId, {
      name: formData.name,
      description: formData.description,
      start_date: formData.start_date,
      end_date: formData.end_date,
    });

    // 2. process tags 🟢
    const currentTags = formData.tags || [];
    const originalTags = originalData?.tags || [];

    const newTags = currentTags.filter((t: any) => !t.id);

    // 2. existing tags newly added (in current but not in original)
    const addedExistingTags = currentTags.filter(
      (t: any) => t.id && !originalTags.some((ot: any) => ot.id === t.id)
    );

    // 3. removed tags
    const removedTags = originalTags.filter(
      (t: any) => !currentTags.some((ct: any) => ct.id === t.id)
    );

    // Create + assign brand new tags
    for (const tag of newTags) {
      const created = await createTag(tag.name, "#F5B027");
      await assignTag(projectId, created.id);
    }

    // Assign existing tags that were newly selected
    for (const tag of addedExistingTags) {
      await assignTag(projectId, tag.id);
    }

    // Unassign removed tags
    for (const tag of removedTags) {
      if (tag.id) await unassignTag(projectId, tag.id);
    }

    setOriginalData(formData);
    router.refresh();
  };

  const handleDiscard = () => {
    setFormData(originalData); // reset back to original
  };

  if (!formData) return <p>Loading...</p>;

  return (
    <MainLayout>
      <div className="bg-[#f5f6f8] w-full  p-4 h-full">
        <div className="flex gap-4 w-fit flex-row-reverse  items-center">
          <div className="flex gap-2 items-center">
            {/* only show buttons when dirty */}
            {isDirty && (
              <div className="flex gap-2 items-center">
                <Button onClick={handleSave} className="h-8 hover:bg-green-600">
                  <SaveIcon /> Save
                </Button>
                <Button
                  onClick={handleDiscard}
                  variant="outline"
                  className="h-8"
                >
                  <XIcon /> Discard
                </Button>
              </div>
            )}
          </div>
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
                <BreadcrumbPage>{formData.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex h-[94%] gap-2 justify-between  mt-4 w-full ">
          <div className="bg-white w-[68%]  h-full border-1 border-solid border-sidebar-border">
            {/* title input */}
            <div className="p-5">
              <input
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                type="text"
                className="w-[60%] border-[transparent] text-3xl placeholder:text-3xl placeholder:font-normal font-semibold h-10 border-0 border-b-1   hover:border-gray-400   focus:border-teal-700 outline-none"
                placeholder="eg. Office Party"
                name="name"
                id="name"
              />

              <div className="column w-full  flex mt-5 ">
                <div className=" w-[60%]  ">
                  {/* tags one to many field */}
                  <div className="flex w-full  gap-10">
                    <label htmlFor="tags" className="text-sm font-medium">
                      Tags
                    </label>
                    <TagsInput
                      availableTags={availableTags}
                      initialTags={formData.tags || []} // 🟢
                      onChange={(tags) => handleChange("tags", tags)}
                    />
                  </div>
                  <div className="w-full flex items-center gap-10">
                    <label htmlFor="tags" className="text-sm font-medium">
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
                      value={formData.description || ""}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      className="w-full resize-none text-sm placeholder:text-sm border-0 outline-none h-80"
                      placeholder="Project description..."
                    />
                  ),
                },
                {
                  title: "Project Members",
                  content: <InviteMembers projectId={projectId} />,
                },
              ]}
            />
          </div>
          <MessageBox object_type="project" object_id={projectId} />
        </div>
      </div>
    </MainLayout>
  );
}
