const CategoryModel = require("../../model/Category.model");
const ProductModel = require("../../model/Product.model");
const UserModel = require("../../model/User.model");
const { bot } = require("../bot");
const katalogHandler = require("./katalog.handler");

const showProducts = async (chatId, category_id) => {
    try {
        const user = await UserModel.findOne({ chatId });
         await UserModel.updateOne({ chatId }, { tempCategoryId: category_id });
        let products = await ProductModel.find({ category: category_id, status: true });
        let category = await CategoryModel.findById(category_id)
        if (!products.length) {
            bot.sendMessage(chatId, `<b>${category.title}</b> mahsulotlari hali mavjud emas`, {
                parse_mode: 'HTML',
                reply_markup: {
                    remove_keyboard: false,
                    inline_keyboard: [
                        user.admin ? [{ text: `${category.title} qo'shish`, callback_data: `add_product-${category_id}` }] : [],
                        user.admin ? [{ text: `${category.title} menusini qayta nomlash`, callback_data: `edit_category-${category_id}` }] : [],
                        user.admin ? [{ text: `${category.title} menusini o'chirish`, callback_data: `delete_category-${category_id}` }] : []
                    ].filter(row => row.length > 0)
                }
            })
            return
        }

        for (const product of products) {
            await bot.sendPhoto(chatId, product.img, {
                caption: `<b>Maxsulot nomi: </b> ${product.title}\n<b>Narxi: </b> ${product.price} so'm.`,
                parse_mode: 'HTML',
                reply_markup: {
                    remove_keyboard: false,
                    inline_keyboard: [
                        user.admin ? [{ text: "O'chirish", callback_data: `delete_product-${product._id}` }] : [],
                        user.admin ? [{ text: "Taxrirlash", callback_data: `edit_product-${product._id}` }] : [],
                        !user.admin ? [{ text: '🛒 Sotib olish', callback_data: `basket_product-${product._id}` }] : []
                    ].filter(row => row.length > 0)
                }
            });
        }
        if (user.admin) {
            bot.sendMessage(chatId, `<b>${category.title} </b> maxsulotlarini qo'shish yoki menuni o'chirish`, {
                parse_mode: 'HTML',
                reply_markup: {
                    remove_keyboard: false,
                    inline_keyboard: [
                        user.admin ? [{ text: `${category.title} qo'shish`, callback_data: `add_product-${category_id}` }] : [],
                        user.admin ? [{ text: `${category.title} menusini qayta nomlash`, callback_data: `edit_category-${category_id}` }] : [],
                        user.admin ? [{ text: `${category.title} menusini o'chirish`, callback_data: `delete_category-${category_id}` }] : []
                    ].filter(row => row.length > 0)
                }
            })
        }


    }
    catch (err) {
        console.error("showProducts error:", err);
        await bot.sendMessage(chatId, "⚠️ Maxsulotlarni ko'rsatishda xatolik yuz berdi");
    }
}

const refreshShowProducts = async (chatId, messageId) => {
    try {
        const user = await UserModel.findOne({ chatId });
        const category_id = user.tempCategoryId;
        let products = await ProductModel.find({ category: category_id, status: true });
        let category = await CategoryModel.findById(category_id)
        if (!products.length) {
            bot.sendMessage(chatId, `<b>${category.title}</b> mahsulotlari hali mavjud emas`, {
                parse_mode: 'HTML',
                reply_markup: {
                    remove_keyboard: false,
                    inline_keyboard: [
                        user.admin ? [{ text: `${category.title} qo'shish`, callback_data: `add_product-${category_id}` }] : [],
                        user.admin ? [{ text: `${category.title} menusini qayta nomlash`, callback_data: `edit_category-${category_id}` }] : [],
                        user.admin ? [{ text: `${category.title} menusini o'chirish`, callback_data: `delete_category-${category_id}` }] : []
                    ].filter(row => row.length > 0)
                }
            })
            return
        }

        for (const product of products) {
            await bot.editMessageReplyMarkup(
                {
                    inline_keyboard: [
                         !user.admin ? [{ text: `📌 Savatchaga qo'shildi`, callback_data: `basket_product-${product._id}` }] : []
                    ]
                },
                {
                    chat_id: chatId,
                    message_id: messageId
                }
            );
        }
        if (user.admin) {
            bot.sendMessage(chatId, `<b>${category.title} </b> maxsulotlarini qo'shish yoki menuni o'chirish`, {
                parse_mode: 'HTML',
                reply_markup: {
                    remove_keyboard: false,
                    inline_keyboard: [
                        user.admin ? [{ text: `${category.title} qo'shish`, callback_data: `add_product-${category_id}` }] : [],
                        user.admin ? [{ text: `${category.title} menusini qayta nomlash`, callback_data: `edit_category-${category_id}` }] : [],
                        user.admin ? [{ text: `${category.title} menusini o'chirish`, callback_data: `delete_category-${category_id}` }] : []
                    ].filter(row => row.length > 0)
                }
            })
        }


    }
    catch (err) {
        console.error("showProducts error:", err);
        await bot.sendMessage(chatId, "⚠️ Maxsulotlarni ko'rsatishda xatolik yuz berdi");
    }
}

