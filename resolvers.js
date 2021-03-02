const { response } = require('express')
const fetch = require('node-fetch')
const db = require('./db')
const User = require('./models/User')
const Book = require('./models/Book')
const Channel = require('./models/Channel')
const Message = require('./models/Message')
const { PubSub } = require('graphql-subscriptions')
const { withFilter } = require('apollo-server-express')

const MESSAGE_ADDED = 'MESSAGE_ADDED'
const pubSub = new PubSub()


function requireAuth(userId) {
  if (!userId) {
    throw new Error('Unauthorized');
  }
}

const Query = {
  messages: async(_root, args, {userId}) => {
    //requireAuth(userId);
    const { messageList } = await Channel.findById(args.channelId)
    .populate({path: 'messageList', Model: Message, 
      populate: [{
        path: 'messageFrom',
        Model: User
      },{
        path: 'messageChannel',
        Model: Channel
      }]
    })
    return messageList
  },
  getUserChannels: async(root, args, {userId}) => {
    console.log("USERID" , userId)
    const { channels } = await User.findById(userId)
    .populate({path: 'channels', Model: Channel,
      populate: [{
        path: 'channelMembers',
        Model: Channel
      }, {
        path: 'messageList',
        Model: Channel,
          populate: [{path: 'messageFrom', Model: Message}]
      }]
    })
    console.log("CHANNELS", channels)
    return channels
  },
  getUsers: async (_root, _args, context) => {
    console.log(context)
    requireAuth(context.userId)
    const users = await User.find({}).exec()
    return users
  },
  getBooks: async (root, args, {userId}) => {
    const { books_selected, books_rejected, books_snoozed } = await User.findById(userId)
    const books_snoozed_ids = books_snoozed.map(book => book.book_id)
    const ignore_books = books_selected.concat(books_rejected).concat(books_snoozed_ids)
    bookList = await Book
    .find({ "_id": { "$nin": ignore_books } })
    .sort([['bestsellers_date', -1]])
    .limit(10)
    console.log(bookList)
    return bookList
  },
  getSelectedBooks: async (_root, {userId}) => {
    const { books_selected } = await User.findById(userId).populate('books_selected')
    return books_selected
  },
  getUserFriends: async (_root, {userId}) => {
    const { friends } = await User.findById(userId).populate('friends')
    return friends
  }
 }

const Mutation = {
  addMessage: async(_root, {input}, {userId}) => {
    //requireAuth(userId);
    console.log(input)
    const newMessage = await Message.create({messageFrom: input.messageFrom, messageText: input.messageText, messageChannel: input.messageChannel})
    const newMessagePop= await Message.findById(newMessage._id).populate('messageFrom').populate('messageChannel')
    const newMessageList = await Channel.updateOne({_id: input.messageChannel}, {$push: {messageList: newMessage._id}}) 
    console.log("newMessage", newMessage)
    console.log("newMessageList", newMessageList)
    pubSub.publish(MESSAGE_ADDED, {messageChannel: input.messageChannel, messageAdded: newMessagePop})
    return newMessagePop
  },
  addUser: async (_root, args) => {
    try {
        let response = await User.create(args)
        return response
    } catch(err) {
        return err.message
    }
  },
  selectBook: async (_root, args) => {
    try {
        let books_selected_update = await User.findOneAndUpdate(
          {_id: userId },
          { $push: { books_selected: args.new_book_selected } }, 
        )
        return books_selected_update
    } catch(err) {
        return err.message
    }
  },
  rejectBook: async (_root, args) => {
    try {
        let books_rejected_update = await User.findOneAndUpdate(
          {_id: userId },
          { $push: { books_rejected: args.new_book_rejected } }, 
        )
        return books_rejected_update
    } catch(err) {
        return err.message
    }
  },
  snoozeBook: async (_root, args) => {
    try {
        let books_snoozed_update = await User.findOneAndUpdate(
          {_id: userId },
          { $push: { books_snoozed: {book_id: args.new_book_snoozed, date_created: new Date().toISOString()} } }, 
        )
        return books_snoozed_update
    } catch(err) {
        return err.message
    }
  },
  addBook: async(_root, {input}, context) => {
    try {

      const response = await fetch('https://api.nytimes.com/svc/books/v3/lists/2010-09-03/hardcover-fiction.json?api-key=rFRBnSgrDocNqeQ8na4HO1oCw6OyAYaX')
      const books = await response.json()
      //console.log(books.results.bestsellers_date)
                    
      const bookList = await books.results.books.map(book => ({
        title: book.title,
        author: book.author,
        book_image: book.book_image,
        description: book.description.replace(/\n/g, ''),
        primary_isbn13: book.primary_isbn13,
        bestsellers_date: books.results.bestsellers_date
       }))
                  
      const saveBook = async(book) => {
        const bookExists = await Book.findOne({primary_isbn13: book.primary_isbn13}).exec()
          if (bookExists) {
            console.log({...bookExists._doc, status: "Already in database."})
            return {...bookExists._doc, status: "Already in database."}
          } else {
            const savedBook = await Book.create(book)
            //console.log(savedBook)
            return {...savedBook._doc, status: "Added to database."}
          }   
      }
     
      const savedBookList = async() => {
        console.log(Promise.all(bookList.map(book => saveBook(book))))
        return Promise.all(bookList.map(book => saveBook(book)))
      }
      
      const finalBookList = await savedBookList().then(data => {
        //console.log(data)
        return data
      })

      //console.log("final: ", finalBookList)
      return finalBookList

    } catch(err) {

      return err.message

    }
  }
}

const Subscription = {
  messageAdded: {
    subscribe: withFilter(
      () => pubSub.asyncIterator(MESSAGE_ADDED),
      (payload, variables) => {
        console.log("PAYLOAD", payload)
        return (payload.messageChannel === variables.messageChannel)
      } 
    )
  }
}



module.exports = { Query, Mutation, Subscription };
