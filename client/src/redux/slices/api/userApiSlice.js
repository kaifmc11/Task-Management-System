import { apiSlice } from "../apiSlice";

const USER_URL = '/user';

export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Get the list of users
        getUsers: builder.query({
            query: () => ({
                url: `${USER_URL}/get-team`,
                method: "GET",
                credentials: "include",
            }),
            providesTags:['Users'],
        }),

        // Add a new user
        createUser: builder.mutation({
            query: (userData) => ({
                url: `${USER_URL}/create`,
                method: "POST",
                body: userData,
                credentials: "include",
            }),
            invalidatesTags: ['Users'],
        }),

        // Update user profile
        updateUser: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `${USER_URL}/update/${id}`,
                method: "PUT",
                body: data,
                credentials: "include",
            }),
            invalidatesTags: ['Users'],
        }),

        getTeamList: builder.query({
            query: () => ({
                url: `${USER_URL}/get-team`,
                method: "GET",
                credentials: "include",
            }),
        }),

        // Delete a user
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `${USER_URL}/${id}`,
                method: "DELETE",
                credentials: "include",
            }),
        }),

        // Perform an action on a user (activate/deactivate)
        userAction: builder.mutation({
            query: (data) => ({
                url: `${USER_URL}/${data.id}`,
                method: "PUT",
                body: { isActive: data.isActive },
                credentials: "include",
            }),
        }),

        // Get user notifications
        getNotifications: builder.query({
            query: () => ({
                url: `${USER_URL}/notifications`, 
                method: "GET",
                credentials: "include",
            }),
        }),

        // Mark notification as read
        markNotiAsRead: builder.mutation({
            query: (data) => ({
                url: `${USER_URL}/read-noti?isReadType=${data.type}&id=${data?.id}`, 
                method: "PUT",
                credentials: "include",
            }),
        }),

        // Change user password
        changePassword: builder.mutation({
            query: (data) => ({
                url: `${USER_URL}/change-password`, 
                method: "PUT",
                body: data,
                credentials: "include",
            }),
        }),

        // Register new user (creates pending approval)
        registerUser: builder.mutation({
            query: (userData) => ({
                url: `${USER_URL}/register`,
                method: "POST",
                body: userData,
                credentials: "include",
            }),
        }),

        // Get all pending approvals
        getPendingApprovals: builder.query({
            query: () => ({
                url: `${USER_URL}/pending-approvals`,
                method: "GET",
                credentials: "include",
            }),
            providesTags: ['PendingUsers'],
        }),

        // Get specific pending user
        getPendingUser: builder.query({
            query: (id) => ({
                url: `${USER_URL}/pending/${id}`,
                method: "GET",
                credentials: "include",
            }),
            providesTags:['PendingUsers']
        }),

        // Approve a pending user
        approveUser: builder.mutation({
            query: (id) => ({
                url: `${USER_URL}/approve/${id}`,
                method: "POST",
                credentials: "include",
            }),
            invalidatesTags: ['PendingUsers','Users'],
        }),

        // Reject a pending user
        rejectUser: builder.mutation({
            query: ({ id, reason }) => ({
                url: `${USER_URL}/reject/${id}`,
                method: "POST",
                body: { reason },
                credentials: "include",
            }),
            invalidatesTags: ['PendingUsers'],
        }),

        getCurrentUser: builder.query({
            query: () => ({
              url: `${USER_URL}/current`,
              method: "GET",
              credentials: "include",
            }),
            transformResponse: (response) => {
              // Transform the response to return just the user object
              return response.user;
            },
            providesTags: ['CurrentUser'],
          }),
    }),
});

// Export hooks for each endpoint
export const {
    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useGetTeamListQuery,
    useDeleteUserMutation,
    useUserActionMutation,
    useGetNotificationsQuery,
    useMarkNotiAsReadMutation,
    useChangePasswordMutation,
    useRegisterUserMutation,
    useGetPendingApprovalsQuery,
    useGetPendingUserQuery,
    useApproveUserMutation,
    useRejectUserMutation,
    useGetCurrentUserQuery,
} = userApiSlice;