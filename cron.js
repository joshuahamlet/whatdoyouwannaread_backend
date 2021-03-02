const schedule = require('node-schedule')
const dateArray = require('./datearray').dateArray
const fetch = require('node-fetch')
const Book = require('./models/Book')
const fs = require('fs')

const cronJob = async(date) => {
    try {   
      const response = await fetch(`https://api.nytimes.com/svc/books/v3/lists/${date}/hardcover-fiction.json?api-key=rFRBnSgrDocNqeQ8na4HO1oCw6OyAYaX`)
      const books = await response.json()
      //console.log(books.results.bestsellers_date)
      //console.log("hi there")


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
            //console.log({...bookExists._doc, status: "Already in database."})
            return {...bookExists._doc, status: "Already in database."}
          } else {
            const savedBook = await Book.create(book)
            //console.log(savedBook)
            return {...savedBook._doc, status: "Added to database."}
          }   
      }
  
      const savedBookList = async() => {
        //console.log(Promise.all(bookList.map(book => saveBook(book))))
        return Promise.all(bookList.map(book => saveBook(book)))
      }

      const finalBookList = await savedBookList().then(data => {
        //console.log(data)
        return data
      })    
      //console.log("final: ", finalBookList.length)

      const addedArray = finalBookList.map(addStatus => {
        return addStatus.status === "Added to database." ? 1 : 0
      })
      
      const addedCount = addedArray.reduce((total, currentVal) => total + currentVal)

      console.log(`===${date}: ${addedCount} new records added===`)
      fs.appendFile('cronjob.txt', `\n===${date}: ${addedCount} new records added===`, function (err) {
        if (err) throw err;})

      //return finalBookList  
    } catch(err) {  
      return err.message    
    }
}

exports.doesitWork = () => {
    let counter = dateArray.length - 1
    
    schedule.scheduleJob('*/5 * * * * *', () => {
        if(counter > -1) {
            cronJob(dateArray[counter])
            console.log(`##############${counter} to go!##############`)
            fs.appendFile('cronjob.txt', `\n##############${counter} to go!##############`, function (err) {
                if (err) throw err;})
            counter--
        }

    })
}