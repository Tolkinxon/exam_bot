const {Schema, model} = require("mongoose");

const Category = new Schema({
    title: String,
    status: {
        type: Boolean,
        default: true
    }
},{
    versionKey: false,
    timestamps: true
});

module.exports = model("categories", Category);    