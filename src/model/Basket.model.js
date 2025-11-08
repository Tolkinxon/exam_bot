const { Schema, Types, model } = require("mongoose");

const BasketSchema = new Schema({
    chatId: Number,
    products: [
        {
            product: {
                type: Types.ObjectId,
                ref: "products",
                required: true
            },
            count: {
                type: Number,
                default: 1
            }
        }
    ]
}, {
    versionKey: false,
    timestamps: true
});

module.exports = model("baskets", BasketSchema);
