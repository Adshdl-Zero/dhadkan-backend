const express = require("express");
const authMiddleware = require("./authMiddleware");
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/user'); 
const responses = require('../utils/responses'); 

// router.post('/upload-audio', authMiddleware, upload.single('audio'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: 'No audio file uploaded' });
//     }

//     const receiverId = req.body.receiver_id;
//     const uploaderId = req.user._id;

//     const tempPath = `temp-${Date.now()}.aac`;
//     fs.writeFileSync(tempPath, req.file.buffer);

//     const result = await uploadToCloudinary(tempPath, 'chat_audio');

//     fs.unlinkSync(tempPath); // Cleanup temp file

//     const newMessage = new Message({
//       sender: uploaderId,
//       receiver: receiverId,
//       type: 'audio',
//       content: result.secure_url,
//       timestamp: new Date(),
//     });

//     await newMessage.save();

//     res.json({ success: true, url: result.secure_url });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ success: false, message: 'Audio upload failed' });
//   }
// });

router.post('/send-text', authMiddleware, async (req, res) => {
    try {
        const sender = req.user._id;
        let {receiver_id, text} = req.body;
        if (!text) {
            return res.json(responses.error("Text is empty!"));
        }
        let receiver = await User.findOne({_id: receiver_id});
        if (!receiver) {
            return res.json(responses.error("Invalid request!"));
        }
        receiver = receiver._id;
        const message_type = 'text';
        const message = new Message({sender, receiver, message_type, text});
        await message.save();
        return res.json(responses.success('Message sent successfully.'));
    } catch (error) {
        return res.json(responses.error(error));
    }
})

router.post('/get-texts', authMiddleware, async (req, res) => {
    try {
        const me = req.user;
        let {receiver_id} = req.body;
        let other = await User.findOne({_id: receiver_id});
        if (!other) {
            return res.json(responses.error("Invalid request!"));
        }

        let messages = await Message.find({
            $or: [
                {sender: me, receiver: other},
                {sender: other, receiver: me}
            ]
        }).sort({time: 1});

        messages = messages.map(message => {
            return {
                ...message._doc,
                mine: message.sender._id.toString() === me._id.toString()
            };
        });

        return res.json(responses.success_data(messages));
    } catch (error) {
        console.log(error);
        return res.json(responses.error(error));
    }
})

module.exports = router;