import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import CustomSelect from "./common/CustomSelect";
import ProjectSelector from "./common/ProjectSelector";
import Modal from "./common/Modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTaskApi } from "../api/projects.api";

type IssueReportingModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
};

const priorityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const statusOptions = [
  { label: "To Do", value: "todo" },
  { label: "In Progress", value: "inProgress" },
  { label: "Done", value: "done" },
];

const createTaskSchema = z.object({
  taskName: z.string().min(1, "Task name is required"),
  selectedProject: z.string().min(1, "Project is required"),
  priority: z.string().min(1, "Priority is required"),
  taskStatus: z.string().min(1, "Status is required"),
  deadline: z.string().min(1, "Deadline is required"),
  description: z.string().min(1, "Description is required"),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

export default function NewTaskModel({
  open,
  onClose,
  onSubmit,
}: IssueReportingModalProps) {
  const [serverError, setServerError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      taskName: "",
      selectedProject: "",
      priority: "medium",
      taskStatus: "todo",
      deadline: "",
      description: "",
    },
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createTaskApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSubmit({
        taskName: variables.title,
        project: variables.leadId,
        assignedTo: variables.assignedTo || "Unassigned",
        priority: variables.priority,
        status: variables.status === "in_progress" ? "inProgress" : variables.status,
        deadline: variables.dueDate,
        description: variables.description,
      });
      onClose();
      reset();
      setServerError("");
    },
    onError: (err: unknown) => {
      const responseErr = err as { response?: { data?: { message?: string } } };
      const errMsg = responseErr?.response?.data?.message
        || (err instanceof Error ? err.message : "Failed to create task");
      setServerError(errMsg);
    },
  });

  const onFormSubmit = (values: CreateTaskFormValues) => {
    mutation.mutate({
      title: values.taskName,
      description: values.description,
      leadId: values.selectedProject,
      assignedTo: null,
      priority: values.priority,
      status: values.taskStatus === "inProgress" ? "in_progress" : values.taskStatus,
      dueDate: values.deadline,
    });
  };

  const handleCancel = () => {
    reset();
    setServerError("");
    onClose();
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      containerClassName="max-h-[98vh] max-w-[550px] overflow-auto scroll-hide"
    >
        <div className="lg:px-6 px-3 py-4 border-b">
          <h2 className="text-lg font-semibold text-[#111827]">New Task</h2>
          {serverError && (
            <p className="text-sm text-red-600 mt-2 font-medium">{serverError}</p>
          )}
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#111827]">Task Name</label>
              <input
                {...register("taskName")}
                placeholder="Enter"
                className={`mt-2 w-full h-[40px] rounded-[8px] border px-4 outline-none text-sm ${errors.taskName ? "border-red-500 focus:border-red-500" : "border-gray-200"
                  }`}
              />
              {errors.taskName && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.taskName.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-[#111827] inline-block mb-2">
                Project
              </label>
              <Controller
                name="selectedProject"
                control={control}
                render={({ field }) => (
                  <ProjectSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.selectedProject && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.selectedProject.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#111827] inline-block mb-2">
                Priority
              </label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    title="Select Priority"
                    options={priorityOptions}
                    value={field.value}
                    onChange={field.onChange}
                    width="100%"
                  />
                )}
              />
              {errors.priority && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.priority.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-[#111827] inline-block mb-2">
                Status
              </label>
              <Controller
                name="taskStatus"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    title="Select Status"
                    options={statusOptions}
                    value={field.value}
                    onChange={field.onChange}
                    width="100%"
                  />
                )}
              />
              {errors.taskStatus && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.taskStatus.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-[#111827]">Deadline</label>
            <input
              type="date"
              {...register("deadline")}
              placeholder="dd - mm - yyyy"
              className={`mt-2 w-full h-[40px] rounded-[8px] border px-4 outline-none text-sm ${errors.deadline ? "border-red-500 focus:border-red-500" : "border-gray-200"
                }`}
            />
            {errors.deadline && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.deadline.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-[#111827]">Description</label>
            <textarea
              {...register("description")}
              placeholder="Describe the work"
              rows={4}
              className={`mt-2 w-full rounded-[8px] border px-4 py-3 outline-none resize-none text-sm ${errors.description ? "border-red-500 focus:border-red-500" : "border-gray-200"
                }`}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.description.message}</p>
            )}
          </div>

          <div className="pt-3 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 rounded-lg bg-[#F3F4F6] text-[#111827]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 rounded-lg bg-[#2563EB] text-white flex items-center gap-2 disabled:opacity-50"
            >
              {mutation.isPending ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
