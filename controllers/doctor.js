const express = require('express');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const responses = require('../utils/responses')
const authMiddleware = require('./authMiddleware');
const PatientDrug = require("../models/PatientDrug");
const router = express.Router();
const mongoose = require('mongoose');
// const Drugs = require('../models/Drugs');

router.get('/', (req, res) => {
    res.json({'all': 'good'});
})

router.post('/signup', async (req, res) => {
    let {name, mobile, password, email, hospital} = req.body;
    // console.log({name, password, email, hospital});

    if (!name || !mobile || !password || !hospital) {
        return res.status(400).json(responses.error("Some fields are empty."))
    }
    const existingUser = await User.findOne({mobile: mobile});
    if (existingUser) {
        return res.status(400).json(responses.error("Mobile already exists. Log In."));
    }
    try {
        const role = "doctor";
        const user = new User({name, mobile, password, role, email, hospital});
        // console.log(user);
        await user.save();
        return res.status(201).json(responses.success("User created successfully. You may log in."));
    } catch (error) {
        // console.log(error);
        return res.status(400).json(responses.error("Something went wrong!"))
    }
});

router.post('/addpatient', authMiddleware, async (req, res) => {
    if (req.user.role !== 'doctor') {
      return res.status(401).json({ status: "error", message: "Unauthorized request" });
    }

    const { name, mobile, password, uhid, email, age, gender} = req.body;  
    if (!name || !mobile || !uhid || !password || !gender || !age) {
      return res.status(400).json({ status: "error", message: "Missing required fields: name, mobile, gender or age" });
    }

    try {
      const existingUser = await User.findOne({ mobile });
      if (existingUser) {
        return res.status(400).json({ status: "error", message: "A user with this mobile number already exists" });
      }

      const newPatient = new User({
        name,
        mobile,
        password,
        uhid,
        role: "patient",
        email,
        age, 
        gender,
        doctor: req.user._id
        
      });
      await newPatient.save();

    //   console.log("Patient data:", {
    //     id: newPatient._id,
    //     name: newPatient.name,
    //     uhid: newPatient.uhid,
    //     mobile: newPatient.mobile,
    //     role: newPatient.role
    // });    
      res.status(201).json({ status: "success", message: "Patient added successfully", patient: newPatient });
    } catch (error) {
      console.error("Error adding patient:", error);
      res.status(500).json({ status: "error", message: "Server error" });
    }
});

router.post('/allpatient', authMiddleware, async (req, res) => {
    if (req.user.role === 'patient') {
        res.status(401).json(responses.error("Invalid request"));
    }

    try {
        const patients = await User.find({role: "patient", doctor: req.user});
        let result = [];

        for (const patient of patients) {
            const drugData = await PatientDrug.find({patient: patient._id});
            
            let combinedData = [];

            drugData.forEach(drug => {
                combinedData.push({
                    timeStamp: new Date(drug.created_at),
                    sbp: drug.sbp,
                    dbp: drug.dbp,
                    hr: drug.hr,
                    weight: drug.weight
                });
            });            
            
            combinedData.sort((a, b) => a.timeStamp - b.timeStamp);            
            const graphData = {
                sbp: [],
                dbp: [],
                hr: [],
                weight: [],
                time: [] 
            };            

            combinedData.forEach((data, index) => {
                graphData.sbp.push(data.sbp || 0);
                graphData.dbp.push(data.dbp || 0);
                graphData.hr.push(data.hr || 0);
                graphData.weight.push(data.weight || 0);
                graphData.time.push(index); 
            });
            
            result.push({'patient': patient, 'graphData': graphData});
        }

        res.json(responses.success_data(result));
    } catch (error) {
        // console.log(error);
        res.json(responses.error("Some error occurred"));
    }
});

router.post('/get-details', authMiddleware, async (req, res) => {
    if (req.user.role === 'patient') {
        res.status(401).json(responses.error("Invalid request"));
    }
    try {
        const name = req.user.name;
        const hospital = req.user.hospital;
        const patients = await User.find({role: "patient", doctor: req.user});
        const patientCount = patients.length;
        res.json(responses.success_data({name, hospital, patientCount}));
    } catch (error) {
        // console.log(error);
        res.json(responses.error("Some error occurred"));
    }
});

// router.post('/get-drugs', async (req, res) => {
//   try {
//     const drugs = await Drugs.find().lean();

//     const response = {
//       classA: [],
//       classB: [],
//       classC: [],
//       classD: []
//     };

//     drugs.forEach(drug => {
//       switch (drug.class) {
//         case 'A':
//           response.classA.push(drug);
//           break;
//         case 'B':
//           response.classB.push(drug);
//           break;
//         case 'C':
//           response.classC.push(drug);
//           break;
//         case 'D':
//           response.classD.push(drug);
//           break;
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       data: response,
//       message: 'Drugs fetched successfully'
//     });
//   } catch (error) {
//     console.error('Error fetching drugs:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error while fetching drugs'
//     });
//   }
// });

