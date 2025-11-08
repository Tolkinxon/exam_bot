const { Schema, Types, model } = require("mongoose");

const Book = new Schema({
    chatId: Number,
    products: [
        {
            product: {
                type: Types.ObjectId,
                ref: "products"
            },
            count: Number
        }
    ],
    phone: String,
    total_price: Number,
    location: String,
    payment_type: String,
    status: { type: String, default: 'kutilmoqda'},
    delivering: String,
}, {
    versionKey: false,
    timestamps: true
});

module.exports = model("books", Book);