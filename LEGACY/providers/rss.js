var rsj = require('rsj'),
    firebase = require('firebase'),
    jsonsafeparse = require('json-safe-parse');

function ProviderRSS(custom){
	this.url = custom.url;
	this.provider_db = custom.provider_db;
	this.provider = custom.provider || false;
	this.provider_logo = custom.provider_logo || false;
	this.outstanding = custom.outstanding || false;
	var _self = this;
  	this.uploadJobs = function (){
		rsj.r2j(_self.url,function(json) { 
            
	        var data = false,
	            dataReady = [];
	        
	        try {
	        	    data = jsonsafeparse(json);
	            } catch(e){
	         	    console.log("["+_self.provider_db+"] - Error en parseo. ");
	        }

	        if(data){
	            data.map(function(x, i) {
	                var pubdate = new Date (data[i].pubdate);
	                if(pubdate.isIn2Days()){
	                    dataReady.push({
	                        contract: false,
	                        journey: false,
	                        salary: false,
	                       	place: false,
	                        company: false,
	                        description: data[i].description.textCleaner() || false,
	                        provider_logo: _self.provider_logo,
	                        title: data[i].title || false,
	                        pubdate: data[i].pubdate || false,
	                        link: data[i].link.replace('@href: ','').trim() || false,
	                        provider: _self.provider,
	                        outstanding: _self.outstanding
	                    });
	                }
	    
	            });
	            
	            var ref = firebase.database().ref('data/'+_self.provider_db+'/');
	                ref.set(dataReady, function(error){
	        			if (error) {
	        				console.warn('[FIREBASE] ERROR - Sincronización fallida con', _self.provider_db);
	        			}
	            });
	        }
			});
  	};
}

module.exports = ProviderRSS;