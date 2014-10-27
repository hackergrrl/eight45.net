var through = require('through');
var http = require('http');
var glog = require('glog')(__dirname + '/repo');
var ecstatic = require('ecstatic')(__dirname + '/static');
var concat = require('concat-stream');
var hyperglue = require('hyperglue');
var fs = require('fs');
var trumpet = require('trumpet');
var resumer = require('resumer');
var strftime = require('strftime');
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

    // Article stream containing the HTML of all articles to show.
    var articles_html = glog.list().pipe(through(function(article) {
      // Trumpet stream of article template HTML.
      var article_html = fs.createReadStream('./render/article.html');
      var tr = trumpet();
      article_html.pipe(tr);

      // Pipe article metadata and body into article element trumpet streams.
      glog.read(article.file)
          .pipe(tr.select('.article_body').createWriteStream());
      resumer().queue(article.title).end()
          .pipe(tr.select('.article_title').createWriteStream());
      // var date = strftime("%A %B %e  %k:%M", new Date(article.date));
      resumer().queue(article.date).end()
          .pipe(tr.select('.article_date').createWriteStream());

      // Collect final HTML in a concat stream and let it flow into through stream.
      var that_stream = this;
      that_stream.pause();
      tr.pipe(concat(function(html) {
        that_stream.queue(html);
        that_stream.resume();
      }));
    }));

    // Stream the articles' HTML into the body of the page.
    var body = page_tr.select('body').createWriteStream();
    articles_html.pipe(body);
  } else {
    ecstatic(req, res);
  }
  console.log('REQUEST END');
}).listen(5000);

