const BasketModel = require("../../model/Basket.model");
const BookModel = require("../../model/Book.model");
const CategoryModel = require("../../model/Category.model");
const UserModel = require("../../model/User.model");
const { bot } = require("../bot");
const { adminKeyboard, userKeyboard } = require("../menu/keyboard");

const sendBooktoAdmin = async (chatId, bookId) => {
    try {
        // ⬇️ Eng eski buyurtma birinchi, eng yangi oxirida bo‘ladi
        const book = await BookModel.findOne({ _id: bookId })
            .populate('products.product', { title: 1, price: 1 })
            .sort({ createdAt: 1 });  // ⬅️ bu joyga e'tibor bering

        if (!book) {
            await bot.sendMessage(chatId, "📭 Hozircha hech qanday buyurtma yo‘q");
            return;
        }

        let productText = '';
        let total = 0;

        for (const item of book.products) {
            const sum = item.product.price * item.count;
            total += sum;
            productText += `📌 <b>${item.product.title}</b>\n` +
                `🧮 Soni: ${item.count} ta\n` +
                `💵 Narxi: ${item.product.price} so'm\n` +
                `📊 Jami: ${sum} so'm\n\n`;
        }

        const bookInfo =
            `📝 <b>Buyurtma ID:</b> ${book._id}\n` +
            `📍 <b>Manzil:</b> ${book.location}\n` +
            `📞 <b>Telefon:</b> ${book.phone}\n` +
            `🚚 <b>Yetkazish:</b> ${book.delivering}\n` +
            `💳 <b>To'lov turi:</b> ${book.payment_type}\n` +
            `📦 <b>Status:</b> ${book.status}\n` +
            `💰 <b>Umumiy summa:</b> ${total} so'm\n\n` +
            `📦 <b>Mahsulotlar:</b>\n${productText}`;

        await bot.sendMessage(chatId, bookInfo, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Qabul qilindi", callback_data: `book_receive-${book._id}` }],
                    [{ text: "Tayyorlanmoqda", callback_data: `book_preparing-${book._id}` }],
                    [{ text: "Yetkazilmoqda", callback_data: `book_delivering-${book._id}` }],
                ]
            }
        });
    } catch (err) {
        console.error("sendBooktoAdmin error:", err);
        await bot.sendMessage(chatId, "⚠️ Buyurtmalarni ko‘rsatishda xatolik yuz berdi");
    }
};

const bookHandler = async (chatId, msg, cancelAdditionalProduct = false) => {
    try {
        const basket = await BasketModel.findOne({ chatId }).populate('products.product', { title: 1, price: 1, category: 1 });
        const user = await UserModel.findOne({ chatId })
        const admin = await UserModel.findOne({ admin: true });

        let additionalProduct = ['Ichimliklar', 'Fri'];
        for (const item of basket.products) {
            const category = await CategoryModel.findById(item.product?.category)
            const idx = additionalProduct.findIndex((item) => item == category.title);
            if (idx > -1) additionalProduct.splice(idx, 1);
        }

        if (additionalProduct.length && !cancelAdditionalProduct) {
            let categories = []
            for (const item of additionalProduct) {
                const category = await CategoryModel.findOne({ title: item })
                categories.push(category)
            }
            categories = categories.map(category => [{ text: category.title, callback_data: `category_${category._id}` }])
            bot.sendMessage(chatId, "Taklif qilinadigan menular ro'yixati", {
                reply_markup: {
                    remove_keyboard: false,
                    inline_keyboard: [
                        !categories.length ? [{ text: 'Hali menu mavjud emas', callback_data: 'noop' }] : [],
                        ...categories,
                        user.admin ? [{ text: "Yangi menu qo'shish", callback_data: 'add_category' }] : [],
                        [{ text: "❌ Bekor qilish", callback_data: 'cancel_additional_product' }]
                    ].filter(row => row.length > 0)
                }
            })
        }

        if (basket && (!additionalProduct.length || cancelAdditionalProduct)) {
            let total = 0;
            for (const item of basket.products) {
                const sum = item.product?.price * item.count;
                total += sum;
            }
            const newBook = await BookModel.create({ chatId, products: basket.products, phone: user.phone, total_price: total });
            await BasketModel.findOneAndDelete({ chatId });
            await UserModel.updateOne({ chatId }, { action: 'order_payment_type', tempBookId: newBook._id });
            bot.sendMessage(chatId, "To'lov turini tanlang", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '💵 Click', callback_data: 'card' }, { text: '💳 Payme', callback_data: 'card' }, { text: "💴 Paynet", callback_data: 'card' }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            });
        }
    }
    catch (err) {
        console.error("bookHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Buyurtma qabul qilishda xatolik yuz berdi");
    }

}

