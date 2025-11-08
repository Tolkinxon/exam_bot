const UserModel = require("../../model/User.model");
const { bot } = require("../bot");
const { adminKeyboard, userKeyboard } = require("../menu/keyboard");

module.exports = async (msg) => {
    const chatId = msg?.chat?.id;
    try {
        if (msg.contact) {
            const updateUser = await UserModel.findOneAndUpdate({ chatId },
                {
                    phone: msg.contact.phone_number,
                    admin: msg.contact.phone_number == "+998774779844",
                    action: "menu"
                }, { new: true });
            bot.sendMessage(chatId, `Menyuni tanlang, ${updateUser.admin ? "Admin" : updateUser.name}`, {
                reply_markup: {
                    keyboard: updateUser.admin ? adminKeyboard : userKeyboard,
                    resize_keyboard: true
                }
            })
        }

    }
    catch (err) {
        console.error("contactHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Kontaktni tanib olishda xatolik yuz berdi");
    }
}