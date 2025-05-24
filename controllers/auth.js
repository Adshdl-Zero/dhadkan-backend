const express = require('express')
const User = require('../models/user')
const responses = require('../utils/responses')
const router = express.Router()
const jwt = require('jsonwebtoken');
const authMiddleware = require('./authMiddleware');
const PatientDrug = require("../models/PatientDrug");



router.post('/login', async (req, res) => {
    let {mobile, password} = req.body;

    if (!mobile || !password) {
        return res.status(400).json(responses.error("Some fields are empty"))
    }
    try {
        const user = await User.findOne({mobile});
        if (!user) {
            return res.status(400).json(responses.error("Invalid Mobile."));
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json(responses.error("Invalid password"));
        }
        const token = jwt.sign(
            {userId: user._id, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        );
        res.json(responses.success(token));
    } catch (error) {
        console.log(error);
        res.json(responses.error("Some error occurred."));
    }
})



router.post('/get-details', authMiddleware, async (req, res) => {
    try {
        if (req.user.role === 'patient' && req.user.doctor) {
            await req.user.populate('doctor', 'name mobile'); 
            
            const patient = req.user;
            const latestDrugRecord = await PatientDrug.findOne({ patient: patient._id })
            .sort({ created_at: -1 }); 
            
            disease = latestDrugRecord?.diagnosis || 'N/A';
            otherDisease =  latestDrugRecord?.otherDiagnosis || 'N/A';
            
            const detail = {
                name: patient.name,
                uhid: patient.uhid,
                id: patient._id,
                doctorId: patient.doctor._id,
                age: patient.age ? `${patient.age} years` : 'N/A',
                gender: patient.gender || 'N/A',
                mobile: patient.mobile,
                doctorMobile: patient.doctor.mobile,
                diagnosis: disease==='Other' ? otherDisease : disease,
            };
            
            console.log(detail);      
            
            res.json({
                status: "success", 
                data: detail,
            });
            
        }
        else{
            res.json(responses.success_data(req.user));
        }
    } catch (error) {
        res.json(responses.error("Some error occurred"));
    }
})

module.exports = router;