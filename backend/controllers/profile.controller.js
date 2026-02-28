import User from "../models/user.model.js";

// Get user profile
export const getProfile = async (req, res) => {
    try {
        // req.user is set by protectRoute middleware
        const user = await User.findById(req.user._id).select("-password");
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                cartItems: user.cartItems,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error("Error in getProfile:", error);
        res.status(500).json({ message: "Error fetching profile", error: error.message });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;
        }

        // Update name if provided
        if (name) {
            user.name = name;
        }

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error("Error in updateProfile:", error);
        res.status(500).json({ message: "Error updating profile", error: error.message });
    }
};

// Delete user profile
export const deleteProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.status(200).json({ message: "Profile deleted successfully" });
    } catch (error) {
        console.error("Error in deleteProfile:", error);
        res.status(500).json({ message: "Error deleting profile", error: error.message });
    }
};