const addProductHandler = async (chatId, queryData = '-', msg) => {
    try {
        const category_id = queryData.split('-')[1];
        if (category_id) {
            const product = await ProductModel.create({ category: category_id });
            await UserModel.updateOne({ chatId }, { action: 'add_product_title', tempCategoryId: category_id, draftProductId: product._id });
            bot.sendMessage(chatId, "Maxsulot nomini kiriting");
            return
        }
        const user = await UserModel.findOne({ chatId });
        if (user.admin) {
            switch (user.action) {
                case 'add_product_title':
                    await ProductModel.findByIdAndUpdate(user.draftProductId, { title: msg.text });
                    await UserModel.updateOne({ chatId }, { action: 'add_product_price' });
                    bot.sendMessage(chatId, "Narxini kiriting faqat son kiriting so'm so'zini qo'shib yubormang");
                    break;

                case 'add_product_price':
                    await ProductModel.findByIdAndUpdate(user.draftProductId, { price: msg.text });
                    await UserModel.updateOne({ chatId }, { action: 'add_product_img' });
                    bot.sendMessage(chatId, "Rasmini yuboring");
                    break;

                case 'add_product_img':
                    if (msg.photo && !msg.text) {
                        const fileId = msg.photo.at(-1).file_id;
                        await ProductModel.findByIdAndUpdate(user.draftProductId, { img: fileId });
                        await UserModel.updateOne({ chatId }, { action: 'menu', draftProductId: null });
                    }
                    break;
            }
        }
        else {
            bot.sendMessage(chatId, 'Sizga admin emassiz !');
        }

    }
    catch (err) {
        console.error("addProductHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Maxsulot qo'shishda xatolik yuz berdi");
    }
}

const deleteProductHandler = async (chatId, messageId, queryData = '-',) => {
    try {
        const product_id = queryData.split('-')[1];
        const user = await UserModel.findOne({ chatId });
        if (!product_id && user.action == 'delete_product') {
            const product = await ProductModel.findOneAndUpdate({_id: user.draftProductId}, { status: false });
            await UserModel.updateOne({ chatId }, { action: 'menu', draftProductId: null });
            bot.editMessageReplyMarkup({
                inline_keyboard: [
                    user.admin ? [{ text: `Maxsulot muvaffaqiyatli o'chirildi`, callback_data: `noop` }] : [],
                ]
            }, {
                chat_id: chatId,
                message_id: messageId
            });
        }
        if (product_id) {
            const product = await ProductModel.findById(product_id);
            await UserModel.updateOne({ chatId }, { action: 'delete_product', draftProductId: product._id });

            if (user.admin) {
                bot.editMessageReplyMarkup({
                    inline_keyboard: [
                        user.admin ? [{ text: `Maxsulotni o'chirishni tasdiqlash`, callback_data: `delete_product` }] : [],
                        user.admin ? [{ text: `Bekor qilish`, callback_data: "cancel" }] : []
                    ].filter(row => row.length > 0)
                }, {
                    chat_id: chatId,
                    message_id: messageId
                });
                return
            }
            else {
                bot.sendMessage(chatId, 'Sizga admin emassiz !');
            }
        }


    }
    catch (err) {
        console.error("deleteProductHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Maxsulotlarni o'chirishda xatolik yuz berdi");
    }

}

const updateProductHandler = async (chatId, messageId, queryData = '-',) => {
    try {
        const product_id = queryData.split('-')[1];
        const user = await UserModel.findOne({ chatId });
        if (!product_id && user.action.startsWith('edit_product')) {
            const field = queryData.split('_')[2];
            switch (field) {
                case 'name':
                    await UserModel.updateOne({ chatId }, { action: 'edit_product_name' });
                    bot.sendMessage(chatId, "Maxsulotni yangi nomini kiriting");
                    break;

                case 'price':
                    await UserModel.updateOne({ chatId }, { action: 'edit_product_price' });
                    bot.sendMessage(chatId, "Maxsulotni yangi narxini kiriting faqat raqamlardan iborat bo'lsin");
                    break;

                case 'img':
                    await UserModel.updateOne({ chatId }, { action: 'edit_product_img' });
                    bot.sendMessage(chatId, "Maxsulotni yangi rasmini kiriting");
                    break;
            }


        }
        if (product_id) {
            const product = await ProductModel.findById(product_id);
            await UserModel.updateOne({ chatId }, { action: 'edit_product', draftProductId: product._id });
            if (user.admin) {
                bot.editMessageReplyMarkup({
                    inline_keyboard: [
                        user.admin ? [{ text: `Maxsulotni nomini o'zgartirish`, callback_data: `edit_product_name` }] : [],
                        user.admin ? [{ text: `Masulotni narxini o'zgartirish`, callback_data: "edit_product_price" }] : [],
                        user.admin ? [{ text: `Masulotni rasmini o'zgartirish`, callback_data: "edit_product_img" }] : [],
                        user.admin ? [{ text: `Bekor qilish`, callback_data: "cancel" }] : []
                    ].filter(row => row.length > 0)
                }, {
                    chat_id: chatId,
                    message_id: messageId
                });
                return
            }
            else {
                bot.sendMessage(chatId, 'Sizga admin emassiz !');
            }
        }


    }
    catch (err) {
        console.error("updateProductHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Maxsulotlarni ma'lumotlarnini yangilashda xatolik yuz berdi");
    }
}

