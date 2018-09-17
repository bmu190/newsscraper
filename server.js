/* Showing Mongoose's "Populated" Method
 * =============================================== */
// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;
// Initialize Express
var app = express();
// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

//Requiring Handlebars
let exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Make public a static dir
app.use(express.static("public"));
// Database configuration with mongoose
mongoose.connect((" mongodb://heroku_8bhbmw93:lha9sjjc8psebunn0ltt5ien2i@ds255332.mlab.com:55332/heroku_8bhbmw9"), { useNewUrlParser: true });
var db = mongoose.connection;
// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});

app.get("/", function(req, res) {


  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
  
    else {
 
      res.render("index", {articles: doc});
    }
  });
});


app.get("/scrape", function(req, res) {

  request("https://www.washingtonpost.com/", function(error, response, html) {

    var $ = cheerio.load(html);

    $("article h2").each(function(i, element) {
      // Save an empty result object
      var result = {};

      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");
  
      var entry = new Article(result);
   
      Article.findOne({ "title": result.title })
        .exec(function(error, doc) {
     
          if (error) {
           console.log(error);
           }
    
          else {
            if (doc == null) {
               entry.save(function(err, doc) {
                  // Log any errors
                  if (err) {
                    console.log(err);
                  }
                  // Or log the doc
                  else {
                    console.log(doc);
                  }
                });
            }
          }
          });
      });
    });
  

 
  res.redirect("/");
  
});




app.get("/articles", function(req, res) {
 
  Article.find({}, function(error, doc) {
   
    if (error) {
      console.log(error);
    }
   
    else {
      res.json(doc);
    }
  });
});


app.get("/articles/:id", function(req, res) {
  
  Article.findOne({ "_id": req.params.id })

  .populate("note")

  .exec(function(error, doc) {

    if (error) {
      console.log(error);
    }

    else {
      res.json(doc);
    }
  });
});


app.post("/articles/:id", function(req, res) {

  var newNote = new Note(req.body);

  newNote.save(function(error, doc) {
 
    if (error) {
      console.log(error);
    }
  
    else {
      
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      
      .exec(function(err, doc) {
      
        if (err) {
          console.log(err);
        }
        else {
          
          res.send(doc);
        }
      });
    }
  });
});

let port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("App running on port 3000!");
});