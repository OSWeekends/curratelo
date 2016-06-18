var https = require('https'),
    fs = require('fs'),
    firebase = require('firebase');

function ProviderSheets(custom){
	this.id = custom.id;
	this.provider_db = custom.provider_db;
	this.url = "https://spreadsheets.google.com/feeds/list/" + this.id + "/od6/public/values?alt=json";
	this.outstanding = custom.outstanding || false;
	var _self = this;
  	this.uploadJobs = function (){
  		https.get(_self.url, function(res){
            var body = '';
        
            res.on('data', function(chunk){
                body += chunk;
            });
        
            res.on('end', function(){
                var data = JSON.parse(body);
                data = data.feed.entry;

                var keyData = [];
    
                for (var i = 0; i < data.length; i++) {

                        keyData.push({
                            contract: false,
                            journey: false,
                            salary: false,
                           	place: false,
                            company: false,
                            description: data[i]["gsx$description"].$t.textCleaner() || false,
                            provider_logo: "",
                            title: data[i]["gsx$title"].$t || false,
                            pubdate: data[i]["gsx$pubdate"].$t || false,
                            link: data[i]["gsx$link"].$t || false,
                            provider: data[i]["gsx$provider"].$t || "la red de redes",
                            outstanding: false
                        });                

                }
                
                var ref = firebase.database().ref('data/'+_self.provider_db+'/');
                    
                ref.set(keyData), function(error){
        		    if (error) {
        		        console.warn('[FIREBASE] ERROR - SYNC ERROR with', _self.provider_db);
        		    }
                };
                
                
            });
        }).on('error', function(e){
              console.log("[DOWNLOAD]: ERROR with "+_self.provider_db, e);
        });
  	}
}

module.exports = ProviderSheets;