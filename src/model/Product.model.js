const {Schema, Types, model} = require("mongoose");

const Product = new Schema({
    title: String,
    price: Number,
    img: String,
    category: {
        type: Types.ObjectId,
        ref: "cateegories"
    },
    status: {
        type: Boolean,
        default: true
    }
},{
    versionKey: false,
    timestamps: true
});

module.exports = model("products", Product);