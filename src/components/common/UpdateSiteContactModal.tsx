import { useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { updateSiteContactApi } from "../../api/projects.api";

const siteContactSchema = z.object({
  contactName: z.string().min(1, "Please enter a contact name"),
  contactTitle: z.string().optional(),
  phone: z.string().min(1, "Please enter a phone number"),
  email: z
    .string()
    .min(1, "Please enter an email address")
    .email("Please enter a valid email address"),
  availableHours: z.string().optional(),
  notes: z.string().optional(),
});

type SiteContactFormValues = z.infer<typeof siteContactSchema>;

type UpdateSiteContactModalProps = {
  open: boolean;
  onClose: () => void;
  deliveryId?: string;
  deliveryNumber?: string;
  projectName?: string;
  initialData?: {
    contactName?: string;
    contactTitle?: string;
    phone?: string;
    email?: string;
    availableHours?: string;
    notes?: string;
  };
};

export default function UpdateSiteContactModal({
  open,
  onClose,
  deliveryId,
  deliveryNumber,
  projectName,
  initialData,
}: UpdateSiteContactModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SiteContactFormValues>({
    resolver: zodResolver(siteContactSchema),
    defaultValues: {
      contactName: "",
      contactTitle: "",
      phone: "",
      email: "",
      availableHours: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        contactName: initialData?.contactName || "",
        contactTitle: initialData?.contactTitle || "",
        phone: initialData?.phone || "",
        email: initialData?.email || "",
        availableHours: initialData?.availableHours || "",
        notes: initialData?.notes || "",
      });
    }
  }, [open, initialData, reset]);

  const mutation = useMutation({
    mutationFn: (payload: SiteContactFormValues) =>
      updateSiteContactApi(deliveryId!, payload),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Site contact updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update site contact",
      );
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: SiteContactFormValues) => {
    if (!deliveryId) {
      toast.error("No delivery selected");
      return;
    }
    mutation.mutate(values);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      containerClassName="max-w-[600px] p-5"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="flex items-start justify-between ">
          <div>
            <h2 className="text-2xl font-bold text-[#111827] mb-1">
              Update Site Contact
            </h2>
            <p className="text-sm font-medium text-gray-400">
              {deliveryNumber || deliveryId || "DEL-2001"}
              {projectName ? ` - ${projectName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors mt-1"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className=" space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div>
              <label className="text-sm font-bold text-[#111827] mb-2.5 block">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter contact name"
                className={`w-full h-[52px] rounded-xl border px-5 outline-none text-base placeholder:text-gray-400 focus:border-blue-500 transition-colors shadow-sm ${
                  errors.contactName ? "border-red-500" : "border-gray-200"
                }`}
                {...register("contactName")}
              />
              {errors.contactName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.contactName.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-bold text-[#111827] mb-2.5 block">
                Contact Title
              </label>
              <input
                type="text"
                placeholder="Enter job title"
                className="w-full h-[52px] rounded-xl border border-gray-200 px-5 outline-none text-base placeholder:text-gray-400 focus:border-blue-500 transition-colors shadow-sm"
                {...register("contactTitle")}
              />
            </div>
            <div>
              <label className="text-sm font-bold text-[#111827] mb-2.5 block">
                Phone number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="(555) 123-4567"
                className={`w-full h-[52px] rounded-xl border px-5 outline-none text-base placeholder:text-gray-400 focus:border-blue-500 transition-colors shadow-sm ${
                  errors.phone ? "border-red-500" : "border-gray-200"
                }`}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-bold text-[#111827] mb-2.5 block">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="contact@company.com"
                className={`w-full h-[52px] rounded-xl border px-5 outline-none text-base placeholder:text-gray-400 focus:border-blue-500 transition-colors shadow-sm ${
                  errors.email ? "border-red-500" : "border-gray-200"
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-[#111827] mb-2.5 block">
              Available hours
            </label>
            <input
              type="text"
              placeholder="e.g., 7:00 AM - 5:00 PM, Mon-Fri"
              className="w-full h-[52px] rounded-xl border border-gray-200 px-5 outline-none text-base placeholder:text-gray-400 focus:border-blue-500 transition-colors shadow-sm"
              {...register("availableHours")}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-[#111827] mb-2.5 block">
              Additional Notes
            </label>
            <textarea
              placeholder="Additional notes about this contact..."
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-5 py-4 outline-none text-base placeholder:text-gray-400 focus:border-blue-500 transition-colors shadow-sm resize-none"
              {...register("notes")}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1D51A4] text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-all shadow-md disabled:opacity-50"
            >
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
