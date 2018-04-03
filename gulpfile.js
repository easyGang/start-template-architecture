var gulp           = require('gulp'),
    gutil          = require('gulp-util' ),
    sass           = require('gulp-sass'),
    browserSync    = require('browser-sync'),
    concat         = require('gulp-concat'),
    uglify         = require('gulp-uglify'),
    // uglify         = require('gulp-uglify-es').default,
    cssnano 	   = require('gulp-cssnano'),
    cleanCSS       = require('gulp-clean-css'),
    rename         = require('gulp-rename'),
    del            = require('del'),
    imagemin       = require('gulp-imagemin'),
    cache          = require('gulp-cache'),
    autoprefixer   = require('gulp-autoprefixer'),
    ftp            = require('vinyl-ftp'),
    notify         = require("gulp-notify"),
    rsync          = require('gulp-rsync'),
    pug            = require('gulp-pug'),
    // data           = require('gulp-data'),
    // stylus         = require('gulp-stylus'),
    babel          = require('gulp-babel'),
    svgo           = require('gulp-svgo'),
    minifyJS       = require('gulp-minify');

// Пользовательские скрипты проекта

// Минификация svg
gulp.task('svgo', function () {
    return gulp.src('app/img/svg/*.svg')
        .pipe(svgo())
        .pipe(gulp.dest('app/img/svg'));
});

// Удаляем ненужные js
gulp.task('remove-js', function() {
    return del.sync([
        'app/js/libs.js',
        'app/js/mylibs.js',
        'app/js/blocks.js',
    ]);
});

// js
gulp.task('js',['js-libs','js-mylibs','js-blocks'], function() {
    return gulp.src([
        'app/js/libs.js',
        'app/js/mylibs.js',
        'app/js/blocks.js',
    ])
        .pipe(concat('scripts.min.js'))
        .pipe(babel({
            presets: ['env']
        }))

        // .pipe(uglify()) // Минимизировать весь js (на выбор)
        .pipe(gulp.dest('app/js'))
        .pipe(browserSync.reload({stream: true}));
});

// Сторонние библиотеки
gulp.task('js-libs', function() {
    return gulp.src([
        'app/libs/jquery/**/*.js',
        'app/libs/**/*.js',
    ])
        .pipe(concat('libs.js'))
        .pipe(gulp.dest('app/js'))
});

// Мои библиотеки
gulp.task('js-mylibs', function() {
    return gulp.src([
        'app/mylibs/**/*.js',
    ])
        .pipe(concat('mylibs.js'))
        .pipe(gulp.dest('app/js'))
});

// Подключение файлов блоков
gulp.task('js-blocks', function() {
    return gulp.src([
        'app/blocks/**/*.js',
    ])
        .pipe(concat('blocks.js'))
        .pipe(gulp.dest('app/js'))
});

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: 'app/',
            index: "page-home.html",
        },
        notify: false,
        // tunnel: true,
        // tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
    });
});

// Стили библиотек
gulp.task('css-libs',function () {
    return gulp.src('app/libs/**/*.css')
        .pipe(concat('libs.min.css'))
        .pipe(cssnano())
        .pipe(gulp.dest('app/css'));
});

// Все стили
gulp.task('sass', [ 'sass-main-screen','sass-sass'], function() {
    return gulp.src([
        'app/css/main.min.css',
        // 'app/css/blocks.min.css',
    ])
        .pipe(concat('main.min.css'))
        .pipe(autoprefixer(['last 15 versions']))
        // .pipe(cleanCSS())// Опционально, закомментировать при отладке
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({stream: true}));
});

// Стили из sass
gulp.task('sass-sass', function() {
    return gulp.src([
        'app/sass/**/*.+(scss|sass)',
    ])
        .pipe(sass({outputStyle: 'expand'}).on("error", notify.onError()))
        .pipe(rename({suffix: '.min', prefix : ''}))
        .pipe(gulp.dest('app/css'))
});

