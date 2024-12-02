import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { FaUser, FaUserLock } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getInitials } from "../utils/index.js";
import { toast } from "sonner";
import { useLogoutMutation } from "../redux/slices/api/authApiSlice.js";
import { logout } from "../redux/slices/authSlice.js";
import UserProfile  from "./UserProfile.jsx"; 
import ChangePassword from "./ChangePassword.jsx";

const UserAvatar = () => {
  const [openProfile, setOpenProfile] = useState(false); 
  const [openPassword, setOpenPassword] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [logoutUser] = useLogoutMutation();

  const logoutHandler = async () => {
    try {
      await logoutUser().unwrap();
      dispatch(logout());
      navigate("/log-in");
    } catch (error) {
      toast.error("Something went wrong", error);
    }
  };

  return (
    <>
      <div className="relative">
        <Menu as="div" className="relative inline-block text-left">
          <div>
          <Menu.Button className="inline-flex w-9 h-9 justify-center items-center rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-sm font-semibold text-white hover:from-blue-500 hover:to-blue-700 focus:outline-none transition duration-150 ease-in-out">
            {user?.name ? getInitials(user.name) : "?"}
          </Menu.Button>
         </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="z-10 absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setOpenProfile(true)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } text-gray-700 group flex w-full items-center rounded-md px-2 py-2 text-base`}
                    >
                      <FaUser className="mr-2" />
                      View Profile
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setOpenPassword(true)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } text-gray-700 group flex w-full items-center rounded-md px-2 py-2 text-base`}
                    >
                      <FaUserLock className="mr-2" />
                      Change Password
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logoutHandler}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } text-gray-700 group flex w-full items-center rounded-md px-2 py-2 text-base`}
                    >
                      <IoLogOutOutline className="mr-2" />
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <UserProfile open={openProfile} setOpen={setOpenProfile} userData={user} />
      <ChangePassword open={openPassword} setOpen={setOpenPassword} />
    </>
  );
};

export default UserAvatar;