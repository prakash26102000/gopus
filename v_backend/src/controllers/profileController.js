const db = require('../models');
const UserProfile = db.userprofile;
const User = db.user;
const fs = require('fs');
const path = require('path');

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('[getUserProfile] Fetching profile for user ID:', userId);
        
        // Get user and profile info
        const userData = await User.findOne({
            where: { id: userId },
            attributes: ['id', 'firstname', 'lastname', 'email'],
            include: [{
                model: UserProfile,
                as: 'profile'
            }]
        });
        
        console.log('[getUserProfile] Found user data:', userData ? 'Yes' : 'No');
        if (userData) {
            console.log('[getUserProfile] User basic info:', {
                id: userData.id,
                firstname: userData.firstname,
                lastname: userData.lastname,
                email: userData.email
            });
            console.log('[getUserProfile] Profile exists:', userData.profile ? 'Yes' : 'No');
        }

        if (!userData) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // If profile doesn't exist, create empty profile
        if (!userData.profile) {
            const newProfile = await UserProfile.create({
                userid: userId
            });
            userData.profile = newProfile;
        }

        const profileData = {
            id: userData.id,
            firstname: userData.firstname,
            lastname: userData.lastname,
            email: userData.email,
            lastName: userData.lastname,
            email: userData.email,
            ...userData.profile.toJSON()
        };
        
        // console.log('[getUserProfile] Returning profile data:', JSON.stringify(profileData, null, 2));
        
        res.json({
            success: true,
            profile: profileData
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('[updateProfile] User ID:', userId);
        console.log('[updateProfile] Request body:', JSON.stringify(req.body, null, 2));
        
        const {
            firstname,
            lastname,
            email,
            phoneNumber,
            dateOfBirth,
            gender,
            bio,
            occupation,
            location,
            socialLinks
        } = req.body;

        // Validate required fields
        if (!firstname || !lastname || !email) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and email are required'
            });
        }

        // Process date of birth
        let processedDateOfBirth = null;
        if (dateOfBirth) {
            const date = new Date(dateOfBirth);
            if (!isNaN(date.getTime())) {
                processedDateOfBirth = date;
            }
        }

        // Process social links
        let processedSocialLinks = {};
        if (socialLinks) {
            if (typeof socialLinks === 'string') {
                try {
                    processedSocialLinks = JSON.parse(socialLinks);
                } catch (e) {
                    processedSocialLinks = {};
                }
            } else if (typeof socialLinks === 'object') {
                processedSocialLinks = socialLinks;
            }
        }
        
        console.log('[updateProfile] Processed fields:', {
            firstname, lastname, email, phoneNumber, 
            processedDateOfBirth, gender, bio, occupation, location, processedSocialLinks
        });

        // Update user's basic information
        await User.update({
            firstname: firstname.trim(),
            lastname: lastname.trim(),
            email: email.trim()
        }, {
            where: { id: userId }
        });

        // Find or create profile
        console.log('[updateProfile] Finding or creating profile for user:', userId);
        let [profile, created] = await UserProfile.findOrCreate({
            where: { userid: userId },
            defaults: {
                userid: userId,
                phoneNumber: phoneNumber || null,
                dateOfBirth: processedDateOfBirth,
                gender: gender || null,
                bio: bio || null,
                occupation: occupation || null,
                location: location || null,
                socialLinks: processedSocialLinks
            }
        });

        console.log('[updateProfile] Profile created:', created);
        console.log('[updateProfile] Profile before update:', profile.toJSON());

        // If profile exists, update it
        if (!created) {
            console.log('[updateProfile] Updating existing profile...');
            await profile.update({
                phoneNumber: phoneNumber || null,
                dateOfBirth: processedDateOfBirth,
                gender: gender || null,
                bio: bio || null,
                occupation: occupation || null,
                location: location || null,
                socialLinks: processedSocialLinks
            });
            console.log('[updateProfile] Profile after update:', profile.toJSON());
        }

        // Get updated profile with user data
        const updatedProfile = await User.findOne({
            where: { id: userId },
            attributes: ['id', 'firstname', 'lastname', 'email'],
            include: [{
                model: UserProfile,
                as: 'profile'
            }]
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: {
                id: updatedProfile.id,
                firstName: updatedProfile.firstname,
                lastName: updatedProfile.lastname,
                email: updatedProfile.email,
                ...updatedProfile.profile.toJSON()
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.user.id;
        const profilePicturePath = `profiles/${req.file.filename}`;

        // Find or create profile
        let [profile, created] = await UserProfile.findOrCreate({
            where: { userid: userId },
            defaults: {
                userid: userId,
                profilePicture: profilePicturePath
            }
        });

        // If profile exists, update it
        if (!created) {
            // Delete old profile picture if it exists
            if (profile.profilePicture) {
                const oldPicturePath = path.join(__dirname, '..', 'uploads', profile.profilePicture);
                if (fs.existsSync(oldPicturePath)) {
                    fs.unlinkSync(oldPicturePath);
                }
            }

            await profile.update({ profilePicture: profilePicturePath });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            profilePicture: profilePicturePath
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
