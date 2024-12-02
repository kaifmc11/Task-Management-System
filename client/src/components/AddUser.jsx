import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import ModalWrapper from "./ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "./Textbox";
import Button from "./Button";
import { toast } from "sonner";
import { useCreateUserMutation, useUpdateUserMutation } from "../redux/slices/api/userApiSlice";
import { setCredentials } from "../redux/slices/authSlice";
import { useGetTeamsQuery } from "../redux/slices/api/teamApiSlice";
import Loading from "./Loader";

const AddUser = ({ open, setOpen, user }) => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const { data: teams = [], isLoading: loadingTeams } = useGetTeamsQuery();
  const [teamName, setTeamName] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm();

  const selectedTeamId = watch("teamId");

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        title: user.title,
        email: user.email,
        role: user.role,
        teamId: user.team,
        isAdmin: user.isAdmin ? "true" : "false",
        isActive: user.isActive ? "true" : "false",
      });
      setTeamName(user.teamName);
    } else {
      reset({
        name: "",
        title: "",
        email: "",
        role: "",
        teamId: "",
        isAdmin: "false",
        isActive: "true",
      });
      setTeamName("");
    }
  }, [user, reset]);

  useEffect(() => {
    const selectedTeam = teams.find(team => team._id === selectedTeamId);
    if (selectedTeam) {
      setTeamName(selectedTeam.name);
    } else {
      setTeamName("");
    }
  }, [selectedTeamId, teams]);

  const handleOnSubmit = async (data) => {
    try {
      const formattedData = {
        name: data.name,
        email: data.email,
        title: data.title,
        role: data.role,
        team: data.teamId,
        teamName,
        isAdmin: data.isAdmin === "true",
        isActive: data.isActive === "true",
      };

      if (!user) {
        // Create new user
        formattedData.password = data.password;
        const result = await createUser(formattedData).unwrap();
        toast.success("User created successfully");
      } else {
        // Update existing user
        const result = await updateUser({
          id: user._id,
          ...formattedData,
        }).unwrap();
        
        // Update current user's credentials if they're updating their own profile
        if (user._id === currentUser?._id) {
          dispatch(setCredentials({ ...result.user }));
        }
        toast.success("User updated successfully");
      }

      setTimeout(() => {
        setOpen(false);
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error?.data?.message || "Something went wrong");
    }
  };

  const renderFormFields = () => (
    <div className="mt-2 flex flex-col gap-6">
      <Textbox
        placeholder="Full name"
        type="text"
        name="name"
        label="Full Name"
        className="w-full rounded"
        register={register("name", { required: "Full name is required!" })}
        error={errors.name?.message}
      />
      <Textbox
        placeholder="Title"
        type="text"
        name="title"
        label="Title"
        className="w-full rounded"
        register={register("title", { required: "Title is required!" })}
        error={errors.title?.message}
      />
      <Textbox
        placeholder="Email Address"
        type="email"
        name="email"
        label="Email Address"
        className="w-full rounded"
        register={register("email", { required: "Email Address is required!" })}
        error={errors.email?.message}
      />
      <Textbox
        placeholder="Role"
        type="text"
        name="role"
        label="Role"
        className="w-full rounded"
        register={register("role", { required: "User role is required!" })}
        error={errors.role?.message}
      />
      
      <div>
        <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
          Select Team
        </label>
        <select
          id="teamId"
          {...register("teamId", { required: "Team selection is required!" })}
          className="mt-1 block w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Select a team</option>
          {loadingTeams ? (
            <option>Loading teams...</option>
          ) : (
            teams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))
          )}
        </select>
        {errors.teamId && <span className="text-red-500">{errors.teamId.message}</span>}
      </div>

      <div>
        <label htmlFor="isAdmin" className="block text-sm font-medium text-gray-700">
          Admin Status
        </label>
        <select
          id="isAdmin"
          {...register("isAdmin", { required: "Admin status is required!" })}
          className="mt-1 block w-full p-2 border border-gray-300 rounded"
        >
          <option value="false">Not Admin</option>
          <option value="true">Admin</option>
        </select>
        {errors.isAdmin && <p className="text-red-600 text-sm">{errors.isAdmin.message}</p>}
      </div>

      <div>
        <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
          Active Status
        </label>
        <select
          id="isActive"
          {...register("isActive", { required: "Active status is required!" })}
          className="mt-1 block w-full p-2 border border-gray-300 rounded"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {errors.isActive && <p className="text-red-600 text-sm">{errors.isActive.message}</p>}
      </div>

      {!user && (
        <Textbox
          placeholder="Password"
          type="password"
          name="password"
          label="Password"
          className="w-full rounded"
          register={register("password", {
            required: "Password is required!",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters long!",
            },
          })}
          error={errors.password?.message}
        />
      )}
    </div>
  );

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(handleOnSubmit)}>
        <Dialog.Title as="h2" className="text-base font-bold leading-6 text-gray-900 mb-4">
          {user ? "UPDATE USER" : "CREATE NEW USER"}
        </Dialog.Title>
        
        {renderFormFields()}

        {(isCreating || isUpdating) ? (
          <div className="py-5">
            <Loading />
          </div>
        ) : (
          <div className="py-3 mt-4 sm:flex sm:flex-row-reverse">
            <Button
              type="submit"
              className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
              label={user ? "Update" : "Create User"}
            />
            <Button
              type="button"
              className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
              onClick={() => setOpen(false)}
              label="Cancel"
            />
          </div>
        )}
      </form>
    </ModalWrapper>
  );
};

export default AddUser;