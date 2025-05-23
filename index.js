require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();

const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const patientRoutes = require('./controllers/patient');
const doctorRoutes = require('./controllers/doctor');
const authRoutes = require('./controllers/auth')
const chatRoutes = require('./controllers/chat');
const audioRoutes = require('./controllers/audio');
const reportRoutes = require('./controllers/report_upload')

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Error connecting to MongoDB:", err));


app.use(bodyParser.json());
app.use('/api', router);

app.use('/patient', patientRoutes);
app.use('/doctor', doctorRoutes);
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/audio" , audioRoutes );
app.use("/transcribe" , audioRoutes );
app.use('/reports', reportRoutes);




app.get('/', (req, res) => {
  res.send({"All": "Clear.", "Go": "Ahead."});
});



router.post('/', (req, res) => {
  const { voice_text } = req.body;
  let name = "", mobile = "", gender = "";

  // Extract name (assuming after "name" word)
  const nameMatch = voice_text.match(/name (.+?),/i);
  if (nameMatch) name = nameMatch[1];

  // Extract mobile number (assuming after "mobile" word)
  const mobileMatch = voice_text.match(/mobile is (\d{10})/);
  if (mobileMatch) mobile = mobileMatch[1];

  // Extract gender (assuming after "gender" word)
  const genderMatch = voice_text.match(/gender is (male|female|other)/i);
  if (genderMatch) gender = genderMatch[1];

  res.json({ name, mobile, gender });
});




app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

async function createRoom() {
    await roomService.createRoom({ name: "voice-form" });
}

createRoom();