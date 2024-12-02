import express from 'express';
import Team from '../models/teams.js';

const router = express.Router();

// Add user to team
router.post('/addUserToTeam', async (req, res) => {
    const { teamId, userId } = req.body;
    try {
        // Find the team and update its members
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        if (team.members.includes(userId)) {
            return res.status(400).json({ message: 'User already in team' });
        }
        
        team.members.push(userId);
        await team.save();
        
        return res.status(200).json({ message: 'User added to team', team });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error adding user to team', error });
    }
});

// Create a new team
export const createTeam = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id; 

        const teamExists = await Team.findOne({ name });

        if (teamExists) {
            return res.status(400).json({ message: "Team already exists." });
        }

        const team = await Team.create({ 
            name, 
            createdBy: userId 
        });

        return res.status(201).json({ message: "Team created successfully!", team });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "An error occurred while creating the team." });
    }
};

// Get all teams
export const getTeams = async (req, res) => {
    try {
        const teams = await Team.find().populate('members', 'name title email');
        return res.status(200).json(teams);
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "An error occurred while fetching teams." });
    }
};

// Update team
export const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, members } = req.body;

        const team = await Team.findByIdAndUpdate(id, { name, members }, { new: true });

        if (!team) {
            return res.status(404).json({ message: "Team not found." });
        }

        return res.status(200).json({ message: "Team updated successfully!", team });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "An error occurred while updating the team." });
    }
};

// Delete team
export const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedTeam = await Team.findByIdAndDelete(id);

        if (!deletedTeam) {
            return res.status(404).json({ message: "Team not found." });
        }

        return res.status(200).json({ message: "Team deleted successfully." });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "An error occurred while deleting the team." });
    }
};

// Export the router to use in your main app file
export default router;
