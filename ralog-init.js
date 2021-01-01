var logger = require('./logger');
var ralog = require('./ralog-db');
var transfer_year = require('./ralog-transfer-year.js');
var create_design = require('./ralog-create-design.js');


function initDB(dbname) {	
	var db = ralog.use( dbname );

	db.info(function(err, body) {
	    if (!err) {
	        logger.info(`Databse used: [${dbname}]`);
	    } else if (err.error === 'not_found') {
	        db = ralog.db.create(dbname, function(err, body) {
	            if (err) {
	                logger.error(`${err.error}: ${err.reason}`)
	            } else {
	                logger.info(`Database created [${dbname}]`)
	                var year = (new Date()).getFullYear();
	                transfer_year(year);
	                create_design(dbname);
	            }
	        })
	    } else if (err.error) {
	        logger.error(err.error);
	    } else if (err) {
	        logger.error(err);
	    }
	});

	return db;
}

if (require.main === module) {
    var dbName = process.argv[2];
    initDB(dbName);
} else {
    module.exports = initDB;
}