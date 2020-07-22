var logger = {
  _log:  function(type, args) { console.log.apply(null,[(new Date()).toJSON(),type].concat(Array.prototype.slice.call(args, 0))) },
  info:  function() { logger._log('INFO', arguments) },
  error: function() { logger._log('ERROR', arguments)}
};

module.exports = logger;