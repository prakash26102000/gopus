const db = require('../models');
const UserAddress = db.useraddress;

exports.getUserAddresses = async (req, res) => {
    try {
        const userId = req.user.id;
        const addresses = await UserAddress.findAll({
            where: { userid: userId },
            order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
        });
        
        res.json({
            success: true,
            addresses
        });
    } catch (error) {
        console.error('Error fetching user addresses:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching addresses',
            error: error.message
        });
    }
};

exports.addUserAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            fullname,
            email,
            phone,
            address,
            city,
            state,
            country,
            pincode,
            isDefault
        } = req.body;

        // If this is set as default, remove default from other addresses
        if (isDefault) {
            await UserAddress.update(
                { isDefault: false },
                { where: { userid: userId } }
            );
        }

        const newAddress = await UserAddress.create({
            userid: userId,
            fullname,
            email,
            phone,
            address,
            city,
            state,
            country,
            pincode,
            isDefault: isDefault || false
        });

        res.status(201).json({
            success: true,
            address: newAddress
        });
    } catch (error) {
        console.error('Error adding user address:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding address',
            error: error.message
        });
    }
};

exports.updateUserAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updateData = req.body;

        // If setting as default, remove default from other addresses
        if (updateData.isDefault) {
            await UserAddress.update(
                { isDefault: false },
                { where: { userid: userId } }
            );
        }

        const [updated] = await UserAddress.update(updateData, {
            where: { id, userid: userId }
        });

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Address not found or not owned by user'
            });
        }

        const updatedAddress = await UserAddress.findOne({
            where: { id, userid: userId }
        });

        res.json({
            success: true,
            address: updatedAddress
        });
    } catch (error) {
        console.error('Error updating user address:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating address',
            error: error.message
        });
    }
};

exports.deleteUserAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const deleted = await UserAddress.destroy({
            where: { id, userid: userId }
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Address not found or not owned by user'
            });
        }

        res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user address:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting address',
            error: error.message
        });
    }
};
