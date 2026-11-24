import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import CustomSelect from "./common/CustomSelect";
import ProjectSelector from "./common/ProjectSelector";
import { inputStyle } from "./projects/RecentProjects";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMaterialRequestApi } from "../api/projects.api";
import Modal from "./common/Modal";

type IssueReportingModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate?: (data: unknown) => void;
};

const requestMaterialSchema = z.object({
  requiredBy: z.any().refine((val) => val !== null && dayjs(val).isValid(), {
    message: "Required by date is required",
  }),
  project: z.string().min(1, "Project is required"),
  priority: z.string().min(1, "Priority is required"),
  siteLocation: z.string().min(1, "Site Location is required"),
  department: z.string().min(1, "Department is required"),
  material: z.string().min(1, "Material name is required"),
  quantity: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, {
    message: "Quantity must be a valid number greater than 0",
  }),
  unit: z.string().min(1, "Unit is required"),
  notes: z.string().optional(),
});

type RequestMaterialFormValues = z.infer<typeof requestMaterialSchema>;

export default function RequestMaterialModel({
  open,
  onClose,
  onCreate,
}: IssueReportingModalProps) {
  const [serverError, setServerError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestMaterialFormValues>({
    resolver: zodResolver(requestMaterialSchema),
    defaultValues: {
      requiredBy: null,
      project: "",
      priority: "high",
      siteLocation: "site-a",
      department: "Framing",
      material: "",
      quantity: "",
      unit: "pcs",
      notes: "",
    },
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createMaterialRequestApi,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["material-requests"] });
      onCreate?.(res.data);
      handleClose();
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || err?.message || "Failed to submit request";
      setServerError(errMsg);
    },
  });

  const handleClose = () => {
    reset();
    setServerError("");
    onClose();
  };

  const onSubmit = (values: RequestMaterialFormValues) => {
    setServerError("");
    mutation.mutate({
      leadId: values.project,
      siteLocation: values.siteLocation === "site-a" ? "Construction Site A" : "Construction Site B",
      department: values.department,
      requestedItems: [
        {
          name: values.material,
          quantity: parseFloat(values.quantity),
          unit: values.unit,
          notes: values.notes || "",
        },
      ],
      requiredBy: dayjs(values.requiredBy).format("YYYY-MM-DD"),
      priority: values.priority,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Modal
        tourId="request-material-modal"
        open={open}
        onClose={handleClose}
        containerClassName="md:max-w-[640px] p-0 max-h-[85vh]"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="lg:px-6 px-3 py-4 border-b">
            <h2 className="text-lg font-bold text-[#111827]">
              Request Material
            </h2>
            {serverError && (
              <p className="text-sm text-red-600 mt-2 font-medium">{serverError}</p>
            )}
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className="text-sm font-medium text-[#111827] mb-2 block">
                  Requested Date (Auto-fill)
                </label>
                <input
                  readOnly
                  value={dayjs().format("DD-MM-YYYY")}
                  className="w-full h-[44px] rounded-[10px] border border-gray-200 px-4 outline-none text-sm bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#111827] mb-2 block">
                  Required By
                </label>
                <Controller
                  name="requiredBy"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      format="DD-MM-YYYY"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          placeholder: "dd - mm - yyyy",
                          error: !!errors.requiredBy,
                          helperText: errors.requiredBy?.message ? String(errors.requiredBy.message) : "",
                          sx: {
                            ...inputStyle,
                            "& .MuiOutlinedInput-root": {
                              ...inputStyle["& .MuiOutlinedInput-root"],
                              borderRadius: "10px",
                              height: "44px",
                            }
                          },
                        },
                      }}
                    />
                  )}
                />
              </div>

              <div className="md:col-start-1">
                <label className="text-sm font-medium text-[#111827] block mb-2">
                  Project
                </label>
                <Controller
                  name="project"
                  control={control}
                  render={({ field }) => (
                    <ProjectSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.project && (
                  <p className="text-xs text-red-500 mt-1">{errors.project.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-[#111827] block mb-2">
                  Select Priority
                </label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      title="Select Priority"
                      options={[
                        { label: "High", value: "high" },
                        { label: "Medium", value: "medium" },
                        { label: "Low", value: "low" },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      width="100%"
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#111827] block mb-2">
                  Site Location
                </label>
                <Controller
                  name="siteLocation"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      title="Select Site"
                      options={[
                        { label: "Construction Site A", value: "site-a" },
                        { label: "Construction Site B", value: "site-b" },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      width="100%"
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#111827] block mb-2">
                  Department
                </label>
                <input
                  {...register("department")}
                  placeholder="e.g., Framing"
                  className={`w-full h-[44px] rounded-[10px] border px-4 outline-none text-sm ${errors.department ? "border-red-500" : "border-gray-200"
                    }`}
                />
                {errors.department && (
                  <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-5">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[#111827] mb-2 block">Material Name</label>
                <input
                  {...register("material")}
                  placeholder="e.g., Steel Studs"
                  className={`w-full h-[44px] rounded-[10px] border px-4 outline-none text-sm ${errors.material ? "border-red-500" : "border-gray-200"
                    }`}
                />
                {errors.material && (
                  <p className="text-xs text-red-500 mt-1">{errors.material.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-[#111827] mb-2 block">Quantity</label>
                <div className="flex gap-2">
                  <input
                    {...register("quantity")}
                    placeholder="100"
                    type="number"
                    className={`w-full h-[44px] rounded-[10px] border px-3 outline-none text-sm ${errors.quantity ? "border-red-500" : "border-gray-200"
                      }`}
                  />
                  <select
                    {...register("unit")}
                    className="h-[44px] rounded-[10px] border border-gray-200 px-2 outline-none text-sm bg-white text-gray-700"
                  >
                    <option value="pcs">pcs</option>
                    <option value="bags">bags</option>
                    <option value="lbs">lbs</option>
                    <option value="feet">feet</option>
                  </select>
                </div>
                {errors.quantity && (
                  <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#111827] mb-2 block">Notes</label>
              <textarea
                {...register("notes")}
                placeholder="Optional notes..."
                rows={2}
                className="w-full rounded-[10px] border border-gray-200 p-3 outline-none text-sm resize-none"
              />
            </div>
          </div>

          <div className="px-6 py-6 border-t flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-2.5 rounded-[12px] bg-[#F3F4F6] text-[#111827] font-medium text-sm hover:bg-gray-200 transition-colors"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              data-tour="request-material-submit"
              type="submit"
              className="px-8 py-2.5 rounded-[12px] bg-[#2563EB] text-white font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </LocalizationProvider>
  );
}
