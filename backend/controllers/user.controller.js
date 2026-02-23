import User from '../models/user.model.js';
import City from '../models/city.model.js';
import bcrypt from 'bcryptjs';

export const getAllUsers = async(req , res , next) => {
    try{
        const users = await User.find();
        res.status(200).json({
            success: true,
            users: users
        })
    } catch(error) {
        console.log(error);
        next(error);
    }
};

export const getUserById = async(req , res , next) => {
    try{
        const userId = req.params.id;
        const user = await User.findById(userId).populate("city");
        if(!userId){
            return res.status(404).json({
                success: false,
                message: "User id not provided"
            })
        }
        if(!user){
            return res.status(404).json({
                success: false,
                message: "No such user found"
            })
        }
        res.status(200).json({
            success: true,
            message: "user found successfully",
            user: user
        })
    } catch(error) {
        console.log(error.message);
        next(error);
    }
};

export const createNewUser = async(req , res , next) => {
    try{
        const userData = req.body;
        const newUser = await User.create(userData);
        if(!userData){
            return res.status(400).json({
                success: false,
                message: "User data not provided"
            })
        } 
        res.status(200).json({
            success: true,
            message: "User created successfully",
            newUser: newUser
        })
    } catch(error){
        console.log(error.message);
        next(error);
    }
}

export const updateUserData = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { name, city, email, password } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        if (!name && !city && !email && !password) {
            return res.status(400).json({
                success: false,
                message: "No data provided to update"
            });
        }

        const updateData = {};

        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }
        
        if (city) {
            const cityName = city.trim();
            // Find or create city by name (case-insensitive)
            let cityDoc = await City.findOne({ name: { $regex: new RegExp(`^${cityName}$`, 'i') } });
            
            if (!cityDoc) {
                const newCity = await City.create([{
                    name: cityName,
                    state: "Unknown",
                    country: "Unknown",
                    latitude: 0,
                    longitude: 0,
                    timezone: "UTC"
                }]);
                cityDoc = newCity[0];
            }
            
            updateData.city = cityDoc._id;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).populate('city');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User data updated successfully",
            updatedUser
        });

    } catch (error) {
        console.error(error.message);
        next(error);
    }
};

export const deleteUserById = async(req , res , next) => {
    try{
        const id = req.params.id;
        const deleteUser = await User.findByIdAndDelete(id);
        if(!id){
            return res.status(404).json({
                success: false,
                message: "User id not provided"
            })
        } 
        if(!deleteUser){
            return res.status(404).json({
                success: false,
                message: "No such user found"
            })
        }
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            deletedUser: deleteUser
        })
    } catch(error) {
        console.log(error.message);
        next(error);
    }
}

export const deleteAllUsers = async(req, res , next) => {
    try{
        const deleteUsers = await User.deleteMany();
        res.status(200).json({
            success: true,
            message: "All users deleted successfully",
            deletedUsers : deleteUsers
        })
    } catch(error) {
        console.log(error.message);
        next(error);
    }
}