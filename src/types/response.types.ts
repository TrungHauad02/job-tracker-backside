export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedData<T> {
	content: T[];
	totalItems: number;
	totalPages: number;
	currentPage: number;
	totalElements: number;
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}
