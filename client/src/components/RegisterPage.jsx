import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useRegisterMutation } from "../redux/slices/api/authApiSlice";
import { useGetTeamsQuery } from "../redux/slices/api/teamApiSlice";
import { toast } from "sonner";
import Loading from "./Loader";

const RegisterPage = ({ show, onClose, onRegistrationSuccess }) => {
  const dispatch = useDispatch();
  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const { data: teams = [], isLoading: loadingTeams } = useGetTeamsQuery();
  const [teamName, setTeamName] = useState("");

  // Watch password fields and teamId for validation
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const selectedTeamId = watch("teamId");

  useEffect(() => {
    const selectedTeam = teams.find(team => team._id === selectedTeamId);
    if (selectedTeam) {
      setTeamName(selectedTeam.name);
    } else {
      setTeamName("");
    }
  }, [selectedTeamId, teams]);

  const onSubmit = async (data) => {
    try {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match!");
        return;
      }

      // Prepare user data
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        title: data.title,
        role: data.role || "user",
        teamId: data.teamId,
        teamName,
        isAdmin: false,
        isActive: true
      };

      // Register user
      const result = await registerUser(userData).unwrap();
      
      if (result) {
        toast.success("Registration successful! Please wait until the admin activates your account.");
        reset();
        onClose();
        if (onRegistrationSuccess) {
          onRegistrationSuccess(data.email);
        }
      }
    } catch (error) {
      toast.error(error?.data?.message || "Registration failed. Please try again.");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Register New User</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              {...register("name", {
                required: "Full name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters"
                }
              })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              {...register("title", {
                required: "Title is required"
              })}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              {...register("role", {
                required: "Role is required"
              })}
            />
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Team Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Team
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              {...register("teamId", { required: "Team selection is required" })}
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
            {errors.teamId && (
              <p className="text-red-500 text-sm mt-1">{errors.teamId.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters"
                }
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: value => value === password || "Passwords do not match"
              })}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || loadingTeams}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;