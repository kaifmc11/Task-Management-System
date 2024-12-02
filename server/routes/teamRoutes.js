import express from 'express';
import Team from '../models/teams.js';
// import User from '../models/user.js';

const router = express.Router();

// Create a new team
router.post('/', async (req, res) => {
    try {
        const { name, createdBy, members } = req.body;

        const teamExists = await Team.findOne({ name });

        if (teamExists) {
            return res.status(400).json({ message: "Team already exists." });
        }

        const team = await Team.create({ 
            name, 
            createdBy,
            members
        });

        // Populate the createdBy and members fields
        await team.populate('createdBy', 'name email');
        await team.populate('members', 'name email');

        return res.status(201).json({ message: "Team created successfully!", team });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "An error occurred while creating the team.", error: error.message });
    }
});

// Get all teams
router.get('/', async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('createdBy', 'name email')
            .populate('members', 'name email');
        return res.status(200).json(teams);
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "An error occurred while fetching teams.", error: error.message });
    }
});

// Update team
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, members } = req.body;

        const team = await Team.findByIdAndUpdate(
            id, 
            { name, members }, 
            { new: true }
        ).populate('createdBy', 'name email')
         .populate('members', 'name email');

        if (!team) {
            return res.status(404).json({ message: "Team not found." });
        }

        return res.status(200).json({ message: "Team updated successfully!", team });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "An error occurred while updating the team.", error: error.message });
    }
});

// Delete team
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedTeam = await Team.findByIdAndDelete(id);

        if (!deletedTeam) {
            return res.status(404).json({ message: "Team not found." });
        }

        return res.status(200).json({ message: "Team deleted successfully." });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "An error occurred while deleting the team.", error: error.message });
    }
});

export default router;