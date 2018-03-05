/*global CanvasJS*/
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var sentiment = require('sentiment');
var scoreData = {};
var wikiText = '';

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
   
    //var tweetsCount = 0;
    var totalScore  = 0;
    
    var positiveScore = 0;
    var negativeScore = 0;
    var positiveTweetCount = 0;
    var negativeTweetCount = 0;
    var neutralCount = 0;
    var maxTweets = 100; //default
    
    if(req.body.maxTweets){
        maxTweets = req.body.maxTweets;
    }
    console.log("Maximum Tweets Set to: "+maxTweets);
    
    var params = { 
      q: searchString, 
      count: maxTweets, //maximum 100
      lang: 'en'
    };
    function gotData(err, data, response) {
      if(err){
        console.log(err);
      }
      
      var tweets = data.statuses;
      for(var i=0; i<tweets.length; i++){
        var r1 = sentiment(tweets[i].text);
        if(r1.score === 0){
            neutralCount++;
        } else if(r1.score > 0) {
            positiveTweetCount++;
            positiveScore += r1.score;
        } else {
            negativeTweetCount++;
            negativeScore += r1.score;
        }
        totalScore = totalScore + r1.score;
        
        
        console.log("---------------------");
        console.log("Tweet["+i+"]: "+tweets[i].text);
        console.log("User Followers: "+tweets[i].user.followers_count);
        console.log("Tweet Language: "+tweets[i].lang);
        console.log("Score: "+r1.score);
      }
      console.log("==============");
      console.log("Positive Score: ["+positiveTweetCount+" tweets]: " +positiveScore);
      console.log("Negative Score: ["+negativeTweetCount+" tweets]: " +negativeScore);
      console.log("Neutral Count: "+neutralCount);
      console.log("Total Average Score: "+totalScore/maxTweets);
      
      scoreData = {
        totalScore: totalScore,
        positiveScore: positiveScore,
        negativeScore: negativeScore,
        positiveTweetCount: positiveTweetCount,
        negativeTweetCount: negativeTweetCount,
        neutralCount: neutralCount,
        maxTweets:maxTweets
      };
      
      // console.log(data) -> will print the whole tweet json with all attributes.
    }
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

    wikiText = htmlToText.fromString(htmlWikiText, {
         wordwrap: 130, //no. of words in a line
         ignoreHref: true // ignore links
    });

    // console.log(wikiText);
    });
    
    
    // console.log("#########continuous more tweets######");
    // var count = 0;
    // var stream = T.stream('statuses/filter', { track: searchString, language: 'en' });
    // stream.on('tweet', function (tweet) {
    //   console.log(tweet.text);
    //   count++;
    //   if(count == 10){
    //     stream.destroy();
    //   }
    // });
    
    
    res.redirect("/show");
});



app.get("/show", function(req, res){
    console.log(scoreData);
    console.log("<<<<<<<<<<<<<<<<");
    scoreData.wikiText = wikiText;
    console.log(wikiText);
    res.render("show", {scoreData:scoreData});
});


app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server Started!"); 
});

