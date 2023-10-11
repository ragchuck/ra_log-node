

if (process.argv.length < 4) {
        console.log('Missing argument');
        console.log(process.argv);
        return 1;
}

var initialize = require('./ralog-init.js')

var fs = require('fs'),
    path = require('path'),
    shell = require('shelljs'),
    xml2js = require('xml2js'),
    _ = require('underscore');


var xml2js_opt = {
    explicitArray: false, 
    valueProcessors: [ xml2js.processors.parseNumbers ]
};

var dbname = process.argv[2]; //'ralog-sma-data-2015';// + (new Date()).getFullYear()
var db = initialize( dbname );

var p = 0, 
    packages = process.argv.slice(3),
    pMax = packages.length;

while(packageName = packages.shift()) {

    if (!fs.existsSync(packageName)) {
        console.error(`File [${packageName}] not found!`);
        continue;
    }

    p++;

    var _basename = path.basename(packageName, '.zip'),
            _tempDir = path.dirname(packageName) + '/temp/' + _basename;

    var package = {
        name: packageName,
        basename: _basename,
        tempDir: _tempDir,
        index: p
    };

    if (fs.existsSync(_tempDir)) {
            shell.rm('-rf', _tempDir);
    }

    fs.mkdirSync(_tempDir + '/out', {recursive: true});


    console.info(`[${_basename}]: Unzipping ${p}/${pMax}: [${packageName}]`)
    shell.exec(`unzip ${packageName} -d ${_tempDir}`, {silent:true});

    fs.readdir(_tempDir, function(err, files) { 

        var f = 0, bulkData = [];

        while(file = files.shift()) {
            if (file.substr(-3) !== 'zip') 
                continue;

            f++;

            var xmlData = shell.exec(`unzip -p ${this.tempDir}/${file}`, {silent:true}).stdout;
            xml2js.parseString(xmlData, xml2js_opt, function (err, result) {
                if (err) {
                    console.error(`[${this.basename}/${file}]: Failed to parse [${file}] with error:`, err);
                    return;
                }

                if (!result) {
                    console.error(`[${this.basename}/${file}]: Result is invalid`);
                    console.error('xmlData', xmlData);
                    return;
                }

                var data = result;

                delete data.WebBox.$;
                data._id = file;
                data.creationTime = (new Date()).toJSON();
                data.type = data.WebBox.MeanPublic ? 'MeanPublic' : 'Event';

                bulkData.push(data);
            }.bind(this));
        };

        console.info(`[${this.basename}]: Parsed ${f} files`);

        db.bulk({docs:bulkData}, function(err, body) {
            if (!err) {
                var result = _.countBy(body, function(row) {return row.error || 'success'});
                console.info(`[${this.basename}]: Import result:`, result);
            } else {
                console.error(`[${this.basename}]: ${err}`, err);
            }

        }.bind(this));

        // cleanup
        var date = new Date();
        var dataArchive = '~/ra-log/data/' + date.getFullYear() + '/' + ("0" + (date.getMonth() + 1)).slice(-2) + '/';
        shell.mkdir('-p', dataArchive)
        shell.mv(this.name, dataArchive);
        shell.rm('-rf', this.tempDir);

    }.bind(package));
}