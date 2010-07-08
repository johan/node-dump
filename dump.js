exports.dump = function dump(what, seen) {
  function h(text) { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function link(url, name) { // makes abs urls abs urls -- rest: in-page #url:s
    if (arguments.length != 2) { name = url; }
    url = /^https?:/i.test(url) ? url : '#'+ url;
    return '<a href="'+ h(url) +'">'+ h(name) +'</a>';
  }
  function linkUrls(html) {
    return html.replace(/\b(https?:\/\/\S+)/gi, link);
  }
  function isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  }
  function objectType(o) {
    if ('object' !== typeof o || null === o) return '';
    var type = o && o.constructor;
    return Object === type || Array === type ? '' : type.name || '(?)';
  }

  var out = seen ? '' :
    '<script>function toggle(x, e) {\n'+
    '  x = document.getElementById("fn_"+ x);\n' +
    '  x.className = x.className ? "" : "hide";\n  e.preventDefault();'+
    '}</script><style type="text/css">\n' +
    'a { text-decoration: none; }\n' +
    '.hide span { display: none; }\n' +
    'code      > i { display: none; }\n' + // function line count
    'code.hide > i { display: inline; }\n' +
    '.hide i:before { content: " /* "; }\n' +
    '.hide i:after { content: " line */ "; }\n' +
    '.hide i.plural:after { content: " lines */ "; }\n' +
    'table.dump {\n' +
    '  border-collapse: collapse;\n' +
    '  font-family: Arial,Helvetica,Sans-Serif;\n' +
    '  background: #ffffff;\n' +
    '  font-size: 10pt;\n' +
    '}\n' +
    'table.dump td, table.dump th {\n' +
    '  border:         1px solid black;\n' +
    '  padding:        2px;\n' +
    '  text-align:     left;\n' +
    '  white-space:    pre-wrap;\n' +
    '  vertical-align: top;\n' +
    '}\n' +
    'th[colspan]:before { content: "Object <"; }\n' +
    'th[colspan]:after  { content: ">:"; }\n' +
    'th[colspan]    { background: #FAA; }\n' +
    'th.dump.hash   { background: #AFA }\n' +
    'th.dump.array  { background: #AAF }\n' +
    'th.dump.object { background: #FAA }\n' +
    'td.dump.recur  { background: #FCC }\n' +
    'th.dump > a    { color: inherit; }\n' +
    '' +
    '</style>\n';

  switch (typeof what) {
    case 'number': // int, float, NaN, Infinity or -Infinity
    case 'boolean':
    case 'undefined':
      out += '<i>'+ what +'</i>';
      break;

    case 'function':
      var source = what.toString();
      var indent = /([\t ]*)\}\s*$/.exec(source) || '';
      if (indent) indent = indent[1];
      source = h(source).replace(/\n/g, '<br>');
      var match = /^(\s*)(function ?[^(]*)([^{]*\{)(.*)\}\s*$/.exec(source);
      var first = match[1], fn = match[2], args = match[3], body = match[4];
      var id = seen ? seen.name : 'this';
      var lines = Math.max(0, body.match(/<br>/g).length - 1);
      lines = '<i class="'+ (lines == 1 ? '' : 'plural') +'">'+ lines +'</i>';
      out += '<code id="fn_'+ h(id) +'" class="hide"><span>'+ indent +'</span>'+
               '<a onclick=toggle("'+ h(id) +'",event) href="#">'+ fn +'</a>'+
                args + lines +'<span>'+ body +'</span>}</code>';
      break;

    case 'string':
      if (!what.length) {
        out += '<i>empty string</i>&nbsp;';
      } else {
        if (!seen)
          out += '<table class="dump"><tr><td>'+ linkUrls(what) +
            '</td></tr></table>';
        else
          out += linkUrls(what);
      }
      break;

    case 'object':
      if (null === what) {
        out += '<i>null</i>&nbsp;';
      } else if (0 === what.length && isArray(what)) {
        out += '<i>empty array</i>&nbsp;';
      } else {
        var val, name = objectType(what);
        var className = name ? 'object' : isArray(what) ? 'array' : 'hash';

        var obj = '', width = '', parent, kid;
        if (seen) {
          width = ' width="100%"';
          seen.objects.push(what);
        } else {
          seen = { name: 'this', names: [], objects: [what] };
        }
        seen.names.push(parent = seen.name);

        for (var key in what) {
          if (!what.hasOwnProperty(key)) continue;

          val = what[key];
          kid = parent +'.'+ key;
          try {
            seen.objects.forEach(function revisiting(o, n) {
              if (o === val && n != (seen.objects.length - 1)) throw n;
            });

            seen.name = kid; // the name of the val we pass below:
            /*jsl:ignore*/
            obj += '<tr>\n' +
                   '<th id="'+ h(kid) +'" class="dump '+ className +'">'+
                     link(kid, key) +'</th>\n'+
                   '<td class="dump "'+ width +'>'+ dump(val, seen) +'</td>\n'+
                   '</tr>';
            /*jsl:end*/
          } catch(n) { // it's a recursively defined structure; show recurrence:
            id = seen.names[n];
            /*jsl:ignore*/
            obj += '<tr>\n' +
                   '<th id="'+ h(kid) +'" class="dump '+ className +'">'+
                     link(kid, key) +'</th>\n'+
                   '<td class="dump recur"'+ width +'>#'+ link(id) +'</td>\n'+
                   '</tr>';
            /*jsl:end*/
          }
        }
        if (obj) {
          out += '<table class="dump"'+ width +'>'+
            (name ? '\n<tr><th colspan="2">'+ h(name) +'</th></tr>\n' : '') +
            obj + '</table>\n';
        } else {
          out += '<i>empty object</i>&nbsp;';
        }
      }
      break;
    default:
  }

  return out;
};
