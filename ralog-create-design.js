var logger = require('./logger');
var ralog = require('./ralog-db');
var designDoc = {
   "language": "javascript",
   "views": {
       "by_key_and_time": {
           "map": "function(doc) {\n  if(doc.type == 'MeanPublic') {\n    doc.WebBox.MeanPublic.forEach(function(r) {\n      emit([r.Key,r.TimeStamp], r.Mean);\n    })\n  }\n}"
       },
       "e_total": {
           "map": "function(doc) {\n  if(doc.type === 'MeanPublic') {\n    doc.WebBox.MeanPublic.forEach(function(r) {\n      if (r.Key.substr(-7) === 'E-Total') {\n        emit(r.TimeStamp.substr(0,10).split('-'), r.Last);\n      }\n    })\n  }\n  if(doc.type === 'e_total-hist') {\n    doc.data.forEach(function(d) {\n      emit(d.key, d.value.min);\n      emit(d.key, d.value.max);\n    })\n  }\n}",
           "reduce": "_stats"
       },
       "e_total_agg": {
           "map": "function(doc) {\n  if(doc.type === 'e_total-hist') {\n    doc.data.forEach(function(d) {\n      emit([d.key[1],d.key[2]], d.value.max - d.value.min);\n    })\n  }\n}",
           "reduce": "_stats"
       },
       "by_time": {
           "map": "function(doc) {\n  if(doc.type == 'MeanPublic') {    \n    emit(doc.WebBox.MeanPublic[0].TimeStamp, null);\n  }\n}"
       }
   }
};


function create_designDocument(dbName) {
    var db = ralog.use(dbName);

    db.insert(designDoc, '_design/MeanPublic', function(err, body) {
        if (err)
           logger.error(`${err.error}: ${err.reason}`)
        else
           logger.info('Document created: _design/MeanPublic')
    })
}



if (require.main === module) {
    var dbName = process.argv[2];
    create_designDocument(year);
} else {
    module.exports = create_designDocument;
}