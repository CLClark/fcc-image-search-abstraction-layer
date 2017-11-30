// server.js
// init project
var express = require('express');
var app = express();
var crypto = require("crypto");
var mongodb = require('mongodb');
var got = require('got');
var iSearcher = require('./image-searcher.js');

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

//db connection
var MongoClient = mongodb.MongoClient;
var mUrl = process.env.COMPLETE; //for mongodb
var colName = "termLog";

//middleware to update mongodb log
app.use('/api/imagesearch/', function (request, response, next) {
  if(request.path.slice(1) == ""){    
    response.redirect("/");
    next();
  }
  else{
    //isolate the query terms
    var spaceReplace = new RegExp(/(%20)+/,'g');
    var toSearch = request.path.slice(1).replace(spaceReplace, " ");
    var whenSearch = new Date();
    //build the log entry
    var qToPush = {
      term: toSearch,
      when: whenSearch
    };  
    //mongodb
    MongoClient.connect(mUrl, function (err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
        next(); //exit route
      }
      else {
        db.collection(colName).updateOne({
          searchType: 'image'
        },{//update
          $push: { queries: qToPush}
        },{//options        
          upsert: true
        }); //updateOne
        db.close(); //sync
        next(); //sync    
      }
    });//mongo callback
  }//empty check 'else'
});

//middleware to perform Google API call and Express response
app.use('/api/imagesearch/', iSearcher({
  //option1: '1', option2: '2' //arbitrary, unused options parameters
}));

//call mongodb, serve the log as json response
app.use('/api/latest/imagesearch/', function(request, response, next){
  
  var ObjectID = require('mongodb').ObjectID;
  var logId = new ObjectID("5a1fb80dcaa1f61c635becc0");
  
  MongoClient.connect(mUrl, function (err, db) {      
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    }
    else {
      //var docOut = 
      db.collection(colName).findOne({
        '_id': logId //find one, index to log
      },{//options
        fields:{          '_id': 0        } //hide the mongo _id
      },
      //callback on db response
      function (err,doc){
        if (err) {
          console.log('findOne() query error: ', err);
        }
        //doc found by query
        else if ( doc !== null ) {          
          response.send(doc);//.queries);          
        db.close();
        }
        //go to the next middleware
        else {
          console.log('log doc not found _id: ['+ logId +']');
          next();
        }
      });//findOne callback
    }  
  });//mongo callback
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


//simplify the response calls
function jfyer (longOne, shortOne){  
  var jOut = { "term": longOne, "when": shortOne};  
  var stringOut = JSON.stringify(jOut);   
  //return stringOut;
  return jOut;
}

// listen for requests
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