const bookByCard = async (chatId, msg = '') => {
    const user = await UserModel.findOne({ chatId })
    const book = await BookModel.findById(user.tempBookId)
    if (msg && !isNaN(msg.text)) {
        if (Number(msg.text) >= book.total_price) {
            const admin = await UserModel.findOne({ admin: true });
            const newBook = await BookModel.findByIdAndUpdate(user.tempBookId, { location: "none", payment_type: "none", delivering: "none" }, { new: true });
            await UserModel.updateOne({ chatId }, { action: 'menu' });
            bot.sendMessage(chatId, "Buyurtmangiz aktive holatga o'tkazildi siz bilan aloqaga chiqishlarini kuting. Buyurtmangiz holatini buyurtmalrim bo'limindan kuzatib borasiz. Haridingiz uchun tashakkur!")
            sendBooktoAdmin(admin.chatId, newBook._id)
        } else {
            await bot.sendMessage(chatId, `${book.total_price} so'm miqdorda to'lov qilishingiz shart`);
        }
    } else {
        await bot.sendMessage(chatId, `${book.total_price} so'm to'lov qiling`);
        await UserModel.updateOne({ chatId }, { action: 'typing_payment' });
    }
}



const showAllBooksHandler = async (chatId) => {
    try {
        // ⬇️ Eng eski buyurtma birinchi, eng yangi oxirida bo‘ladi
        const books = await BookModel.find()
            .populate('products.product', { title: 1, price: 1 })
            .sort({ createdAt: 1 });  // ⬅️ bu joyga e'tibor bering

        if (!books.length) {
            await bot.sendMessage(chatId, "📭 Hozircha hech qanday buyurtma yo‘q");
            return;
        }

        for (const book of books) {
            let productText = '';
            let total = 0;

            for (const item of book.products) {
                const sum = item.product?.price * item.count;
                total += sum;
                productText += `📌 <b>${item?.product?.title}</b>\n` +
                    `🧮 Soni: ${item.count} ta\n` +
                    `💵 Narxi: ${item?.product?.price} so'm\n` +
                    `📊 Jami: ${sum} so'm\n\n`;
            }

            const bookInfo =
                `📝 <b>Buyurtma ID:</b> ${book._id}\n` +
                `📍 <b>Manzil:</b> ${book.location}\n` +
                `📞 <b>Telefon:</b> ${book.phone}\n` +
                `🚚 <b>Yetkazish:</b> ${book.delivering}\n` +
                `💳 <b>To'lov turi:</b> ${book.payment_type}\n` +
                `📦 <b>Status:</b> ${book.status}\n` +
                `💰 <b>Umumiy summa:</b> ${total} so'm\n\n` +
                `📦 <b>Mahsulotlar:</b>\n${productText}`;

            await bot.sendMessage(chatId, bookInfo, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Qabul qilindi", callback_data: `book_receive-${book._id}` }],
                        [{ text: "Tayyorlanmoqda", callback_data: `book_preparing-${book._id}` }],
                        [{ text: "Yetkazilmoqda", callback_data: `book_delivering-${book._id}` }],
                    ]
                }
            });
        }

    } catch (err) {
        console.error("showAllBooksHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Buyurtmalarni ko‘rsatishda xatolik yuz berdi");
    }
};

const showAllUsers = async (chatId) => {
    try {
        const users = await UserModel.find();

        if (!users.length) {
            await bot.sendMessage(chatId, "📭 Hozircha hech qanday foydalanuvchilar yo‘q");
            return;
        }

        for (const user of users) {
            const bookInfo =
                `💪 <b>Adminmi:</b> ${user.admin ? 'Ha' : " Yo'q"}\n` +
                `📁 <b>Ism, Sharif:</b> ${user.name}\n` +
                `📞 <b>Telefon:</b> ${user.phone}\n` +
                `🗑 <b>O'chirilganmi:</b> ${user.status ? "Yo'q" : "Ha"}\n` 

                await bot.sendMessage(chatId, bookInfo, {
                    parse_mode: 'HTML',
                });
        }

    } catch (err) {
        console.error("showAllUsers error:", err);
        await bot.sendMessage(chatId, "⚠️ Mijozlarni ko‘rsatishda xatolik yuz berdi");
    }
};

const refreshShowAllBooksHandler = async (chatId, messageId, bookId) => {
    try {
        // ⬇️ Eng eski buyurtma birinchi, eng yangi oxirida bo‘ladi
        const book = await BookModel.findById(bookId)
            .populate('products.product', { title: 1, price: 1 })
            .sort({ createdAt: 1 });  // ⬅️ bu joyga e'tibor bering

        if (!book) {
            await bot.sendMessage(chatId, "📭 Hozircha hech qanday buyurtma yo‘q");
            return;
        }
        let total = 0;
        let productText = ''


        for (const item of book.products) {
            const sum = item.product.price * item.count;
            total += sum;
            productText += `📌 <b>${item.product.title}</b>\n` +
                `🧮 Soni: ${item.count} ta\n` +
                `💵 Narxi: ${item.product.price} so'm\n` +
                `📊 Jami: ${sum} so'm\n\n`;
        }

        const bookInfo =
            `📝 <b>Buyurtma ID:</b> ${book._id}\n` +
            `📍 <b>Manzil:</b> ${book.location}\n` +
            `📞 <b>Telefon:</b> ${book.phone}\n` +
            `🚚 <b>Yetkazish:</b> ${book.delivering}\n` +
            `💳 <b>To'lov turi:</b> ${book.payment_type}\n` +
            `📦 <b>Status:</b> ${book.status}\n` +
            `💰 <b>Umumiy summa:</b> ${total} so'm\n\n` +
            `📦 <b>Mahsulotlar:</b>\n${productText}`;

        await bot.editMessageText(bookInfo, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: `${book.status == 'book_receive' ? '📌' : ''} Qabul qilindi`, callback_data: `book_receive-${book._id}` }],
                    [{ text: `${book.status == 'book_preparing' ? '📌' : ''} Tayyorlanmoqda`, callback_data: `book_preparing-${book._id}` }],
                    [{ text: `${book.status == 'book_delivering' ? '📌' : ''} Yetkazilmoqda`, callback_data: `book_delivering-${book._id}` }],
                ]
            }
        });

    } catch (err) {
        console.error("refreshShowAllBooksHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Buyurtmalarni ko‘rsatishda xatolik yuz berdi");
    }
};

