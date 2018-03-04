var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var sentiment = require('sentiment');

//WIKI
var wikipedia = require("wikipedia-js");
var htmlToText = require('html-to-text');
 


//TWIT
var Twit = require("twit");
var config = require('./config');
var T = new Twit(config);


app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");




// ROUTES
app.get("/", function(req, res){
   res.render("home");
});

app.post("/", function(req, res){
    //get the string from the html
    var searchString = req.body.searchString;
    console.log("Search: "+searchString);
    
    
    
    
    var params = { 
      q: searchString, 
      count: 100, //maximum 100
      lang: 'en'
    };
    function gotData(err, data, response) {
      if(err){
        console.log(err);
      }
      
      var tweets = data.statuses;
      for(var i=0; i<tweets.length; i++){
        var r1 = sentiment(tweets[i].text);
        console.log("---------------------");
        console.log("Tweet["+i+"]: "+tweets[i].text);
        console.log("User Followers: "+tweets[i].user.followers_count);
        console.log("Tweet Language: "+tweets[i].lang);
        console.log("Score: "+r1.score);
      }
      // console.log(data)  -> will print the whole tweet json with all attributes.
    };
    T.get('search/tweets', params, gotData);
    

    
    //WIKIPEDIA SCRAPING

    var query = searchString;
    // if you want to retrieve a full article set summaryOnly to false. 
    // Full article retrieval and parsing is still beta 
    var options = {query: query, format: "html", summaryOnly: true};
    wikipedia.searchArticle(options, function(err, htmlWikiText){
      if(err){
        console.log("An error occurred[query=%s, error=%s]", query, err);
        return;
      }

      var text = htmlToText.fromString(htmlWikiText, {
         wordwrap: 130, //no. of words in a line
         ignoreHref: true // ignore links
    });

    console.log(text);
    });
    
    res.redirect("/show");
});



app.get("/show", function(req, res){
    res.render("show");
});


app.listen(8080, process.env.IP, function(){
   console.log("Server Started!"); 
});