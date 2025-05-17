const express = require("express");
const authMiddleware = require("./authMiddleware");
const upload = require("../utils/audioStorage");
const responses = require("../utils/responses");
const router = express.Router();
const User = require('../models/user');
const Message = require('../models/Message');

router.post('/send-audio', authMiddleware, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(401).json(responses.error("Audio is missing!"));
        }
        
        const filename = req.file.filename;
        let {receiver_id} = req.body;
        const sender = req.user._id;
        let receiver = await User.findOne({_id: receiver_id});
        if (!receiver) {
            return res.json(responses.error("Invalid request!"));
        }
        receiver = receiver._id;
        const message_type = "audio";
        const message = new Message({sender, receiver, message_type, filename});
        await message.save();
        return res.json(responses.success('Message sent successfully.'));
    } catch (error) {
        return res.json(responses.error(error));
    }
})

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