import { apiSlice } from "../apiSlice";

const TEAM_URL = '/teams'; 

export const teamApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createTeam: builder.mutation({
            query: (teamData) => ({
                url: TEAM_URL,
                method: "POST",
                body: teamData,
                credentials: "include", 
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // You can handle successful team creation here if needed
                } catch (error) {
                    console.error("Failed to create team: ", error);
                }
            },
        }),
        
        // Get the list of teams
        getTeams: builder.query({
            query: () => ({
                url: TEAM_URL,
                method: "GET",
                credentials: "include", 
            }),
        }),
        
        // Update an existing team
        updateTeam: builder.mutation({
            query: (data) => ({
                url: `${TEAM_URL}/${data.id}`, // Dynamic URL for updating the specific team
                method: "PUT",
                body: data,
                credentials: "include", 
            }),
        }),
        
        // Delete a team
        deleteTeam: builder.mutation({
            query: (id) => ({
                url: `${TEAM_URL}/${id}`, // Dynamic URL for deleting the specific team
                method: "DELETE",
                credentials: "include", 
            }),
        }),
    }),
});

// Export hooks for each endpoint to be used in components
export const {
    useCreateTeamMutation,
    useGetTeamsQuery,
    useUpdateTeamMutation,
    useDeleteTeamMutation,
} = teamApiSlice;
