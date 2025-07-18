const express = require('express');
const mongoose = require('mongoose');
const Drugs = require('../model/Drugs');
const router = express.Router();

router.get('/get', async (req, res) => {
    try {
        const groupedDrugsRaw = await Drugs.aggregate([
            {
                $group: {
                    _id: '$class',
                    drugNames: {
                        $push: '$name'
                    }
                }
            },
            {
                $sort: { _id: 1 } 
            }
        ]);

        const classOrder = ['A', 'B', 'C', 'D'];

        const finalOutput = classOrder.map(c => {
            const foundClass = groupedDrugsRaw.find(group => group._id === c);
            return foundClass ? foundClass.drugNames.sort() : [];
        });

        res.status(200).json({
            success: "true",
            data: finalOutput
        });
    } catch (error) {
        console.error('Error fetching drugs:', error);
        res.status(500).json({ 
            success: "false",
            message: 'Failed to retrieve drugs', 
            error: error.message 
        });
    }
});

router.post('/add', async (req, res) => {
    try {
        const { name, class: drugClass } = req.body; 

        if (!name || !drugClass) {
            return res.status(400).json({ 
                success: "false",
                message: 'Name and class are required.' 
            });
        }

        const allowedClasses = ['A', 'B', 'C', 'D'];
        if (!allowedClasses.includes(drugClass)) {
            return res.status(400).json({ 
                success: "false",
                message: `Invalid class. Must be one of: ${allowedClasses.join(', ')}` 
            });
        }

        const newDrug = new Drugs({
            name,
            class: drugClass 
        });

        await newDrug.save();

        res.status(201).json({ 
            success: "true",
            message: 'Drug added successfully', 
            drug: newDrug 
        });
    } catch (error) {
        console.error('Error adding drug:', error);
        if (error.code === 11000) { 
            return res.status(409).json({ 
                success: "false",
                message: 'Drug with this name already exists.', 
                error: error.message 
            });
        }
        res.status(500).json({ 
            success: "false",
            message: 'Failed to add drug', 
            error: error.message 
        });
    }
});

module.exports = router;