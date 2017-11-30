var got = require('got');

module.exports = function(options) {
  
  return function (request, response, next) {
    if(request.path.slice(1) == ""){    
      response.redirect("/");
    }   
    else{
      //isolate the query terms
      var toSearch = request.path.slice(1)
      console.log(toSearch);     

      //perform api lookup		
      got(giveQString(toSearch, request.query.offset), {json: true})      
        .then( function (resp){
        
          const itemArray = resp.body.items || [];        
          //format the resp.body.items object
          //return resp.body;
          return itemArray.map( o => ({
            url:        o.link,
            snippet:    o.snippet,
            thumbnail:  o.image.thumbnailLink,
            context:    o.image.contextLink
          }));

        }, function(failtPromise){
          console.error("onRejected called (I): " + failtPromise);
          //on err, exit to next route
          next(); 
        })
        .then( function(imageArray){

          //send the HTTP response
          return response.send(imageArray); //===========================================

        }, function(failtPromise2){
          console.error("onRejected called (II): " + failtPromise2);
          //on err, exit to next route
          next(); 
        });
    }  //else
  }//return

  //produce url to call API
  function giveQString(inputTerms, pagination){
    //check for parameter
    if ( (parseInt(pagination) > 1) && (parseInt(pagination) < 91)){    
      var checkedPag = pagination;
      return cb(checkedPag);
    }
    else {
      var checkedPag = '1';
      return cb(checkedPag);
    }

    function cb(cPag){
      var fields = "items(link,snippet,image/contextLink,image/thumbnailLink)";

      var queryString =
        "https://www.googleapis.com/customsearch/v1?" +
        "key=" +          
          process.env.GCSEARCH +
          
        "&cx=" +          
          process.env.CXIS +
          
        "&q=" +          
          inputTerms +
          
        "&searchType=image" +
        "&num=10" +
        "&fields=" +          
          fields + 
          
        "&start=" +          
          cPag;      
      
      return queryString;
      
    }
  }
}

  

