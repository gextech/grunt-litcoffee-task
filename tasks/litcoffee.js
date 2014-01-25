module.exports = function(grunt) {
  var _ = grunt.util._,
      parent_dir = require('path').dirname(__dirname);

  grunt.loadTasks(parent_dir + '/node_modules/grunt-markdown/tasks');

  grunt.registerMultiTask('litcoffee', function() {
    grunt.log.writeln('Configuring required tasks...');

    var options = this.options({
          theme: 'github',
          code: parent_dir + '/src/code.us',
          home: parent_dir + '/src/home.us',
          layout: parent_dir + '/src/layout.us',
          styles: parent_dir + '/src/litcoffee.css'
        });

    var base_dir,
        files = [];

    _.each(this.files, function(glob) {
      base_dir = glob.dest ? glob.dest : base_dir;
      _.each(glob.src, function(file) {
        files.push({ expand: true, cwd: file, src: ['**/*.{litcoffee,md}'], dest: glob.dest, ext: '.html' });
      });
    });

    grunt.config.set('markdown', {
      litcoffee: {
        files: files,
        options: {
          template: options.code,
          markdownOptions: {
            gfm: true,
            highlight: function(code, lang) {
              return require('highlight.js').highlight(lang || 'coffeescript', code).value;
            }
          }
        }
      }
    });

    grunt.config.set('markdown:pages', { litcoffee: { cwd: base_dir, options: options } });

    grunt.task.run(['markdown', 'markdown:pages']);
  });

  grunt.registerTask('markdown:pages', function() {
    var pkg = grunt.file.readJSON('package.json'),
        params = grunt.config('markdown:pages.litcoffee');

    var base_dir = params.cwd,
        options = params.options,
        files = grunt.file.expand(base_dir + '/**/*.html');

    var layout = grunt.file.read(options.layout),
        index = base_dir + '/index.html',
        style = base_dir + '/style.css';

    var linkify = function(dir, node, current) {
      var here, href;

      href = node.basePath + '/' + node.baseName;
      here = href === current ? ' class="active"' : '';

      return '<a href="' + dir + '/' + node.baseName + '"' + here + '>' + node.docTitle + '</a>';
    };

    var titleize = function(str) {
      return str.replace(/\.[\w.]+$/g, '').replace(/^\d+_/, '').replace(/_/g, ' ');
    };

    var listFiles = function(set, path, current) {
      var list, item, dir, out;

      out = [];
      path = path.replace(/\/$/, '');

      list = {
        basePath: '',
        baseName: 'index.html',
        docTitle: pkg.title || pkg.name
      };

      out.push('<h2>' + linkify(path, list, current) + '</h2>');
      out.push('<ul>');

      for (dir in set) {
        item = set[dir];

        out.push('  <li><h3 class="directory">' + dir + '</h3>');
        out.push('  <ul>');

        if (!item.childs.length) {
          item.childs.push(item.node);
        }

        _.each(item.childs, function(sub) {
          out.push('    <li>' + linkify(path + dir, sub, current) + '</li>');
        });

        out.push('  </ul>');
        out.push('  </li>');
      };

      out.push('</ul>');

      return out.join('\n');
    };


    var nth = 0,
        map = {},
        tree = [],
        script = '';

    _(files).each(function(src) {
      var baseName, basePath, docTitle, leaf;

      basePath = src.split('/');
      baseName = basePath.pop();
      basePath = basePath.join('/').substr(base_dir.length);
      docTitle = titleize(src.split('/').pop().replace(base_dir, ''));

      if (index === src) {
        nth += 1;
        script = grunt.file.read(src);
      } else {
        if (!(leaf = tree[basePath])) {
          leaf = tree[basePath] = {
            node: { docTitle: docTitle, basePath: basePath, baseName: baseName },
            childs: []
          };
        }

        leaf.childs.push({ docTitle: docTitle, basePath: basePath, baseName: baseName });

        map[src] = { title: docTitle, path: basePath + '/' + baseName, body: grunt.file.read(src) };
      }
    });

    grunt.file.write(index, _.template(layout, {
      style: './style.css',
      title: pkg.title || pkg.name,
      tree: listFiles(tree, '.', 'index.html'),
      body: _.template(grunt.file.read(options.home), { pkg: pkg, script: script })
    }));

    grunt.log.ok('File "' + index + '" created.');

    var base_css = grunt.file.read(options.styles),
        theme_css = grunt.file.read(parent_dir + '/css/' + options.theme + '.css');

    grunt.file.write(style, [base_css, theme_css].join('\n'));
    grunt.log.ok('File "' + style + '" copied.');

    _.each(map, function(doc) {
      var dots;

      nth += 1;
      dots = new Array(doc.path.split('/').length);
      dots = ['./'].concat(dots).join('../');

      grunt.file.write(base_dir + doc.path, _.template(layout, {
        style: dots + 'style.css',
        title: (pkg.title || pkg.name) + ' | ' + doc.title,
        tree: listFiles(tree, dots, doc.path),
        body: doc.body
      }));
    });

    grunt.log.ok(nth + ' file(s) was literated.');
  });
};
