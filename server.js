var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");
var exphbs = require("express-handlebars");


var db = require("./models");

var PORT = process.env.PORT || 3000;

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

 const app = express();


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.engine(
    "handlebars",
    exphbs({
      defaultLayout: "main"
    })
  );
app.set("view engine", "handlebars");

app.get("/", function(req, res) {
    db.Article.find({})
        .then(function(dbArticle) {
            res.render("index", {
                articles: dbArticle
            })
            
        })
        .catch(function(err) {
            res.json(err)
        })
    })
        
    
    
    



app.get("/scrape", function(req, res) {

    request("https://www.sfgate.com/", function(error, response, html) {
    
        var $ = cheerio.load(html);
    
        var results = [];
    
        $("div.core-headline-list.aboutsfgate div.itemWrapper").each(function(i, element) {
            var title = $(element).find("h5 a").text();
            // console.log(title);  
            const site = "https://sfgate.com";
            const blogSf = "https://blog.sfgate.com";
            var link = $(element).find("a").attr("href")
            
            if (link.includes(blogSf)) {
            link = link
        }  else {
            link = site + link 
        };
        
            console.log(link);

            var article = {
                title: title,
                link: link
            };

            db.Article.findOne({title: title})
                .then(function(exists) {
                    if (!exists) {
                        return  db.Article.create(article)
                    }
                })
                .then(function(dbArticle){
                    console.log(dbArticle);
                })
                .catch(function(dbArticle){
                    res.json(err)
                })
            });

    })
        
        res.send("Scrape complete")

})


app.get("/articles", function(req, res) {
    db.Article.find({})
        .then(function(dbArticle) {
            res.json(dbArticle)
        })
        .catch(function(err) {
            res.json(err)
        })
})

app.get("/articles/:id", function(req, res) {
    db.Article.findById(req.params.id)
    .populate("notes")
    .then(function(dbArticle) {
        res.render("comment", dbArticle)
      })
      .catch(function(err) {
        res.json(err);
      })
      
})

app.post("/articles/:id", function(req, res) {
    var newNote = req.body;
  
    db.Note.create(newNote)
      .then(function(dbNote) {
        return db.Article.findByIdAndUpdate(req.params.id, {
          $push: { notes: dbNote._id }
          }, { new: true });
      })
      .then(function(dbArticle) {
        res.json(dbArticle)
      })
      .catch(function(err) {
        res.json(err);
      })
  })

  app.delete("/comments/:id", function(req, res) {
    // Remove its association from its article(s)
    db.Article.update({ notes: req.params.id }, { $pull: { notes: req.params.id }})
      .then(function(dbArticle) {
      // Delete the comment itself
      db.Note.findByIdAndRemove(req.params.id)
        .then(function(dbNote) {
          res.json(dbNote)
        })
        .catch(function(err) {
          res.json(err)
        })
    })
  })




// Listen on port 3000
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });

  //adding and deleting comments; able to view all comments. deploy project
