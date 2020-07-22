
var _ = require('underscore'),
    db = require('./ralog-db'),
    logger = require('./logger');


function transfer_year(year) 
{
    var last_year = year - 1;
    var ldb = db.use(`ralog-sma-data-${last_year}`);
    var cdb = db.use(`ralog-sma-data-${year}`);

    function insert_year_data(doc) {
        cdb.insert(doc, function(err, body) {
            if(err) {
                logger.error(err);
                return;
            }

            logger.info(`Transferred [${body.id}] from ralog-sma-data-${last_year} to ralog-sma-data-${year}`);
        });
    }

    ldb.view('MeanPublic', 'e_total', {
        group: true
    }, function(err, body) {
        if(err) {
            logger.error(err);
            return;
        }

        //console.dir(body, {depth: 3, colors: true});

        var byYear = _.groupBy(body.rows, function(row) {return row.key[0]})

        _.forEach(byYear, function(data, value) {
            var doc = {
                _id: 'e_total-hist-' + value,
                type: 'e_total-hist',
                data: data
            };

            logger.info(`${value}: ${data.length} rows`);

            cdb.get(doc._id, function(err, body) {
                if (err) { // not_found
                    insert_year_data(doc)
                } else {
                    cdb.destroy(doc._id, body._rev, function(err, body) {
                        if(err) {
                            logger.error(err);
                            return;
                        }

                        logger.info(`Dropped '${doc._id}'`);

                        insert_year_data(doc);
                    })
                }
            });


        });
    });

}


if (require.main === module) {
    var year = process.argv[2];
    transfer_year(year);
} else {
    module.exports = transfer_year;
}