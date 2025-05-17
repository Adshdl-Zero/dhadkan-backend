const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    mobile: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: String, enum: ['doctor', 'patient'], required: true},
    email: {type: String, required: false},
    // only for patients
    age: {
        type: Number, required: () => {
            return this.role === "patient"
        }
    },
    gender: {
        type: String, enum: ['male', 'female', 'other','Male','Female'], required: () => {
            return this.role === "patient"
        }
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: () => {
            return this.role === "patient"
        }
    },
    // only for doctors
    hospital: {
        type: String, required: () => {
            return this.role === "doctor"
        }
    }
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
}, {});


userSchema.methods = {
  comparePassword: async function (inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
  },
};
const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;