// router.post('/add-drug', authMiddleware, async (req, res) => {
//   try {
//     const { name, drugClass, genric, company_name } = req.body;

//     if (!name) {
//       return res.status(400).json(responses.error('Drug name is required.'));
//     }
//     if (!drugClass || !['A', 'B', 'C', 'D'].includes(drugClass)) {
//       return res.status(400).json(responses.error('Class must be one of: A, B, C, D.'));
//     }

//     const newDrug = new Drugs({
//       name,
//       class: drugClass,
//       genric: genric || '',
//       company_name: company_name || ''
//     });

//     await newDrug.save();

//     return res.status(201).json({
//       success: true,
//       data: newDrug,
//       message: 'Drug added successfully'
//     });
//   } catch (error) {
//     console.error('Error adding drug:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error while adding drug'
//     });
//   }
// });

router.post('/adddrugpatient', authMiddleware, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(401).json(responses.error("Unauthorized request"));
  }

  const {
    mobile,
    diagnosis,
    otherDiagnosis,
    weight,
    sbp,
    dbp,
    hr,
    status,
    can_walk,
    can_climb,
    medicines
  } = req.body;

  try {
    const patient = await User.findOne({ mobile: mobile, role: "patient" });
    if (!patient) {
      return res.status(404).json(responses.error("Patient not found"));
    }

    const patientDrug = new PatientDrug({
      patient: patient._id,
      mobile,
      diagnosis,
      otherDiagnosis: otherDiagnosis || '', 
      weight: weight ? Number(weight) : undefined,
      sbp: sbp ? Number(sbp) : undefined,
      dbp: dbp ? Number(dbp) : undefined,
      hr: hr ? Number(hr) : undefined,
      status,
      can_walk,
      can_climb,
      medicines: medicines || [],
      created_by: req.user._id
    });

    await patientDrug.save();

    return res.status(201).json(responses.success_data({
      message: "Patient drug data added successfully",
      patientDrug
    }));
  } catch (error) {
    console.warn("Error adding patient drug data:", error);
    return res.status(500).json(responses.error(error.message || "Server error"));
  }
});

router.post('/getinfo/:mobile', authMiddleware, async (req, res) => {
  try {
    const patientMobile = req.params.mobile;
    
    const patient = await User.findOne({ mobile: patientMobile, role: 'patient' });
    
    if (!patient) {
      return res.status(404).json({ status: "error", message: "Patient not found" });
    }
    
    const doctor = await User.findById(patient.doctor);
    
    if (!doctor) {
      return res.status(404).json({ status: "error", message: "Doctor information not found" });
    }
    const latestDrugRecord = await PatientDrug.findOne({ patient: patient._id })
      .sort({ created_at: -1 }); 
      
    res.json({
      status: "success", 
      data: {
        name: patient.name,
        uhid: patient.uhid,
        age: patient.age ? `${patient.age} years` : 'N/A',
        gender: patient.gender || 'N/A',
        mobile: patient.mobile,
        doctorMobile: doctor.mobile,
        diagnosis: latestDrugRecord?.diagnosis || 'N/A', 
        customDisease: latestDrugRecord?.otherDiagnosis || 'N/A',
      }
    });
    
  } catch (error) {
    console.error("Error fetching patient info:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});
    
router.post('/patient-drug-data/mobile/:mobile', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const mobile = req.params.mobile;
    const { date } = req.body; // Expect date in YYYY-MM-DD format

    if (!mobile || mobile.length < 10) {
      return res.status(400).json({ success: false, message: "Invalid mobile number format" });
    }

    let query = { mobile };
    if (date) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: "Invalid date format Америкация Use YYYY-MM-DD" });
      }
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0);
      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
      query.created_at = { $gte: startDate, $lte: endDate };
    }

    // Fetch and sort by created_at (descending order = newest first)
    const patientDrugs = await PatientDrug.find(query).sort({ created_at: -1 });

    if (!patientDrugs || patientDrugs.length === 0) {
      return res.status(404).json({ success: false, message: "No records found for this mobile number" });
    }

    res.json({ success: true, data: patientDrugs });
  } catch (error) {
    console.error('Error fetching patient drug data:', error);
    res.status(500).json({ success: 'Server error', error: error.message });
  }
});

router.delete('/history/:historyId', authMiddleware, async (req, res) => {
    const { historyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(historyId)) {
        return res.status(400).json(responses.error("Invalid history ID format."));
    }

    try {
        const historyEntry = await PatientDrug.findById(historyId);
        if (!historyEntry) {
            return res.status(404).json(responses.error("History entry not found."));
        }

        await PatientDrug.findByIdAndDelete(historyId);
        return res.status(200).json(responses.success("History entry deleted successfully.", { deletedId: historyId }));

    } catch (err) {
        console.error("Error deleting patient history entry:", err);
        if (err.kind === 'ObjectId' || err.name === 'CastError') { 
            return res.status(404).json(responses.error("History entry not found or ID is invalid."));
        }
        return res.status(500).json(responses.error("Server error while deleting history entry."));
    }
});

module.exports = router;

