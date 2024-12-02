import mongoose from 'mongoose';
import User from '../models/user.js';
import PendingUser from '../models/pendingUser.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin, role, title, team, teamName } = req.body;

    // Check if user exists in either User or PendingUser collection
    const userExist = await User.findOne({ email });
    const pendingUserExist = await PendingUser.findOne({ email });

    if (userExist || pendingUserExist) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }

    // Create a new pending user
    const pendingUser = await PendingUser.create({
      name,
      email,
      password,
      isAdmin,
      role,
      title,
      team,
      teamName,
    });

    res.status(201).json({
      status: true,
      message: "User registration submitted for approval",
      user: {
        id: pendingUser._id,
        name: pendingUser.name,
        email: pendingUser.email,
        role: pendingUser.role,
        title: pendingUser.title,
        teamName: pendingUser.teamName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: false, 
      message: error.message || "Error creating pending user" 
    });
  }
};

export const getPendingApprovals = async (req, res) => {
  try {
    const pendingUsers = await PendingUser.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      data: pendingUsers,
      message: "Pending approvals retrieved successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: false, 
      message: "Error retrieving pending approvals" 
    });
  }
};

export const approveUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const pendingUser = await PendingUser.findById(id);

    if (!pendingUser) {
      await session.abortTransaction();
      return res.status(404).json({ 
        status: false, 
        message: "Pending user not found" 
      });
    }

    // Check if email already exists in active users
    const existingUser = await User.findOne({ email: pendingUser.email });
    if (existingUser) {
      await session.abortTransaction();
      return res.status(400).json({ 
        status: false, 
        message: "Email already registered in active users" 
      });
    }

    // Create new active user
    const newUser = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // Password is already hashed
      isAdmin: pendingUser.isAdmin,
      role: pendingUser.role,
      title: pendingUser.title,
      team: pendingUser.team,
      teamName: pendingUser.teamName,
      isActive: true
    });

    await newUser.save({ session });
    await PendingUser.findByIdAndDelete(id, { session });
    
    await session.commitTransaction();

    res.status(200).json({
      status: true,
      message: "User approved and activated successfully",
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        title: newUser.title,
        teamName: newUser.teamName
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ 
      status: false, 
      message: "Error approving user" 
    });
  } finally {
    session.endSession();
  }
};

export const rejectUser = async (req, res) => {
  try {
    // Clean the ID by removing any URL encoding or whitespace
    const id = req.params.id.trim().replace(/\s/g, '');
    const { reason } = req.body;

    // Log the received ID for debugging
    console.log('Received ID:', id);

    // Check for reason
    if (!reason) {
      return res.status(400).json({
        status: false,
        message: "Rejection reason is required"
      });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID format",
        receivedId: id
      });
    }

    // Find the pending user
    const pendingUser = await PendingUser.findById(id);
    if (!pendingUser) {
      return res.status(404).json({
        status: false,
        message: "Pending user not found"
      });
    }

    // Store rejection info
    const rejectedUserInfo = {
      email: pendingUser.email,
      name: pendingUser.name,
      reason: reason,
      rejectedAt: new Date()
    };

    // Delete the pending user
    await PendingUser.findByIdAndDelete(id);

    res.status(200).json({
      status: true,
      message: "User registration rejected successfully",
      data: rejectedUserInfo
    });

  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      status: false,
      message: error.message || "Error rejecting user"
    });
  }
};

export const getPendingUser = async (req, res) => {
  try {
    const { id } = req.params;
    const pendingUser = await PendingUser.findById(id).select('-password');

    if (!pendingUser) {
      return res.status(404).json({ 
        status: false, 
        message: "Pending user not found" 
      });
    }

    res.status(200).json({
      status: true,
      data: pendingUser,
      message: "Pending user details retrieved successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: false, 
      message: "Error retrieving pending user details" 
    });
  }
};