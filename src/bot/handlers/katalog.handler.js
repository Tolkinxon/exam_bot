const CategoryModel = require("../../model/Category.model");
const UserModel = require("../../model/User.model");
const { bot } = require("../bot");

module.exports = async (chatId) => {
    try {
        const user = await UserModel.findOne({ chatId });

        let categories = await CategoryModel.find({status: true});
        categories = categories.map(category => [{ text: category.title, callback_data: `category_${category._id}` }])
        bot.sendMessage(chatId, "Menular ro'yixati", {
            reply_markup: {
                remove_keyboard: false,
                inline_keyboard: [
                    !categories.length ? [{ text: 'Hali menu mavjud emas', callback_data: 'noop' }] : [],
                    ...categories,
                    user.admin ? [{ text: "Yangi menu qo'shish", callback_data: 'add_category' }] : []
                ].filter(row => row.length > 0)
            }
        })


    }
    catch (err) {
        console.error("katalogHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Buyurtmalarni ko‘rsatishda xatolik yuz berdi");
    }
}