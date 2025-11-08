const BasketModel = require("../model/Basket.model");
const BookModel = require("../model/Book.model");
const UserModel = require("../model/User.model");
const { bot } = require("./bot");
const { addBasketHandler, refreshBasketMessage, refreshBasketTotalMessage } = require("./handlers/basket.handler");
const { bookHandler, refreshShowAllBooksHandler, refreshShowBooks, bookByCard } = require("./handlers/book.handler");
const { addCategoryHandler, editCategoryHandler, deleteCategoryHandler, cancelCategory } = require("./handlers/category.handler");
const { showProducts, addProductHandler, deleteProductHandler, cancel, updateProductHandler, refreshShowProducts } = require("./handlers/products.handler");


bot.on('callback_query', async (query) => {
    const queryData = query.data;
    const chatId = query.from.id;
    const messageId = query.message.message_id;
    const text = query.message
    const category_id = queryData.split('_')[1];

    const user = await UserModel.findOne({ chatId });
    if (queryData == 'add_category') addCategoryHandler(chatId)
    if (queryData.startsWith('edit_category')) editCategoryHandler(chatId, undefined, queryData);
    if (queryData.startsWith('delete_category')) deleteCategoryHandler(chatId, messageId, queryData);
    if (queryData.startsWith('cancel_category')) cancelCategory(chatId, messageId, queryData);

    if (queryData.startsWith('category_')) showProducts(chatId, category_id);
    if (queryData.startsWith('add_product')) addProductHandler(chatId, queryData);
    if (queryData.startsWith('delete_product')) deleteProductHandler(chatId, messageId, queryData);
    if (queryData.startsWith('edit_product')) updateProductHandler(chatId, messageId, queryData);
    if (queryData == 'cancel') cancel(chatId, messageId);

    if (queryData.startsWith('order')) bookHandler(chatId, { text: '' });
    if( queryData == 'card') bookByCard(chatId, undefined)
    if( queryData == 'cancel_additional_product') bookHandler(chatId, undefined, true);

    if (queryData.startsWith('basket_product')){ addBasketHandler(chatId, messageId, queryData); refreshShowProducts(chatId, messageId)}

    if (queryData.startsWith('increment-')) {
        const productId = queryData.split('-')[1];
        await BasketModel.updateOne(
            { chatId, 'products.product': productId },
            { $inc: { 'products.$.count': 1 } }
        );
        await refreshBasketMessage(chatId, messageId, productId);
    }

    if (queryData.startsWith('decrement-')) {
        const productId = queryData.split('-')[1];
        const basket = await BasketModel.findOne({ chatId, 'products.product': productId });
        const item = basket.products.find(p => p.product.toString() === productId);

        if (item && item.count > 1) {
            await BasketModel.updateOne(
                { chatId, 'products.product': productId },
                { $inc: { 'products.$.count': -1 } }
            );

            await refreshBasketMessage(chatId, messageId, productId);
        }
    }

    if (queryData.startsWith('total')) {
        await refreshBasketTotalMessage(chatId, messageId);
    }

    if (queryData.startsWith('remove-')) {
        const productId = queryData.split('-')[1];
        await BasketModel.updateOne(
            { chatId },
            { $pull: { products: { product: productId } } }
        );
        await bot.editMessageText("🗑 O'chirildi", {
            chat_id: chatId,
            message_id: messageId
        });
    }

    if (queryData.startsWith('book_receive')) {
        const bookId = queryData.split('-')[1];
        await BookModel.findByIdAndUpdate(bookId, { status: "book_receive" })
        await refreshShowAllBooksHandler(chatId, messageId, bookId);
    }

    if (queryData.startsWith('book_preparing')) {
        const bookId = queryData.split('-')[1];
        await BookModel.findByIdAndUpdate(bookId, { status: "book_preparing" })
        await refreshShowAllBooksHandler(chatId, messageId, bookId);
    }

    if (queryData.startsWith('book_delivering')) {
        const bookId = queryData.split('-')[1];
        await BookModel.findByIdAndUpdate(bookId, { status: "book_delivering" })
        await refreshShowAllBooksHandler(chatId, messageId, bookId);
    }


    if (queryData.startsWith('book_here')) {
        const bookId = queryData.split('-')[1];
        await BookModel.findByIdAndUpdate(bookId, { status: "book_here" })
        await refreshShowBooks(chatId, messageId, bookId);
    }
})