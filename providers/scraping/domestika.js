var Xray = require('x-ray'),
    fs = require('fs'),
    firebase = require('firebase');
var x = Xray({
  filters: {
    trim: function (value) {
      return typeof value === 'string' ? value.trim() : value;
    }
  }
});

var domestika = {
    uploadJobs: function(){
        x('http://www.domestika.org/es/jobs?area=7&date=this_week', 'li.job-item', [{
            title: 'a.job-title | trim',
            source_url: 'a.job-title@href | trim',
            company: 'h3.job-item__company | trim'
        }]).write('temp/domestika_desarrollo_software.json');
        
        x('http://www.domestika.org/es/jobs?area=57&date=this_week', 'li.job-item', [{
            title: 'a.job-title | trim',
            source_url: 'a.job-title@href | trim',
            company: 'h3.job-item__company | trim'
        }]).write('temp/domestika_desarrollo_web.json');
        
        
        
        var ofertasTotal = [];
        setTimeout(function() {            
            var desarrolloWeb = fs.readFileSync('temp/domestika_desarrollo_web.json', 'utf8');
            desarrolloWeb = JSON.parse(desarrolloWeb);
            var desarrolloSoftware = fs.readFileSync('temp/domestika_desarrollo_software.json', 'utf8');
            desarrolloSoftware = JSON.parse(desarrolloSoftware);
            
            for (var i = 0; i < desarrolloWeb.length; i++) {
              
              ofertasTotal.push(desarrolloWeb[i]);
              for (var j = 0; j < desarrolloSoftware.length; j++) {
                 if(desarrolloSoftware[j].source_url === desarrolloWeb[i].source_url){
                    desarrolloSoftware[j].duplicated = true;
                 }
              }      
            }
            
            for (var j = 0; j < desarrolloSoftware.length; j++) {
                 if(!desarrolloSoftware[j].duplicated){
                    ofertasTotal.push(desarrolloSoftware[j]);
                 }
            }
            
            fs.writeFileSync("temp/domestika_ofertas.json", JSON.stringify(ofertasTotal , null, 4));
            
        }, 15000);
        
        
        
        
        var ofertasDefinitvo = [];
        setTimeout(function() {          
          for (var i = 0; i < ofertasTotal.length; i++) {
        
            x(ofertasTotal[i].source_url, {
              title: 'title | trim',
              place: '#main-content > div.container.single-job > div:nth-child(1) > div.col-sm-9 > div.paper > header > p > span | trim',
              description: '#main-content > div.container.single-job > div:nth-child(1) > div.col-sm-9 > div.paper > article > div:nth-child(1) > div | trim',
              pubdate: '#main-content > div.container.single-job > div:nth-child(1) > div.col-sm-9 > div.paper > header > div.metadata.clearfix > p > span@content | trim',
              company_logo: '#main-content > div.container.single-job > div:nth-child(1) > div.col-sm-9 > div.paper > header > img@src | trim',
              company_url: '#main-content > div.container.single-job > div:nth-child(1) > div.col-sm-9 > div.paper > header > h2 > small > a@href | trim',
              company: '#main-content > div.container.single-job > div:nth-child(1) > div.col-sm-9 > div.paper > header > h2 > span | trim',
              contract: '#main-content > div.container.single-job > div:nth-child(1) > div.col-sm-9 > div.paper > header > div.circle-label.circle-label--full_time | trim',
            })(function(err, data){
                var temp = data.title.split(' - ');
                data.title = temp[0];
                data.title = data.title.trim();
        
                for (var i = 0; i < ofertasTotal.length; i++) {
                    if(ofertasTotal[i].title === data.title && ofertasTotal[i].company === data.company){
                      // Unificación
                        ofertasTotal[i].place = data.place.textCleaner() || false;
                        ofertasTotal[i].pubdate = data.pubdate.textCleaner() || false;
                        ofertasTotal[i].company = data.company.textCleaner() || false;
                        ofertasTotal[i].description = data.description.textCleaner() || false;
                        ofertasTotal[i].company_logo = data.company_logo.textCleaner() || false;
                        ofertasTotal[i].company_url = data.company_url.textCleaner() || false;
                        ofertasTotal[i].contract = data.contract.textCleaner() || false;
                        ofertasTotal[i].link = ofertasTotal[i].source_url;
                      // Valores por defecto!
                        ofertasTotal[i].salary = false;
                        ofertasTotal[i].outstanding = false;
                        ofertasTotal[i].provider_logo = "img/domestika_jobs.png";
                        ofertasTotal[i].provider = "Domestika Empleos";
                      if(ofertasTotal[i].pubdate){
                        var testDate = new Date(ofertasTotal[i].pubdate);
                        if(testDate.isIn2Days()){
                          ofertasTotal[i].pubdate = testDate.toISOString();
                          ofertasDefinitvo.push(ofertasTotal[i]);
                        } 
                      }
                        
                    }
                }
            });
          }
          
        }, 35000);
        
        setTimeout(function() {
          var ref = firebase.database().ref('data/domestika/');
            ref.set(ofertasDefinitvo, function(error){
          if (error) {
              console.warn('[FIREBASE] ERROR - Sincronización fallida con DOMESTIKA!');
          }
        });
          fs.writeFileSync("temp/domestika.json", JSON.stringify(ofertasDefinitvo , null, 4));
        }, 60000);

    } 
};

module.exports = domestika;