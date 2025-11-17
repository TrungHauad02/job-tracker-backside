export interface Job {
  id: string;
  jobTitle: string;
  companyName: string;
  applicationLink: string;
  companyLink?: string;
  requirements: string;
  jobDescription: string;
  status: JobStatus;
  notes: string;
  appliedDate: string;
  createdAt: string;
  updatedAt: string;
}

export type JobStatus = "Pending" | "Reject" | "Interview" | "Hired";

export interface CreateJobDTO {
  jobTitle: string;
  companyName: string;
  applicationLink: string;
  companyLink?: string;
  requirements: string;
  jobDescription: string;
  status: JobStatus;
  notes: string;
  appliedDate: string;
}

export interface UpdateJobDTO extends Partial<CreateJobDTO> {}
