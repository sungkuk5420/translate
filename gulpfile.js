var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var nodemon = require('gulp-nodemon');
var stripDebug = require('gulp-strip-debug');

var src = 'public';
var dist = 'public/dist';

var paths = {
    // js: src + '/javascripts/**/*.js',
    js: src + '/javascripts/*.js',
    scss: src + '/scss/*.scss'
};

// ウェブサーバーを localhost:3000 で実行する
gulp.task('browser-sync', function() {
    browserSync.init({
        files: ['public/**/*.*', 'views/**/*.*'], // BrowserSyncにまかせるファイル群
        proxy: 'http://localhost:3000',  // express の動作するポートにプロキシ
        port: 4000,  // BrowserSync は 4000 番ポートで起動
        open: true  // ブラウザ open する
    });
});

//nodeファイルの変更するとサーバーを自動更新
gulp.task('server', ['browser-sync'], function () {
    nodemon({
        script: './app.js',
        ext: 'js css',
        ignore: [  // nodemon で監視しないディレクトリ
            'node_modules',
            'bin',
            'views',
            'public'
        ],
        env: {
            'NODE_ENV': 'development'
        },
        stdout: false  // Express の再起動時のログを監視するため
    }).on('readable', function() {
        this.stdout.on('data', function(chunk) {
            if (/^Express\ server\ listening/.test(chunk)) {
                // Express の再起動が完了したら、reload() でBrowserSync に通知。
                // ※Express で出力する起動時のメッセージに合わせて比較文字列は修正
                browserSync.reload({ stream: false });
            }
            process.stdout.write(chunk);
        });
        this.stderr.on('data', function(chunk) {
            process.stderr.write(chunk);
        });
    });
});

//　Javascriptファイルを一つに併合
gulp.task('combine-js', function () {
    return gulp.src(paths.js)
        .pipe(stripDebug())
        .pipe(uglify())
        .pipe(concat('script.js'))
        .pipe(gulp.dest(dist + '/js'));
});

// sass ファイルを css にこんコンパイルする.
gulp.task('compile-sass', function () {
    return gulp.src([paths.scss,'public/stylesheets/*.css'])
        .pipe(sass())
        .pipe(gulp.dest(dist + '/css'))
        .pipe(browserSync.reload({ stream : true }));
});

// ファイルの変更感知とブラウザの再起動
gulp.task('watch', function () {
    gulp.watch(paths.js, ['combine-js']);
    gulp.watch(paths.scss, ['compile-sass']).on('change', browserSync.reload);
    gulp.watch(dist + '/**');
});

//基本taskの設定
gulp.task('default', [
    'combine-js', 'server',
    'compile-sass','watch' ]);