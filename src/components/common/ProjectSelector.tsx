import { useQuery } from "@tanstack/react-query";
import { getProjectsApi } from "../../api/projects.api";
import CustomSelect from "./CustomSelect";

interface ProjectSelectorProps {
  value: string;
  onChange: (val: string) => void;
  showAllOption?: boolean;
  width?: string;
  hasDelivery?: boolean;
}

export default function ProjectSelector({
  value,
  onChange,
  showAllOption = false,
  width = "100%",
  hasDelivery,
}: ProjectSelectorProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["projects-selector-list", hasDelivery],
    queryFn: () => getProjectsApi({ page: 1, limit: 100, hasDelivery }),
  });

  const projects = data?.data?.data?.projects || [];

  const effectiveValue =
    projects.find((p) => p._id === value || (p.leadId && p.leadId === value))?._id || value;

  const options = projects.map((proj) => ({
    label: proj.projectName || `${proj.buildingType || "Project"} - ${proj.location || "Site"} (${proj.jobId})`,
    value: proj._id,
  }));

  if (showAllOption) {
    options.unshift({ label: "All Projects", value: "" });
  }

  return (
    <CustomSelect
      title="Select Project"
      options={options}
      value={effectiveValue}
      onChange={onChange}
      width={width}
      searchable
      loading={isLoading}
    />
  );
}
