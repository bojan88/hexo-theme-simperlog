'use strict';

var fs = require('fs');
var path = require('path');
var CleanCss, purify;

var cssFiles = {};
var publicDir;

hexo.extend.console.register('inline-css', 'Replace CSS tags with file content', function(args) {
  publicDir = this.public_dir;
  try {
    CleanCss = require('clean-css');
    purify = require('purify-css');
  } catch(e) {
    console.log(`\nError: ${e.message}\n`);
    return;
  }

  hexo.call('generate', function() {
    console.log('Inlining CSS');
    replaceInDir(publicDir);
  });
});

function replaceInDir(dir) {
  fs.readdir(dir, function(err, files) {
    if(err) throw err;

    files.forEach(function(file) {
      var fullFilePath = path.join(dir, file);
      if(file.endsWith('.html')) {
        readFile(fullFilePath)
          .then(html => replace(html))
          .then(html => {
            return writeFile(fullFilePath, html);
          }).catch(err => {
            console.error(err);
          });
      } else {
        fs.stat(fullFilePath, function(err, stat) {
          if(err) throw err;
          if(stat.isDirectory()) {
            replaceInDir(fullFilePath);
          }
        });
      }
    });
  });
}

function readFile(filePath) {
  return new Promise(resolve => {
    fs.readFile(filePath, function(err, data) {
      if(err) throw err;
      resolve(data.toString());
    });
  });
}

function writeFile(filePath, data) {
  return new Promise(resolve => {
    fs.writeFile(filePath, data, function(err) {
      if(err) throw err;
      resolve();
    });
  })
}

function replace(html) {
  return new Promise(resolve => {
    var gen = replaceGenerator(html);
    (function step(val) {
      var res = gen.next(val);
      if(res.done) {
        return resolve(res.value);
      }
      res.value.then(step);
    })();
  });
}


function* replaceGenerator(html) {
  var match;
  var cssLinkPatt = /<link.+?href=["|'](.+?\.css)["|']>/g;
  while(match = cssLinkPatt.exec(html)) {
    if(cssFiles[match[1]]) {
      yield Promise.resolve(cssFiles[match[1]]).then(htmlReplace).catch(console.error);
    } else {
      yield readFile(path.join(publicDir, match[1])).then(css => {
        cssFiles[match[1]] = css;
        htmlReplace(css);
      }).catch(console.error);
    }
  }

  function htmlReplace(css) {
    var purified = purify(html, css);
    var minified = new CleanCss().minify(purified).styles;
    html = html.replace(match[0], `
      <style type="text/css">
        ${minified}
      </style>`);
  }
  return html;
}
