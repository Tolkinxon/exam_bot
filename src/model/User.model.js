const { Schema, model } = require("mongoose");

const User = new Schema({
    name: String,
    chatId: Number,
    draftProductId: { type: String, default: null },
    tempCategoryId: { type: String, default: null },
    tempBookId: { type: String, default: null },
    phone: String,
    admin: {
        type: Boolean,
        default: false
    },
    action: String,
    status: {
        type: Boolean,
        default: true
    },
}, {
    versionKey: false,
    timestamps: true
});

module.exports = model("users", User);    