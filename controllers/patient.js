const express = require('express');
const User = require('../models/user');
const DailyData = require('../models/DailyData')
const responses = require('../utils/responses')
const authMiddleware = require('./authMiddleware');
const utils = require('../utils/formatDailyData')

const router = express.Router();


router.get('/', (req, res) => {
    res.json({"all": "good"})
})


router.post('/signup', async (req, res) => {
    let {name, mobile, password, email, age, gender, doctor_mobile} = req.body;
    if (!name || !mobile || !password || !age || !gender || !doctor_mobile) {
        return res.status(400).json(responses.error("Some fields are empty."))
    }

    const existingUser = await User.findOne({mobile: mobile});
    if (existingUser) {
        return res.status(400).json(responses.error("Mobile already exists. Log In."));
    }

    const doctor = await User.findOne({mobile: doctor_mobile, role: "doctor"});
    if (!doctor) {
        return res.status(400).json(responses.error("Such doctor doesn't exist."));
    }


    try {
        const role = "patient";
        age = parseInt(age);
        const user = new User({name, mobile, password, role, email, age, gender, doctor_mobile, doctor});
        await user.save();
        res.status(201).json(responses.success("User created successfully. You may log in."));
    } catch {
        res.status(400).json(responses.error("Something went wrong!"))
    }
});




router.post('/add', authMiddleware, async (req, res) => {
    let {sbp, dbp, weight} = req.body;
    console.log(sbp, dbp, weight);
    if (!sbp || !dbp || !weight) {
        res.status(400).json(responses.error("Some fields are empty."));
    }

    if (req.user.role === 'doctor') {
        res.status(401).json(responses.error("Invalid request"));
    }
    try {
        sbp = parseInt(sbp);
        dbp = parseInt(dbp);
        weight = parseInt(weight);
        const time = new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'});
        const patient = req.user;
        const dailyData = new DailyData({sbp, dbp, weight, time, patient});
        await dailyData.save();
        res.json(responses.success("Data added successfully."));
    } catch (error) {
        console.log(error);
        res.json(responses.error("Some error occurred."));
    }
})


router.post('/get-daily-data', authMiddleware, async (req, res) => {
    if (req.user.role === 'doctor') {
        return res.status(401).json(responses.error("Invalid request"));
    }
    try {
        const dailyData = await DailyData.find({patient: req.user});

        dailyData.sort((b, a) => new Date(a.time) - new Date(b.time));
        
        let result = {history: utils.formatDailyData(dailyData), graphData: utils.generateGraphData(dailyData)}
        return res.json(responses.success_data(result));
    } catch (error) {
        return res.json(responses.error("Some error occurred"));
    }
})



router.post('/validate-token', authMiddleware, (req, res) => {
    res.status(200).json({status: 'valid'});
});

module.exports = router;