const editProductHandler = async (msg) => {
    const chatId = msg?.chat?.id;
    try {
        const text = msg.text;
        const user = await UserModel.findOne({ chatId });

        if (user.admin) {
            const _id = user.draftProductId;
            if (_id && user.action.startsWith('edit_product')) {
                const field = user.action.split('_')[2];
                switch (field) {
                    case 'name':
                        const product = await ProductModel.findOneAndUpdate({ _id }, { title: text }, { new: true });
                        await UserModel.findOneAndUpdate({ chatId }, { action: 'menu' });
                        await bot.sendPhoto(chatId, product.img, {
                            caption: `<b>Maxsulot nomi: </b> ${product.title}\n<b>Narxi: </b> ${product.price} so'm.`,
                            parse_mode: 'HTML',
                            reply_markup: {
                                remove_keyboard: true,
                                inline_keyboard: [
                                    user.admin ? [{ text: "O'chirish", callback_data: `delete_product-${product._id}` }] : [],
                                    user.admin ? [{ text: "Taxrirlash", callback_data: `edit_product-${product._id}` }] : [],
                                    !user.admin ? [{ text: '🛒 Sotib olish', callback_data: `basket_product-${product._id}` }] : []
                                ].filter(row => row.length > 0)
                            }
                        });
                        break;

                    case 'price':
                        const product2 = await ProductModel.findOneAndUpdate({ _id }, { price: text }, { new: true });
                        await UserModel.findOneAndUpdate({ chatId }, { action: 'menu' });
                        await bot.sendPhoto(chatId, product2.img, {
                            caption: `<b>Maxsulot nomi: </b> ${product2.title}\n<b>Narxi: </b> ${product2.price} so'm.`,
                            parse_mode: 'HTML',
                            reply_markup: {
                                remove_keyboard: true,
                                inline_keyboard: [
                                    user.admin ? [{ text: "O'chirish", callback_data: `delete_product-${product2._id}` }] : [],
                                    user.admin ? [{ text: "Taxrirlash", callback_data: `edit_product-${product2._id}` }] : [],
                                    !user.admin ? [{ text: '🛒 Sotib olish', callback_data: `basket_product-${product2._id}` }] : []
                                ].filter(row => row.length > 0)
                            }
                        });
                        break;

                    case 'img':
                        if (msg.photo) {
                            const fileId = msg.photo.at(-1).file_id;
                            const product2 = await ProductModel.findOneAndUpdate({ _id }, { img: fileId }, { new: true });
                            await UserModel.findOneAndUpdate({ chatId }, { action: 'menu' });
                            await bot.sendPhoto(chatId, product2.img, {
                                caption: `<b>Maxsulot nomi: </b> ${product2.title}\n<b>Narxi: </b> ${product2.price} so'm.`,
                                parse_mode: 'HTML',
                                reply_markup: {
                                    remove_keyboard: true,
                                    inline_keyboard: [
                                        user.admin ? [{ text: "O'chirish", callback_data: `delete_product-${product2._id}` }] : [],
                                        user.admin ? [{ text: "Taxrirlash", callback_data: `edit_product-${product2._id}` }] : [],
                                        !user.admin ? [{ text: '🛒 Sotib olish', callback_data: `basket_product-${product2._id}` }] : []
                                    ].filter(row => row.length > 0)
                                }
                            });
                        }
                        break;
                }
            }
        }
        else {
            bot.sendMessage(chatId, 'Sizga admin emassiz !');
        }


    }
    catch (err) {
        console.error("editProductHandler error:", err);
        await bot.sendMessage(chatId, "⚠️ Maxsulotlarni ma'lumotlarini xatolik yuz berdi");
    }
}

const cancel = async (chatId, messageId) => {
    try {
        const user = await UserModel.findOne({ chatId });
        if (user.admin) {
            bot.editMessageReplyMarkup({
                inline_keyboard: [
                    user.admin ? [{ text: "O'chirish", callback_data: `delete_product-${user.draftProductId}` }] : [],
                    user.admin ? [{ text: "Taxrirlash", callback_data: `edit_product-${user.draftProductId}` }] : [],
                    !user.admin ? [{ text: '🛒 Sotib olish', callback_data: `basket_product-${user.draftProductId}` }] : []
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
        console.error("cancel error:", err);
        await bot.sendMessage(chatId, "⚠️ Bekor qilishda xatolik yuz berdi");
    }
}


module.exports = { showProducts, addProductHandler, deleteProductHandler, updateProductHandler, editProductHandler, cancel, refreshShowProducts }

