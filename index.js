var through = require('through');
var http = require('http');
var glog = require('glog')(__dirname + '/repo');
var ecstatic = require('ecstatic')(__dirname + '/static');
var fs = require('fs');
var trumpet = require('trumpet');
var hyperspace = require('hyperspace');


var server = http.createServer(function(req, res) {
  console.log('REQUEST BEGIN');
  var u = req.url.split('?')[0];
  // console.log(u);

  if (glog.test(req.url)) {
    glog(req, res);
  } else if (RegExp('^/$').test(u)) {
    res.setHeader("Content-Type", "text/html");

    // Stream trumpet stream of main blog page to response.
    var page_html = fs.createReadStream('./render/blog.html');
    var page_tr = trumpet();
    page_html.pipe(page_tr).pipe(res);

    // Create stream of full articles' HTML.
    var article_html = fs.readFileSync('./render/article.html');
    var hstream = hyperspace(article_html, function(post) {
      return {
        '.article_body': { _html: post.body },
        '.article_title': post.title,
        '.article_date': post.date
      };
    });
    var articles_html = glog.list()
        .pipe(glog.inline('html'))
        .pipe(hstream);

    // Stream the articles' HTML into the body of the page.
    var body = page_tr.select('body').createWriteStream();
    articles_html.pipe(body);
  } else {
    ecstatic(req, res);
  }
  console.log('REQUEST END');
}).listen(5000);

