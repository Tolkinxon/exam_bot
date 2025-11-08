const UserModel = require("../model/User.model");
const { bot } = require("./bot");
const katalogHandler = require("./handlers/katalog.handler");
const { addProductHandler, editProductHandler } = require("./handlers/products.handler");


bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const user = await UserModel.findOne({ chatId });
    if (user.admin && user.action == 'add_product_img') {
        addProductHandler(chatId, undefined, msg);
        await bot.sendMessage(chatId, "Mahsulot qo'shildi");
        katalogHandler(chatId);
    }
    else if (user.admin && user.action == 'edit_product_img') editProductHandler(msg);
    else bot.sendMessage(chatId, 'Sizga admin emassiz !');
})

