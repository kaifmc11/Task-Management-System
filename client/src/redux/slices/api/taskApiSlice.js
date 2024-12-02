import { apiSlice } from "../apiSlice";

const TASKS_URL = "/task";

export const taskApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // File Upload Endpoint
        uploadFile: builder.mutation({
            query: ({ formData, taskId }) => ({
                url: `${TASKS_URL}/upload`,
                method: 'POST',
                body: formData,
                credentials: "include",
            }),
            invalidatesTags: (result, error, { taskId }) => [
                { type: 'TaskFiles', id: taskId },
                { type: 'Task', id: taskId }
            ]
        }),

        // Get File Endpoint
        getFile: builder.query({
            query: (fileId) => ({
                url: `${TASKS_URL}/files/${fileId}`,
                method: 'GET',
                credentials: "include",
                responseHandler: async (response) => {
                    const blob = await response.blob();
                    return URL.createObjectURL(blob);
                },
            }),
        }),

        // Delete File Endpoint
        deleteFile: builder.mutation({
            query: ({ taskId, fileId }) => ({
              url: `${TASKS_URL}/${taskId}/files/${fileId}`,
              method: 'DELETE',
              credentials: "include",
            }),
            invalidatesTags: ['TaskFiles']
          }),

        // Get Task Files Endpoint
        getTaskFiles: builder.query({
            query: (taskId) => ({
                url: `${TASKS_URL}/task-files/${taskId}`,
                method: 'GET',
                credentials: "include",
            }),
            providesTags: (result, error, taskId) => 
                [{ type: 'TaskFiles', id: taskId }],
        }),

        // Dashboard Statistics
        getDashboardStats: builder.query({
            query: () => ({
                url: `${TASKS_URL}/dashboard`,
                method: "GET",
                credentials: "include",
            }),
            providesTags: ['DashboardStats']
        }),

        // Get All Tasks
        getAllTasks: builder.query({
            query: ({ stage = '', isTrashed = false, search = '' }) => ({
                url: `${TASKS_URL}`,
                method: 'GET',
                credentials: "include",
                params: {
                    stage,
                    isTrashed: isTrashed.toString(),
                    search
                }
            }),
            transformResponse: (response) => ({
                tasks: response.tasks || [],
                count: response.count || 0,
                metadata: response.metadata || {}
            }),
            providesTags: ['Tasks']
        }),

        // Create Task
        createTask: builder.mutation({
            query: (data) => ({
                url: `${TASKS_URL}/create`,
                method: 'POST',
                body: data,
                credentials: "include",
            }),
            invalidatesTags: ['Tasks', 'DashboardStats']
        }),

        // Duplicate Task
        duplicateTask: builder.mutation({
            query: (id) => ({
                url: `${TASKS_URL}/duplicate/${id}`,
                method: 'POST',
                credentials: "include",
            }),
            invalidatesTags: ['Tasks', 'DashboardStats']
        }),

        // Update Task
        updateTask: builder.mutation({
            query: (data) => ({
                url: `${TASKS_URL}/update/${data._id}`,
                method: 'PUT',
                body: data,
                credentials: "include",
            }),
            invalidatesTags: (result, error, { _id }) => [
                'Tasks',
                'DashboardStats',
                { type: 'Task', id: _id },
                { type: 'TaskFiles', id: _id }
            ]
        }),

        // Trash Task
        trashTask: builder.mutation({
            query: ({ id, actionType }) => ({
                url: `${TASKS_URL}/trash/${id}`,
                method: 'PUT',
                body: { isTrashed: actionType === 'delete' },
                credentials: "include",
            }),
            invalidatesTags: ['Tasks', 'DashboardStats']
        }),

        // Create Subtask
        createSubTask: builder.mutation({
            query: ({ id, data }) => ({
                url: `${TASKS_URL}/create-subtask/${id}`,
                method: 'PUT',
                body: data,
                credentials: "include",
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Task', id }
            ]
        }),

        // Get Single Task
        getTask: builder.query({
            query: (id) => ({
                url: `${TASKS_URL}/${id}`,
                method: "GET",
                credentials: "include",
            }),
            providesTags: (result, error, id) => [
                { type: 'Task', id }
            ]
        }),

        // Post Task Activity
        postTaskActivity: builder.mutation({
            query: ({ id, data }) => ({
                url: `${TASKS_URL}/activity/${id}`,
                method: "POST",
                body: data,
                credentials: "include",
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Task', id }
            ]
        }),

        // Delete/Restore Task
        deleteRestoreTask: builder.mutation({
            query: ({ id, actionType }) => ({
                url: `${TASKS_URL}/delete-restore/${id}`,
                method: "DELETE",
                params: { actionType },
                credentials: "include",
            }),
            invalidatesTags: ['Tasks', 'DashboardStats']
        }),
    }),
});

export const {
    useUploadFileMutation,
    useGetFileQuery,
    useDeleteFileMutation,
    useGetTaskFilesQuery,
    useGetDashboardStatsQuery,
    useGetAllTasksQuery,
    useCreateTaskMutation,
    useDuplicateTaskMutation,
    useUpdateTaskMutation,
    useTrashTaskMutation,
    useCreateSubTaskMutation,
    useGetTaskQuery,
    usePostTaskActivityMutation,
    useDeleteRestoreTaskMutation,
} = taskApiSlice;