const refreshShowBooks = async (chatId, messageId, bookId) => {
    try {
        // ⬇️ Eng eski buyurtma birinchi, eng yangi oxirida bo‘ladi
        const book = await BookModel.findById(bookId)
            .populate('products.product', { title: 1, price: 1 })
            .sort({ createdAt: 1 });  // ⬅️ bu joyga e'tibor bering

        if (!book) {
            await bot.sendMessage(chatId, "📭 Hozircha hech qanday buyurtma yo‘q");
            return;
        }
        let total = 0;
        let productText = ''



        for (const item of book.products) {
            const sum = item.product.price * item.count;
            total += sum;
            productText += `📌 <b>${item.product.title}</b>\n` +
                `🧮 Soni: ${item.count} ta\n` +
                `💵 Narxi: ${item.product.price} so'm\n` +
                `📊 Jami: ${sum} so'm\n\n`;
        }

        const bookInfo =
            `📝 <b>Buyurtma ID:</b> ${book._id}\n` +
            `📍 <b>Manzil:</b> ${book.location}\n` +
            `📞 <b>Telefon:</b> ${book.phone}\n` +
            `🚚 <b>Yetkazish:</b> ${book.delivering}\n` +
            `💳 <b>To'lov turi:</b> ${book.payment_type}\n` +
            `📦 <b>Status:</b> ${book.status}\n` +
            `💰 <b>Umumiy summa:</b> ${total} so'm\n\n` +
            `📦 <b>Mahsulotlar:</b>\n${productText}`;

        await bot.editMessageText(bookInfo, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: `${book.status == 'book_here' ? '📌' : ''} Yetkazildi`, callback_data: `book_here-${book._id}` }]
                ]
            }
        });

    } catch (err) {
        console.error("refreshShowBooks error:", err);
        await bot.sendMessage(chatId, "⚠️ Buyurtmalarni ko‘rsatishda xatolik yuz berdi");
    }
};

const showBooks = async (chatId) => {
    try {
        // ⬇️ Eng eski buyurtma birinchi, eng yangi oxirida bo‘ladi
        const books = await BookModel.find({ chatId })
            .populate('products.product', { title: 1, price: 1 })
            .sort({ createdAt: 1 });  // ⬅️ bu joyga e'tibor bering

        if (!books.length) {
            await bot.sendMessage(chatId, "📭 Hozircha hech qanday buyurtma yo‘q");
            return;
        }

        for (const book of books) {
            let productText = '';
            let total = 0;

            for (const item of book.products) {
                const sum = item.product.price * item.count;
                total += sum;
                productText += `📌 <b>${item.product.title}</b>\n` +
                    `🧮 Soni: ${item.count} ta\n` +
                    `💵 Narxi: ${item.product.price} so'm\n` +
                    `📊 Jami: ${sum} so'm\n\n`;
            }

            const bookInfo =
                `📝 <b>Buyurtma ID:</b> ${book._id}\n` +
                `📍 <b>Manzil:</b> ${book.location}\n` +
                `📞 <b>Telefon:</b> ${book.phone}\n` +
                `🚚 <b>Yetkazish:</b> ${book.delivering}\n` +
                `💳 <b>To'lov turi:</b> ${book.payment_type}\n` +
                `📦 <b>Status:</b> ${book.status}\n` +
                `💰 <b>Umumiy summa:</b> ${total} so'm\n\n` +
                `📦 <b>Mahsulotlar:</b>\n${productText}`;

            await bot.sendMessage(chatId, bookInfo, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Yetkazildi", callback_data: `book_here-${book._id}` }]
                    ]
                }
            });
        }



    } catch (err) {
        console.error("showBooks error:", err);
        await bot.sendMessage(chatId, "⚠️ Buyurtmalarni ko‘rsatishda xatolik yuz berdi");
    }
};

module.exports = { bookHandler, showBooks, showAllBooksHandler, refreshShowAllBooksHandler, refreshShowBooks, bookByCard, showAllUsers }