import React, { useState, useEffect, useCallback } from "react";
import { useCreateTeamMutation, useUpdateTeamMutation } from "../redux/slices/api/teamApiSlice";
import { useGetTeamListQuery } from "../redux/slices/api/userApiSlice";
import { toast } from "sonner";
import ModalWrapper from "./ModalWrapper";
import { Dialog } from "@headlessui/react";
import Button from "./Button";
import { Search } from "lucide-react";

const AddTeam = ({ open, setOpen, onTeamAdded, team, isEditing, currentUser }) => {
  const [teamName, setTeamName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation();
  const { data: users, isLoading: isUsersLoading } = useGetTeamListQuery();

  useEffect(() => {
    if (open) {
      if (isEditing && team) {
        setTeamName(team.name);
        setSelectedMembers(team.members?.map(member => member._id) || []);
      } else {
        setTeamName("");
        setSelectedMembers([]);
      }
      setSearchQuery("");
    }
  }, [isEditing, team, open]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    try {
      const teamData = {
        name: teamName.trim(),
        createdBy: currentUser._id, // Using logged-in user as creator
        members: selectedMembers
      };

      let result;
      if (isEditing) {
        result = await updateTeam({ 
          id: team._id, 
          ...teamData 
        }).unwrap();
      } else {
        result = await createTeam(teamData).unwrap();
      }

      setOpen(false);
      
      if (onTeamAdded) {
        onTeamAdded(result);
      }

      toast.success(isEditing ? "Team updated successfully!" : "Team created successfully!");
    } catch (error) {
      console.error("Error processing team:", error);
      toast.error(error.data?.message || error.message || "Error processing team");
    }
  }, [teamName, selectedMembers, isEditing, team, updateTeam, createTeam, setOpen, onTeamAdded, currentUser]);

  const handleMemberChange = useCallback((userId) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  }, []);

  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSubmitDisabled = !teamName.trim() || isCreating || isUpdating;

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
        {isEditing ? "Edit Team" : "Add New Team"}
      </Dialog.Title>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">
            Team Name
          </label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Enter team name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Created By
          </label>
          <div className="mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
            {currentUser?.name || "Unknown User"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Members
          </label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
            {isUsersLoading ? (
              <p className="text-gray-500">Loading users...</p>
            ) : filteredUsers?.length ? (
              filteredUsers.map((user) => (
                <div key={user._id} className="flex items-center gap-2 py-1 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={`user-${user._id}`}
                    checked={selectedMembers.includes(user._id)}
                    onChange={() => handleMemberChange(user._id)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={`user-${user._id}`} className="text-sm flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-gray-500 text-xs">{user.email}</span>
                  </label>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No users found</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button
            type="button"
            onClick={() => setOpen(false)}
            label="Cancel"
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          />
          <Button
            type="submit"
            label={isEditing ? "Update Team" : "Create Team"}
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={isSubmitDisabled}
          />
        </div>
      </form>
    </ModalWrapper>
  );
};

export default AddTeam;