// Стили главного экрана
gulp.task('sass-main-screen', function() {
    return gulp.src([
        'app/sass/main-screen.+(scss|sass)',
        // 'app/blocks/header/*.+(scss|sass)',
        // 'app/blocks/+(main-screen|main-screen-*)/*.+(scss|sass)',
    ])
        .pipe(concat('main-screen.sass'))
        .pipe(sass({outputStyle: 'expand'}).on("error", notify.onError()))
        .pipe(rename({suffix: '.min', prefix : ''}))
        .pipe(autoprefixer(['last 15 versions']))
        .pipe(gulp.dest('app/css'))
});

// Удаляем blocks.min.css
gulp.task('removeBlocksCss', function() { return del.sync('app/css/blocks.min.css'); });

// Pug
gulp.task('pug',function () {
    return gulp.src([
        'app/blocks/page-*/*.+(pug|jade)',
        'app/blocks/404/*.+(pug|jade)',
    ])
        .pipe(pug({pretty: true}))// Читаемость и каскадность кода
        .pipe(rename({ dirname: "" })) // Вытаскиваем без папок
        .pipe(gulp.dest('app'));
});

// Svg
gulp.task('svg',function () {
    return gulp.src([
        '!app/svg/functions.+(pug|jade)',
        'app/svg/*.+(pug|jade)'
    ])
        .pipe(pug())
        .pipe(rename({extname: '.svg'})) // преобразуем из html в svg
        .pipe(gulp.dest('app/img/svg'));
});

// Отслеживание
gulp.task('watch', ['sass','pug', 'js','css-libs', 'browser-sync'], function() {
    // gulp.watch(['app/stylus/**/*.styl','app/blocks/**/*.styl'],['stylus']);
    gulp.watch(['app/sass/**/*.+(scss|sass)','app/blocks/**/*.+(scss|sass)'],['sass']);
    gulp.watch(['app/pug/**/*.+(pug|jade)','app/blocks/**/*.+(pug|jade)'],['pug']);
    gulp.watch(['app/libs/**/*.js','app/mylibs/**/*.js','app/blocks/**/*.js'], ['js']);
    gulp.watch('libs/**/*.css', ['css-libs']);
    gulp.watch('app/*.html', browserSync.reload);
});

// Отслеживание svg
gulp.task('watch-svg', ['svg'], function() {
    gulp.watch(['app/svg/**/*.+(pug|jade)'],['svg']);
});

// Минимизация изображений
gulp.task('imagemin', function() {
    return gulp.src([
        '!app/img/psd/*.*',
        'app/img/**/*',
    ])
        .pipe(cache(imagemin()))
        .pipe(gulp.dest('dist/img'));
});

// Создание папки dist
gulp.task('build', ['removedist', 'imagemin', 'sass', 'js'], function() {

    var buildFiles = gulp.src([
        'app/*.html',
        'app/.htaccess',
    ]).pipe(gulp.dest('dist'));

    var buildCss = gulp.src([
        'app/css/main.min.css',
        'app/css/main-screen.min.css',
    ])  .pipe(cleanCSS())
        .pipe(cssnano())
        .pipe(gulp.dest('dist/css'));

    var buildJs = gulp.src([
        'app/js/scripts.min.js',
    ])
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));

    var buildFonts = gulp.src([
        'app/fonts/**/*',
    ]).pipe(gulp.dest('dist/fonts'));

});

gulp.task('deploy', function() {

    var conn = ftp.create({
        host:      'hostname.com',
        user:      'username',
        password:  'userpassword',
        parallel:  10,
        log: gutil.log
    });

    var globs = [
        'dist/**',
        'dist/.htaccess',
    ];
    return gulp.src(globs, {buffer: false})
        .pipe(conn.dest('/path/to/folder/on/server'));

});

gulp.task('rsync', function() {
    return gulp.src('dist/**')
        .pipe(rsync({
            root: 'dist/',
            hostname: 'username@yousite.com',
            destination: 'yousite/public_html/',
            // include: ['*.htaccess'], // Скрытые файлы, которые необходимо включить в деплой
            recursive: true,
            archive: true,
            silent: false,
            compress: true
        }));
});

gulp.task('removedist', function() { return del.sync('dist'); });
gulp.task('clearcache', function () { return cache.clearAll(); });

gulp.task('default', ['watch']);
