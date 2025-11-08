const BasketModel = require("../../model/Basket.model");
const UserModel = require("../../model/User.model");
const { bot } = require("../bot");

const addBasketHandler = async (chatId, messageId, queryData) => {
    try {
        const user = await UserModel.findOne({ chatId });
        const product_id = queryData.split('-')[1];
        let basketProducts = await BasketModel.findOne({ chatId });
        if (!basketProducts) {
            basketProducts = await BasketModel.create({
                chatId,
                products: [{ product: product_id }]
            });
        }
        else {
            const find = basketProducts.products.find(item => item.product == product_id);
            if (!find) {
                await BasketModel.updateOne(
                    { _id: basketProducts._id },
                    {
                        $push: {
                            products: { product: product_id }
                        }
                    }
                );
            }

        }
    }
    catch (err) {
        console.error("addBasketHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Savatchaga qo'shishda xatolik yuz berdi");
    }
}

// const showBasket = async (chatId) => {
//     const user = await UserModel.findOne({ chatId });
//     const basket = await BasketModel.findOne({ chatId }).populate('products.product', { title: 1, price: 1, _id: 0 });
//     //   ...products.map(product => [{text: `${product.product.title}-${product.count} ta \n ja'mi ${Number(product.product.price) * product.count} so'm bo'ladi`, callback_data: 'noop'}],
//     //                       [ {text: "+", callback_data: 'noop'}, {text: "-", callback_data: 'noop'}, {text: "bekor qilish", callback_data: 'noop'} ]
//     //                     )
//     let products = basket.products;
//     if (products.length) {
//         for (let product of products) {
//            await bot.sendMessage(chatId, `${product.product.title}-${product.count}dona \nja'mi-${Number(product.product.price) * product.count} so'm bo'ladi`, {
//                 parse_mode: 'HTML',
//                 reply_markup: {
//                     remove_keyboard: true,
//                     inline_keyboard: [
//                         [{ text: "+", callback_data: 'noop' }, { text: "-", callback_data: 'noop' }, { text: "bekor qilish", callback_data: 'noop' }]
//                     ]
//                 }
//             })
//         }
//        await bot.sendMessage(chatId, `Buyurtma berish uchun tugmachani bosing`, {
//             parse_mode: 'HTML',
//             reply_markup: {
//                 remove_keyboard: true,
//                 inline_keyboard: [
//                     [{ text: "Buyurtma berish", callback_data: 'noop' }]
//                 ]
//             }
//         })
//         return
//     }
// }

const showBasket = async (chatId) => {
    try {
        const basket = await BasketModel.findOne({ chatId })
            .populate('products.product', { title: 1, price: 1 });
        let total = 0;
        if (!basket || basket.products.length === 0) { bot.sendMessage(chatId, "Savatcha bo'sh !"); return; }

        for (let product of basket.products) {
            const totalPrice = Number(product.product?.price) * product.count;
            total += totalPrice
            await bot.sendMessage(chatId,
                `<b>${product.product.title}</b> - ${product.count} dona\n` +
                `Jami: ${totalPrice} so'm`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "+", callback_data: `increment-${product.product._id}` },
                                { text: "-", callback_data: `decrement-${product.product._id}` },
                                { text: "❌Bekor qilish", callback_data: `remove-${product.product._id}` }
                            ]
                        ]
                    }
                }
            );
        }

        await bot.sendMessage(chatId, `Ja'mi hisob - ${total} so'm / Buyurtma rasmiylashtirish uchun tugmachani bosing`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Ja'mini hisoblash", callback_data: `total` },
                        { text: "✅ Rasmiylashtirish", callback_data: 'order' }
                    ]
                ]
            }
        });


    }
    catch (err) {
        console.error("showBasket error:", err);
        await bot.sendMessage(chatId, "⚠️ Savatchadagi ma'lumotlarni ko'rsatishda xatolik yuz berdi");
    }
};

const refreshBasketMessage = async (chatId, messageId, productId) => {
    try {

        const basket = await BasketModel.findOne({ chatId })
            .populate('products.product', { title: 1, price: 1 });

        const product = basket.products.find(p => p.product._id.toString() === productId);
        if (!product) return;

        const totalPrice = Number(product.product.price) * product.count;

        await bot.editMessageText(
            `<b>${product.product.title}</b> - ${product.count} dona\nJami: ${totalPrice} so'm`,
            {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "+", callback_data: `increment-${productId}` },
                            { text: "-", callback_data: `decrement-${productId}` },
                            { text: "❌ Bekor qilish", callback_data: `remove-${productId}` }
                        ]
                    ]
                }
            }
        );


    }
    catch (err) {
        console.error("refreshBasketMessage error:", err);
        await bot.sendMessage(chatId, "⚠️ Savatchadagi ma'lumotlarni ko‘rsatishda xatolik yuz berdi");
    }
};

const refreshBasketTotalMessage = async (chatId, messageId) => {
    try {
        const basket = await BasketModel.findOne({ chatId })
            .populate('products.product', { title: 1, price: 1 });
        let total = 0;

        for (let product of basket.products) {
            const totalPrice = Number(product.product.price) * product.count;
            total += totalPrice;
        }


        await bot.editMessageText(
            `Ja'mi hisob - ${total} so'm / Buyurtma berish uchun tugmachani bosing`,
            {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Ja'mini hisoblash", callback_data: `total` },
                            { text: "✅ Buyurtma berish", callback_data: 'order' }
                        ]
                    ]
                }
            }
        );
    }
    catch (err) {
        console.error("refreshBasketTotalMessage error:", err);
        await bot.sendMessage(chatId, "⚠️ Savatchadagi ma'lumotlarni ko‘rsatishda xatolik yuz berdi");
    }
};



module.exports = { addBasketHandler, showBasket, refreshBasketMessage, refreshBasketTotalMessage }