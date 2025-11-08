const CategoryModel = require("../../model/Category.model");
const ProductModel = require("../../model/Product.model");
const UserModel = require("../../model/User.model");
const { bot } = require("../bot");
const katalogHandler = require("./katalog.handler");

const addCategoryHandler = async (chatId) => {
    try {
        const user = await UserModel.findOne({ chatId });
        if (user.admin) {
            await UserModel.findOneAndUpdate({ chatId }, { action: 'add_category' }, { new: true });
            bot.sendMessage(chatId, 'Yangi menuni nomini kiriting');
        }
        else {
            bot.sendMessage(chatId, 'Sizga admin emassiz !');
        }
    }
    catch (err) {
        console.error("addCategoryHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Menu qo'shishda xatolik yuz berdi");
    }
}

const createCategoryHandler = async (chatId, msg) => {
    try {
        const chatId = msg.chat.id;
        const text = msg.text;
        const user = await UserModel.findOne({ chatId });
        if (user.admin) {
            await CategoryModel.create({ title: text });
            await UserModel.findOneAndUpdate({ chatId }, { action: 'category' });
            katalogHandler(chatId);
        }
        else {
            bot.sendMessage(chatId, 'Sizga admin emassiz !');
        }
    }
    catch (err) {
        console.error("createCategoryHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Menu yaratishda xatolik yuz berdi");
    }
}

const editCategoryHandler = async (chatId, msg, queryData = '-') => {
    try {
        const category_id = queryData.split('-')[1];
        const user = await UserModel.findOne({ chatId });
        if (msg) {
            const text = msg.text;
            if (user.admin) {
                await CategoryModel.findOneAndUpdate({ _id: user.tempCategoryId }, { title: text });
                await UserModel.findOneAndUpdate({ chatId }, { action: 'menu' });
                katalogHandler(msg);
            }
            else {
                bot.sendMessage(chatId, 'Sizga admin emassiz !');
            }
            return
        }
        if (user.admin) {
            await UserModel.findOneAndUpdate({ chatId }, { action: 'edit_category', tempCategoryId: category_id }, { new: true });
            bot.sendMessage(chatId, 'Kategoriyani yangi nomini kiriting');
        }
        else {
            bot.sendMessage(chatId, 'Sizga admin emassiz !');
        }


    }
    catch (err) {
        console.error("editCategoryHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Menuni o'zgartirishda xatolik yuz berdi");
    }
}

const deleteCategoryHandler = async (chatId, messageId, queryData = '-') => {
    try {
        const category_id = queryData.split('-')[1];
        const user = await UserModel.findOne({ chatId });
        if (user.admin && !category_id) {
            const categoryId = user.tempCategoryId;
            const products = await ProductModel.find({ category: categoryId });
            for (let product of products) {
                await ProductModel.findByIdAndDelete(product._id);
            }
            // await CategoryModel.findByIdAndDelete(categoryId);
            await CategoryModel.findOneAndUpdate({_id: categoryId}, { status: false });
            await UserModel.findOneAndUpdate({ chatId }, { action: "menu" });
            katalogHandler(chatId);
            return
        }
        if (user.admin && category_id) {
            await UserModel.findOneAndUpdate({ chatId }, { action: 'delete_category', tempCategoryId: category_id }, { new: true });
            const category = await CategoryModel.findById(category_id);
            bot.editMessageReplyMarkup({
                inline_keyboard: [
                    user.admin ? [{ text: `${category.title} qo'shish`, callback_data: `add_product-${category_id}` }] : [],
                    user.admin ? [{ text: `${category.title} menuni qayta nomlash`, callback_data: `edit_category-${category_id}` }] : [],
                    user.admin ? [{ text: `Menuni o'chirish`, callback_data: `delete_category` }, { text: `Bekor qilish`, callback_data: "cancel_category" }] : []
                ].filter(row => row.length > 0)
            }, {
                chat_id: chatId,
                message_id: messageId
            });
        }
        else {
            bot.sendMessage(chatId, 'Sizga admin emassiz !');
        }


    }
    catch (err) {
        console.error("deleteCategoryHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Menuni o'chirishda xatolik yuz berdi");
    }
}

const cancelCategory = async (chatId, messageId) => {
    try {
        const user = await UserModel.findOne({ chatId });
        if (user.admin) {
            const category = await CategoryModel.findById(user.tempCategoryId)
            bot.editMessageReplyMarkup({
                inline_keyboard: [
                    user.admin ? [{ text: `${category.title} qo'shish`, callback_data: `add_product-${category._id}` }] : [],
                    user.admin ? [{ text: `${category.title} menuni qayta nomlash`, callback_data: `edit_category-${category._id}` }] : [],
                    user.admin ? [{ text: `${category.title} menuni o'chirish`, callback_data: `delete_category-${category._id}` }] : []
                ].filter(row => row.length > 0)
            }, {
                chat_id: chatId,
                message_id: messageId
            });

            await UserModel.updateOne({ chatId }, { action: 'menu' });
            return
        }
        else {
            bot.sendMessage(chatId, 'Sizga admin emassiz !');
        }


    }
    catch (err) {
        console.error("cancelCategory error:", err);
        await bot.sendMessage(chatId, "⚠️ Menuni bekor qilishda xatolik yuz berdi");
    }
}

module.exports = { addCategoryHandler, createCategoryHandler, editCategoryHandler, deleteCategoryHandler, cancelCategory }