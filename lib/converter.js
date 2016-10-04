var stylus = require('stylus'),
    nodes = stylus.nodes,
    utils = stylus.utils;


var plugin = function() {
    return function(s) {
        var DEFAULTS = {
          'px': 16,
          '%': 100,
          'em': 1,
          'pt': 12,
          'rem': 1,
        };
        var LOCAL_FACTORS = {};

        function lookupGlobal(varName) {
          return s.evaluator.global.lookup(varName)
        }

        function lookupLocal(varName) {
          var i = s.evaluator.stack.length;
          while (i-- && !node) {
            var node = s.evaluator.stack[i].lookup(varName);
          }
          return node;
        }

        function getNodeAt(input, index) {
          return input && input.nodes && input.nodes[index];
        }

        function isConvertible(input) {
          return input &&
                 input.nodeName &&
                 input.nodeName === 'unit' &&
                 DEFAULTS[input.type];
        }

        function normalizeUnit(unit) {
          return unit.val / DEFAULTS[unit.type];
        }

        function updateLocalFactors() {
          var rootFontFize = getNodeAt(lookupGlobal('root-font-size'), 0);
          var emContext = getNodeAt(lookupLocal('em-context'), 0);

          LOCAL_FACTORS['rem'] = isConvertible(rootFontFize) ? normalizeUnit(rootFontFize) : 1;
          LOCAL_FACTORS['em'] = isConvertible(emContext) ? normalizeUnit(emContext) : LOCAL_FACTORS['rem'];
          LOCAL_FACTORS['%'] = LOCAL_FACTORS['em'];
        }

        function getFactor(type) {
          return DEFAULTS[type] / (LOCAL_FACTORS[type] || 1);
        }

        function convert(value, from, to) {
          return value * getFactor(to) / getFactor(from);
        }

        function convertUnit(unit, to) {
          if (isConvertible(unit) && unit.type != to) {
            unit = new nodes.Unit(convert(unit.val, unit.type, to), to);
          }
          return unit;
        }

        function converter(input, to) {
          updateLocalFactors();

          var output = new nodes.Expression();
          var values = utils.unwrap(input).nodes;

          for (var i = 0; i < values.length; i++) {
            output.push(convertUnit(values[i], to));
          }
          return output;
        }

        function AbstractedConverter(type) {
          var output = function (values) {
            return converter(values, type);
          }
          output.raw = true;
          return output
        }

        s.define('px', AbstractedConverter('px'));
        s.define('pt', AbstractedConverter('pt'));
        s.define('em', AbstractedConverter('em'));
        s.define('rem', AbstractedConverter('rem'));
        s.define('percent', AbstractedConverter('%'));
    };
};
module.exports = plugin;
// https://github.com/stylus/stylus/blob/dev/lib/functions/add-property.js
