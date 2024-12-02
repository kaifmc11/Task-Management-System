import User from "../models/user.js";
import { createJWT } from "../utils/index.js";
import Notice from "../models/notification.js";

// Create user directly (admin only)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin, role, title, team, teamName } = req.body;

    // Check if the user already exists
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }

    // Create a new active user directly
    const user = await User.create({
      name,
      email,
      password,
      isAdmin,
      role,
      title,
      team,
      teamName,
      isActive: true, // Direct creation means user is active by default
    });

    if (user) {
      // Don't send back the password
      user.password = undefined;

      res.status(201).json({
        status: true,
        message: "User created successfully",
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          title: user.title,
          teamName: user.teamName,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
        },
      });
    } else {
      return res
        .status(400)
        .json({ status: false, message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};
// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email }).populate("team", "name");

    // Check if user exists and account is active
    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: false,
        message: "User account has been deactivated, contact the administrator",
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);

    if (user && isMatch) {
      createJWT(res, user._id); // Create a JWT for the user

      user.password = undefined; // Do not return password

      res.status(200).json(user);
    } else {
      return res
        .status(401)
        .json({ status: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Logout user
export const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0), // Expire the token
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Get the list of users
export const getTeamList = async (req, res) => {
  try {
    const users = await User.find().select("name title role email isActive isAdmin team teamName");

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Get notifications for the user
export const getNotificationsList = async (req, res) => {
  try {
    const { userId } = req.user;

    const notice = await Notice.find({
      team: userId,
      isRead: { $nin: [userId] },
    }).populate("task", "title");

    res.status(200).json(notice);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Update user profile
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, title, team, teamName, isAdmin, isActive } = req.body;

    // Find user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    // Update user fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.title = title || user.title;
    user.team = team || user.team;
    user.teamName = teamName || user.teamName;
    
    // Only update these fields if they are explicitly provided
    if (typeof isAdmin === 'boolean') {
      user.isAdmin = isAdmin;
    }
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    // Save the updated user
    const updatedUser = await user.save();

    // Remove password from response
    updatedUser.password = undefined;

    res.status(200).json({
      status: true,
      message: "User updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        title: updatedUser.title,
        team: updatedUser.team,
        teamName: updatedUser.teamName,
        isAdmin: updatedUser.isAdmin,
        isActive: updatedUser.isActive
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(400).json({ 
      status: false, 
      message: error.message 
    });
  }
};

// Mark notifications as read
export const markNotificationRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const { isReadType, id } = req.query;

    if (isReadType === "all") {
      await Notice.updateMany(
        { team: userId, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } },
        { new: true }
      );
    } else {
      await Notice.findOneAndUpdate(
        { _id: id, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } },
        { new: true }
      );
    }

    res.status(200).json({ status: true, message: "Notifications updated" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Change user password
export const changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId);

    if (user) {
      user.password = req.body.password; // Set new password

      await user.save();

      user.password = undefined; // Do not return password

      res.status(200).json({
        status: true,
        message: `Password changed successfully.`,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Activate or deactivate user profile
export const activateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (user) {
      user.isActive = req.body.isActive; // Activate/Deactivate user

      await user.save();

      res.status(200).json({
        status: true,
        message: `User account has been ${
          user.isActive ? "activated" : "disabled"
        }`,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Delete user profile
export const deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.user; // Get userId from auth middleware

    const user = await User.findById(userId)
      .select('name email role title team teamName isActive isAdmin')
      .populate('team', 'name');

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      status: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        team: user.team,
        teamName: user.teamName,
        isActive: user.isActive,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ 
      status: false, 
      message: error.message 
    });
  }
};