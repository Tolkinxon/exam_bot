const UserModel = require("../../model/User.model");
const { bot } = require("../bot");
const { adminKeyboard, userKeyboard } = require("../menu/keyboard");

module.exports = async (msg) => {
    const chatId = msg?.chat?.id;
    try {
        let checkUser = await UserModel.findOne({ chatId });
        if (!checkUser) {
            await UserModel.create({
                name: msg.from.first_name,
                chatId,
                admin: false,
                manager: false,
                status: true,
                action: "request_contact"
            });
            bot.sendMessage(chatId, `Assalomu alaykum Nekuz Fast-Food boti ga xush kelibsiz bu bot orqali siz Nekuz MFY hududida Fast-Food buyurtma berishingiz mumkin!, ${msg.from.first_name}. Iltimos telefon raqamingizni yuboring`, {
                reply_markup: {
                    keyboard: [
                        [{ text: "Kontaktni yuborish", request_contact: true }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })
        } else {
            if (checkUser && !checkUser.phone) {
                bot.sendMessage(chatId, `Iltimos kontaktingizni yuboring, hurmatli ${msg.from.first_name}`, {
                    reply_markup: {
                        keyboard: [
                            [{ text: "Kontaktni yuborish", request_contact: true }]
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: false
                    }
                })
            } else {
                let updateUser = await UserModel.findOneAndUpdate({ chatId }, { action: "menu" }, { new: true })
                bot.sendMessage(chatId, `Assalomu alaykum Nekuz Fast-Food boti ga xush kelibsiz bu bot orqali siz Nekuz MFY hududida Fast-Food buyurtma berishingiz mumkin!, ${updateUser.admin ? "Admin" : updateUser.name}`, {
                    reply_markup: {
                        keyboard: updateUser.admin ? adminKeyboard : userKeyboard,
                        resize_keyboard: true,
                        one_time_keyboard: false
                    }
                })
            }
        };
    }
    catch (err) {
        console.error("startHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Botni ishga tushurishda xatolik yuz berdi");
    }
}