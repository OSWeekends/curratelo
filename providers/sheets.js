var https = require('https'),
    firebase = require('firebase');

function ProviderSheets(custom){
    this.id = custom.id;
    this.provider_db = custom.provider_db;
    this.url = "https://spreadsheets.google.com/feeds/list/" + this.id + "/od6/public/values?alt=json";
    this.outstanding = custom.outstanding || false;
    this.router = custom.router || false;
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
                    var pubdate = new Date (data[i].gsx$pubdate.$t);
                    var offerDetail = {
                            contract: false,
                            journey: false,
                            salary: false,
                            place: false,
                            company: false,
                            description: data[i].gsx$description.$t.textCleaner() || false,
                            provider_logo: "",
                            title: data[i].gsx$title.$t || false,
                            pubdate: data[i].gsx$pubdate.$t || false,
                            provider: data[i].gsx$provider.$t || "la red de redes",
                            outstanding: true
                        };
                    if (_self.router) {
                        offerDetail.contract = data[i].gsx$contract.$t || false;
                        offerDetail.journey = data[i].gsx$journey.$t || false;
                        offerDetail.salary = data[i].gsx$salary.$t || false;
                        offerDetail.place = data[i].gsx$place.$t || false;
                        offerDetail.company = data[i].gsx$company.$t || false;
                        offerDetail.id = data[i].gsx$id.$t;
                        offerDetail.required = data[i].gsx$required.$t || false;
                        offerDetail.optional = data[i].gsx$optional.$t || false;
                        offerDetail.offer = data[i].gsx$offer.$t || false;
                        offerDetail.company_logo = data[i].gsx$logo.$t.trim() || false;
                        offerDetail.company_url = data[i].gsx$url.$t.trim() || false;
                        offerDetail.link = "job/" + data[i].gsx$id.$t;
                    } else {
                        offerDetail.link = data[i].gsx$link.$t || false;
                    }
                    
                    if(pubdate.isIn15Days()){
                        keyData.push(offerDetail);                
                    }
                }
                
                var ref = firebase.database().ref('data/'+_self.provider_db+'/');
                    
                ref.set(keyData, function(error){
                  if (error) {
                      console.warn('[FIREBASE] ERROR - Sincronización fallida con', _self.provider_db);
                  }
                });
                
            });
        }).on('error', function(e){
              console.log("[DOWNLOAD]: ERROR con "+_self.provider_db, e);
        });
    };
}

module.exports = ProviderSheets;