import React, { useState } from "react";
import Title from "../components/Title";
import Button from "../components/Button";
import { IoMdAdd } from "react-icons/io";
import { getInitials } from "../utils";
import clsx from "clsx";
import ConfirmationDialog, { UserAction } from "../components/Dialogs";
import AddUser from "../components/AddUser";
import AddTeam from "../components/AddTeam";
import {
  useDeleteUserMutation,
  useGetTeamListQuery,
  useUserActionMutation,
  useGetCurrentUserQuery,
  useUpdateUserMutation,
} from "../redux/slices/api/userApiSlice";
import { 
  useGetTeamsQuery,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useCreateTeamMutation,
} from "../redux/slices/api/teamApiSlice"; 
import { toast } from "sonner";
import UserApprovalTable from "../components/UserApprovalTable";

const Users = () => {
  // State management
  const [openDialog, setOpenDialog] = useState(false);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openTeamDialog, setOpenTeamDialog] = useState(false);
  const [openAction, setOpenAction] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationType, setConfirmationType] = useState("delete");

  // API hooks
  const { data: teamsData, isLoading: isTeamsLoading, refetch: refetchTeams } = useGetTeamsQuery();
  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsers } = useGetTeamListQuery();
  const {data: currentUser} = useGetCurrentUserQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [userAction] = useUserActionMutation();
  const [updateTeam] = useUpdateTeamMutation();
  const [deleteTeam] = useDeleteTeamMutation();
  const [createTeam] = useCreateTeamMutation();

  // User actions handlers
  const userActionHandler = async () => {
    try {
      const result = await userAction({
        isActive: !selectedUser?.isActive,
        id: selectedUser?._id,
      });

      if (result.data) {
        await refetchUsers();
        toast.success(result.data.message);
        setSelectedUser(null);
        setOpenAction(false);
      } else if (result.error) {
        throw new Error(result.error.data?.message || "An error occurred");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    }
  };

  const deleteUserHandler = async () => {
    try {
      const result = await deleteUser(selectedUser._id);

      if (result.data) {
        await Promise.all([refetchUsers(), refetchTeams()]);
        toast.success("User Deleted Successfully");
        setSelectedUser(null);
        setOpenDialog(false);
      } else if (result.error) {
        throw new Error(result.error.data?.message || "An error occurred");
      }
    } catch (error) {
      toast.error(error.message || "Error deleting user");
    }
  };

  // Team actions handlers
  const deleteTeamHandler = async () => {
    try {
      const result = await deleteTeam(selectedTeam._id);

      if (result.data) {
        await refetchTeams();
        toast.success("Team Deleted Successfully");
        setSelectedTeam(null);
        setOpenDialog(false);
      } else if (result.error) {
        throw new Error(result.error.data?.message || "An error occurred");
      }
    } catch (error) {
      toast.error(error.message || "Error deleting team");
    }
  };

  const handleTeamAdded = async (teamData) => {
    try {
      const payload = {
        name: teamData.name,
        createdBy: teamData.createdBy._id,
        members: teamData.members.map(member => member._id)
      };

      let result;
      if (isEditingTeam) {
        result = await updateTeam({ 
          id: selectedTeam._id,
          ...payload
        });
      } else {
        result = await createTeam(payload);
      }

      if (result.data) {
        await refetchTeams();
        toast.success(isEditingTeam ? "Team Updated Successfully" : "Team Created Successfully");
        setOpenTeamDialog(false);
      } else if (result.error) {
        throw new Error(result.error.data?.message || "An error occurred");
      }
    } catch (error) {
      toast.error(error.message || "Error managing team");
    }
  };

  const handleUserAdded = async (userData) => {
    try {
      if (selectedUser) {
        result = await updateUser({ 
          id: selectedUser._id,
          ...userData,
          teamId: userData.team?._id
        });
        
        if (result.data) {
          await Promise.all([refetchUsers(), refetchTeams()]);
          toast.success("User Updated Successfully");
          console.log(result.data)
          setOpenUserDialog(false);
        } else if (result.error) {
          throw new Error(result.error.data?.message || "An error occurred");
        }
      }
    } catch (error) {
      toast.error(error.message || "Error updating user");
    }
  };

  // UI action handlers
  const deleteClick = (item, isTeam = false) => {
    if (isTeam) {
      setSelectedTeam(item);
      setConfirmationMessage(`Are you sure you want to delete the team "${item.name}"?`);
    } else {
      setSelectedUser(item);
      setConfirmationMessage(`Are you sure you want to delete the user "${item.name}"?`);
    }
    setConfirmationType("delete");
    setOpenDialog(true);
  };

  const editClick = (item, isTeam = false) => {
    if (isTeam) {
      setSelectedTeam(item);
      setIsEditingTeam(true);
    } else {
      setSelectedUser(item);
    }
    isTeam ? setOpenTeamDialog(true) : setOpenUserDialog(true);
  };

  const userStatusClick = (user) => {
    setSelectedUser(user);
    setOpenAction(true);
  };

  const openAddTeamModal = () => {
    setIsEditingTeam(false);
    setSelectedTeam(null);
    setOpenTeamDialog(true);
  };

  // Table Components
  const UserTableHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">S.NO</th>
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Full Name</th>
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Team</th>
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Active</th>
        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  );

  const UserTableRow = ({ user, index }) => (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500">{index + 1}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {getInitials(user.name)}
              </span>
            </div>
          </div>
          <div className="font-medium text-gray-900">{user.name}</div>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">{user.title}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">{user.email}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">{user.role}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
          {user.teamName || "No team"}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <button
          onClick={() => userStatusClick(user)}
          className={clsx(
            "inline-flex rounded-full px-3 py-1 text-sm font-semibold",
            user?.isActive 
              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
              : "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20"
          )}
        >
          {user?.isActive ? "Active" : "Disabled"}
        </button>
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <div className="flex justify-end gap-3">
          <button
            onClick={() => editClick(user)}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </button>
          <button
            onClick={() => deleteClick(user)}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  const TeamTableHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">S.No</th>
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Team Name</th>
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created By</th>
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Members</th>
        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  );

  const TeamTableRow = ({ team, index }) => (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500">{index + 1}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{team.name}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 flex-shrink-0">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {getInitials(team.createdBy?.name)}
              </span>
            </div>
          </div>
          <span className="font-medium text-gray-900">{team.createdBy?.name || "N/A"}</span>
        </div>
      </td>
      <td className="px-3 py-4 text-sm text-gray-600">
        {team.members && team.members.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {team.members.map((member) => (
              <span 
                key={member._id}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
              >
                <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-xs text-white">{getInitials(member.name)}</span>
                </div>
                {member.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">No members</span>
        )}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <div className="flex justify-end gap-3">
          <button
            onClick={() => editClick(team, true)}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </button>
          <button
            onClick={() => deleteClick(team, true)}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Title title="Team Members" />
          <div className="flex gap-4">
            <Button
              label="Add Team"
              icon={<IoMdAdd className="text-lg" />}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              onClick={openAddTeamModal}
            />
            <Button
              label="Add New User"
              icon={<IoMdAdd className="text-lg" />}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              onClick={() => setOpenUserDialog(true)}
            />
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div className="mb-8 overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-semibold leading-6 text-gray-900 mb-4">Pending Approvals</h2>
            <UserApprovalTable />
          </div>
        </div>

        {/* Users Table */}
        <div className="mb-8 overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              {isUsersLoading ? (
                <div className="text-center py-4 text-gray-600">Loading users...</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <UserTableHeader />
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {usersData?.length ? (
                      usersData.map((user, index) => (
                        <UserTableRow key={user._id} user={user} index={index} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-gray-600">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Teams Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-semibold leading-6 text-gray-900 mb-4">Teams</h2>
            <div className="overflow-x-auto">
              {isTeamsLoading ? (
                <div className="text-center py-4 text-gray-600">Loading teams...</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <TeamTableHeader />
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {teamsData?.length ? (
                      teamsData.map((team, index) => (
                        <TeamTableRow key={team._id} team={team} index={index} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-gray-600">
                          No teams found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs remain unchanged */}
      <ConfirmationDialog
        open={openDialog}
        setOpen={setOpenDialog}
        msg={confirmationMessage}
        setMsg={setConfirmationMessage}
        onClick={selectedUser ? deleteUserHandler : deleteTeamHandler}
        type={confirmationType}
        setType={setConfirmationType}
      />
      <AddUser
        open={openUserDialog}
        setOpen={setOpenUserDialog}
        onUserAdded={handleUserAdded}
        user={selectedUser}
      />
      <AddTeam
        open={openTeamDialog}
        setOpen={setOpenTeamDialog}
        onTeamAdded={handleTeamAdded}
        team={selectedTeam}
        isEditing={isEditingTeam}
        currentUser={currentUser}
      />
      <UserAction
        open={openAction}
        setOpen={setOpenAction}
        onClick={userActionHandler}
      />
    </div>
  );
};

export default Users;