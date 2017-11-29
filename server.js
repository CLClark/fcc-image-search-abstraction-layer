// server.js
// init project
var express = require('express');
var app = express();
var crypto = require("crypto");
var mongodb = require('mongodb');
var got = require('got');

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

//db connection
var MongoClient = mongodb.MongoClient;
var mUrl = process.env.COMPLETE; //for mongodb

app.use("/api/imagesearch/", function (request, response, next) {
   response.sendFile(__dirname + '/views/index.html');

	//isolate the query terms
	var spaceReplace = new RegExp(/(%20)+/,'g');
	var toSearch = request.path.slice(1).replace(spaceReplace, "+");
	
	//check for parameter
	var offset = request.query.offset;  
  
	//perform api lookup		
 	got(giveQString(toSearch), {json: true})
    .then( function (resp){
      console.log(resp.body.items);
      //do something with the resp.body.items array
    },
      function(resultMsg){}
    );		
	//mongodb	
	//next();
});

function giveQString(inputTerms){
	var queryString =
    "https://www.googleapis.com/customsearch/v1?" +
      "key=" +
      process.env.GCSEARCH +
      "&cx=" +
      process.env.CXIS +
      "&q=" +
      inputTerms +
    //"&start=0" +
    "&num=10" ;    
    //"&ie=utf8" +
    //"&safe=high" +
    //"&client=google-csbe" +
    //"&output=xml_no_dtd" +
    //"&cx="+
    //process.env.CXIS;     
  return queryString;
}

//call mongodb, serve the log as json response
app.use('/api/latest/imagesearch/', function(request, response, next){
  
  MongoClient.connect(mUrl, function (err, db) {      
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    }
    else {
      var docOut = 
      db.collection('image-search-log').findOne({
        //find one or find all
      },
      //callback on db response
      function (err,doc){
        if (err) {
          console.log('findOne() query error: ', err);
        }
        //doc found by query
        else if ( doc !== null ) {
          
          response.json( jfyer(
            doc.term, doc.when
          ));
          
        db.close();
        }
        //go to the next middleware
        else {
          next();
        }
      });//findOne callback
    }  
  });//mongo callback
});



/*
app.use("/new/", function (request, response, next) {

  //slice "/new/" from request url
  var reqIn = request.originalUrl.slice(5).toLowerCase();
  
  //check for url formatting
  if(reqIn.substring(0,4) !== "http" || reqIn.match(/[\S]+\.[\w]+/) == null){    
  
  //send an error-rific JSON obj
    response.json(({
      "error" : "URL Invalid"
    }));
  }
  else{
  //exit to next function
    next();
  }
});

app.use("/new/", function (request, response, next) {
  var reqIn = request.originalUrl.slice(5).toLowerCase();
  MongoClient.connect(url, function (err, db) {      
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    }
    else {
      var docOut = 
      db.collection('urlmap').findOne({
        old_url: reqIn
      },
      //callback on db response
      function (err,doc){
        if (err) {
          console.log('findOne() query error: ', err);
        }
        //doc found by query
        else if ( doc !== null ) {
          response.json( jfyer(
            doc.old_url, ("https://" + request.hostname + "/" + doc.new_url) 
          ));
        db.close();
        }
        //go to the next middleware
        else {
          next();
        }
      });//findOne callback
    }  
  });//mongo callback
});//app.use

app.use("/new/", function (request, response, next) {
  //generates 12 chars
  var id = crypto.randomBytes(6).toString('hex');    
  var docToPush = { old_url : request.originalUrl.slice(5) , new_url : id };
  //push the new redirect mapping to mongo
  MongoClient.connect(url, function (err, db) {
    if (err) { console.log('Unable to connect to the mongoDB server. Error:', err);
    }
    else {
      db.collection('urlmap').insertOne(docToPush, function(err, result){
        if (err) { console.log('insertOne() call returned an error:', err);
        }
        //send the new mapping
        else {            
          response.json(jfyer(
            docToPush.old_url, ("https://" + request.hostname + "/" + docToPush.new_url))
          );
        }
        db.close();
      });//insertOne callback
    }
  });//mongodb callback
});

app.use(function (request, response, next){
  var toFind = request.originalUrl.toLowerCase().slice(1);
  if(request.originalUrl !== "/" && request.originalUrl !== ""){
    MongoClient.connect(url, function (err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
      }
      else {
        db.collection('urlmap').findOne({
          new_url: toFind
        }, function (err, doc){
          db.close();
          if (err) {
            console.log('findOne() call returned an error:', err);
          }
          else if ( doc !== null ){
            //console.log("Found in mongoDB");        
            response.redirect(doc.old_url);
          }
          else {
            next();             
          }          
        });//findOne callback   
      }
    });//mongo callback
  }
  else {
    next();
  }
});
*/

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
