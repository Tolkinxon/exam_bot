const UserModel = require('../model/User.model');
const { bot } = require('./bot');
const { createCategoryHandler, editCategoryHandler } = require('./handlers/category.handler');
const {bookHandler, showBooks, showAllBooksHandler, bookByCard, showAllUsers} = require('./handlers/book.handler');
const contactHandler = require('./handlers/contact.handler');
const katalogHandler = require('./handlers/katalog.handler');
const startHandler = require('./handlers/start.handler');
const { addProductHandler, editProductHandler } = require('./handlers/products.handler');
const { showBasket } = require('./handlers/basket.handler');



bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const user = await UserModel.findOne({ chatId });

    // if(msg.chat.type !== 'private') return
    if (text == "/start") startHandler(msg);
    if (text == "/info") bot.sendMessage(chatId, "This bot fot booking and delivering fast foods. And helps to find and storage all your books here. Good luck")
    if (text == "/help") bot.sendMessage(chatId, "First executing this bot you need to choose /start command and choose one time again buttons down below. All actoins happens with buttons below and inline buttons if somesing wrong clear history and try again with /start. Good luck!")
    if (!user && text && text !== '/start') { bot.sendMessage(chatId, "/start orqali qayta ro'yihatdan o'ting"); return }

    if (user) {
        if (user.action == 'request_contact' && !user.phone) contactHandler(msg);
        else if (user.action == 'add_category') createCategoryHandler(chatId, msg);
        else if (user.action == 'edit_category') editCategoryHandler(chatId, msg);

        else if (user.action.startsWith('add_product') && text !== "Mahsulot qo'shildi") addProductHandler(chatId, undefined, msg);
        else if (user.action.startsWith('edit_product')) editProductHandler(msg);
        else if (user.action.startsWith('order')) bookHandler(chatId, msg);
        else if (user.action.startsWith('typing_payment')) bookByCard(chatId, msg)
        
        else if (text.includes("Buyutrmalar")) bookHandler(chatId, msg);
        else if (text.includes("Menu")) katalogHandler(chatId);
        else if (text.includes("Savatcha")) showBasket(chatId);
        else if (text.includes("Navbatdagi buyutrmalar")) showAllBooksHandler(chatId);
        else if (text.includes("Mijozlar")) showAllUsers(chatId);
        else if (text.includes("Buyurtmalarim")) showBooks(chatId);
        else if (text.includes("Ma'lumotlarim")) bot.sendContact(chatId, '+998774779844', "To'lqinxon");
    }

})