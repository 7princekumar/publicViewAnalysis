/*global CanvasJS*/
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var sentiment = require('sentiment');
const fetch = require('node-fetch');
const request = require('request');

var twitterData = {};
var wikiData = {};
var rr_LocalData = {};
var rn_LocalData = {};
var redditData = {};

var rr_PostsArray = [];
var rn_PostsArray = [];
var tweetsArray = [];
var g_ActivitiesArray = [];

var wikiText = '';
var googleData = {};


//Pusher config
const Pusher = require('pusher');
var pusher = new Pusher({
  appId:    process.env.APP_ID,
  key:      process.env.KEY,
  secret:   process.env.SECRET,
  cluster:  'ap2',
  encrypted: true
});
if(process.env.APP_ID && process.env.KEY && process.env.SECRET){
  console.log("All Pusher Keys present.");
} else {
 console.log("Pusher Keys missing.");
}
if(process.env.GOOGLE_KEY){
  console.log("Google Key is present.");
} else {
  console.log("Google Key is missing.");
}



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
      tweetsArray = tweets;
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
      
      twitterData = {
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
    
    
    //CONTINUOUS MORE TWEETS////////////////
    var count = 0;
    var stream = T.stream('statuses/filter', { track: searchString, language: 'en' });
    
    stream.on('tweet', function (tweet) {
      //calculate score for this tweet
      var r5 = sentiment(tweet.text);
      
      
      //when new tweet is fetched, trigger the pusher
      pusher.trigger('my-channel', 'my-event', {
        "message": "hello world",
        "tweet": tweet,
        "score": r5.score
      });
      
      console.log("----------------------------");
      console.log('RTT['+count+']: '+tweet.text);
      count++;
      // if(count == 10){
      //   stream.destroy();
      // }
    });
    
    // // Disconnect stream after num_of_secs seconds 
    // var num_of_secs = 20;
    // setTimeout(stream.destroy, num_of_secs *1000);
    ////////////////////////////////////////////
    
    
    
    //REDDIT--------------------------------------------------------
    //for relevence
    var rr_positiveScore = 0;
    var rr_negativeScore = 0;
    var rr_positivePostCount = 0;
    var rr_negativePostCount = 0;
    var rr_neutralPostCount = 0;
    var rr_totalScore = 0;
    //for new
    var rn_positiveScore = 0;
    var rn_negativeScore = 0;
    var rn_positivePostCount = 0;
    var rn_negativePostCount = 0;
    var rn_neutralPostCount = 0;
    var rn_totalScore = 0;
    
    var r_maxPosts = 5; //100 max
    
    var reddit = {
      search: function(searchTerm, r_maxPosts, sortBy) {
        return fetch(
          `http://www.reddit.com/search.json?q=${searchTerm}&sort=${sortBy}&limit=${r_maxPosts}`
        )
          .then(res => res.json())
          .then(data => {
            return data.data.children.map(data => data.data);
          })
          .catch(err => console.log(err));
      }
    };
    
    //RR
    var sortBy = 'relevence';
    reddit.search(searchString, r_maxPosts, sortBy).then(results => {
      // redditData.relevenceResults = results;
      for(var i=0; i<results.length; i++){
        console.log("--------RELEVENCE---------");
        
        var r2 = sentiment(results[i].title);
        if(r2.score === 0){
            rr_neutralPostCount++;
        } else if(r2.score > 0) {
            rr_positivePostCount++;
            rr_positiveScore += r2.score;
        } else {
            rr_negativePostCount++;
            rr_negativeScore += r2.score;
        }
        rr_totalScore += r2.score;
        
        var post = {
          title: results[i].title,
          redditScore: results[i].score,
          sentimentScore: r2.score
        };
        rr_PostsArray.push(post);
        
        console.log("Post["+i+"]: Reddit Score: "+results[i].score);
        console.log("Title: "+results[i].title);
        // console.log("Self Text: "+results[i].selftext);
        // console.log("Subreddit: "+results[i].subreddit);
        
        
        rr_LocalData = {
          totalScore:        rr_totalScore,
          positiveScore:     rr_positiveScore,
          negativeScore:     rr_negativeScore,
          positivePostCount: rr_positivePostCount,
          negativePostCount: rr_negativePostCount,
          neutralPostCount:  rr_neutralPostCount,
          maxPosts:          r_maxPosts
        };
      
      }
    });
    
    //RN
    var sortBy = 'new';
    reddit.search(searchString, r_maxPosts, sortBy).then(results => {
      // redditData.newResults = results;
      for(var i=0; i<results.length; i++){
        console.log("--------NEW---------");
        
        var r3 = sentiment(results[i].title);
        if(r3.score === 0){
            rn_neutralPostCount++;
        } else if(r3.score > 0) {
            rn_positivePostCount++;
            rn_positiveScore += r3.score;
        } else {
            rn_negativePostCount++;
            rn_negativeScore += r3.score;
        }
        rn_totalScore += r3.score;
        
        var post = {
          title: results[i].title,
          redditScore: results[i].score,
          sentimentScore: r3.score
        };
        rn_PostsArray.push(post);
        
        console.log("Post["+i+"]: Reddit Score: "+results[i].score);
        console.log("Title: "+results[i].title);
        // console.log("Self Text: "+results[i].selftext);
        //console.log("Subreddit: "+results[i].subreddit);
        
        
        rn_LocalData = {
          totalScore:        rn_totalScore,
          positiveScore:     rn_positiveScore,
          negativeScore:     rn_negativeScore,
          positivePostCount: rn_positivePostCount,
          negativePostCount: rn_negativePostCount,
          neutralPostCount:  rn_neutralPostCount,
          maxPosts:          r_maxPosts
        };
        
      }
    });  //reddit search
    
    
    
    //GOOGLE PLUS
    var g_positiveScore = 0;
    var g_negativeScore = 0;
    var g_positiveActivityCount = 0;
    var g_negativeActivityCount = 0;
    var g_neutralActivityCount = 0;
    var g_totalScore = 0;
    var g_maxActivities = 20; //20 is max.
    var g_ActivitiesCount = 0;
    
    request({
      url: `https://www.googleapis.com/plus/v1/activities?query=${searchString}&maxResults=${g_maxActivities}&key=${process.env.GOOGLE_KEY}`,
      json: true
    },function(err, res, body){
        if(err){
          console.log("Error in fetching Google Plus Activies!");
        }else{
          console.log("+++++++++GOOGLE Plus Activies++++++++++");  
          for(var i=0; i<body.items.length; i++){
            console.log("*****************ACTIVITY CONTENT***********");
            
            var acitivityContent = body.items[i].title + body.items[i].object.content;
            var r4 = sentiment(acitivityContent);
            if(r4.score === 0){
                g_neutralActivityCount++;
            } else if(r4.score > 0) {
                g_positiveActivityCount++;
                g_positiveScore += r4.score;
            } else {
                g_negativeActivityCount++;
                g_negativeScore += r4.score;
            }
            g_totalScore += r4.score;
            
            var activity = {
              title: body.items[i].title,
              content: body.items[i].object.content,
              sentimentScore: r4.score
            };
            
            if( (body.items[i].title.length > 0) && (acitivityContent.length > 0)){
              g_ActivitiesCount++;
              g_ActivitiesArray.push(activity);
              console.log("Activity["+i+"]: Sentiment Score: "+r4.score);
              console.log("Title: "+body.items[i].title);
              console.log("ActivityCount: "+g_ActivitiesCount);
            }
            // console.log("Content: "+body.items[i].object.content);
            
            
            googleData = {
              totalScore:            g_totalScore,
              positiveScore:         g_positiveScore,
              negativeScore:         g_negativeScore,
              positiveActivityCount: g_positiveActivityCount,
              negativeActivityCount: g_negativeActivityCount,
              neutralActivityCount:  g_neutralActivityCount,
              maxActivities:         g_ActivitiesCount
            };
          
          }
      }
    });
    
   
    
    res.redirect("/show");
});



app.get("/show", function(req, res){
    wikiData.wikiText = wikiText;
    twitterData.tweetsArray = tweetsArray;
    googleData.activitiesArray = g_ActivitiesArray;
    redditData = {
      totalScore:        rr_LocalData.totalScore +        rn_LocalData.totalScore,
      positiveScore:     rr_LocalData.positiveScore +     rn_LocalData.positiveScore ,
      negativeScore:     rr_LocalData.negativeScore +     rn_LocalData.negativeScore,
      positivePostCount: rr_LocalData.positivePostCount + rn_LocalData.positivePostCount,
      negativePostCount: rr_LocalData.negativePostCount + rn_LocalData.negativePostCount,
      neutralPostCount:  rr_LocalData.neutralPostCount +  rn_LocalData.neutralPostCount,
      maxPosts:          rr_LocalData.maxPosts,
      rr_PostsArray:     rr_PostsArray,
      rn_PostsArray:     rn_PostsArray
    };
    
    res.render("show", {
      twitterData: twitterData, 
      wikiData:    wikiData, 
      redditData:  redditData,
      googleData:  googleData
    });
});


app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server Started!"); 
});

