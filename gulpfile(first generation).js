var gulp        			= require ('gulp'),
    sass        			= require ('gulp-sass'),
    browserSync 			= require('browser-sync'),
    concat      			= require('gulp-concat'),
    uglify      			= require('gulp-uglifyjs'),
    cssnano     			= require('gulp-cssnano'),
    rename      			= require('gulp-rename'),
    del         			= require('del'),
    imagemin    			= require('gulp-imagemin'),
    pngquant    			= require('imagemin-pngquant'), 
    cache       			= require('gulp-cache'),			
    autoprefixer			= require('gulp-autoprefixer'),
    babel          = require('gulp-babel'),
    svgo           = require('gulp-svgo'),
    minifyJS       = require('gulp-minify'),
    pug            = require('gulp-pug');

// компилируем SASS файлы в CSS 
gulp.task('sass', function(){
	return gulp.src('app/sass/**/*.sass')
	.pipe(sass())
	.pipe(autoprefixer(['last 15 versions', '> 1%','ie 8', 'ie 7'], { cascade:true}))
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.reload({stream:true}))
});

// Минификация svg
gulp.task('svgo', function () {
    return gulp.src('app/img/svg/*.svg')
        .pipe(svgo())
        .pipe(gulp.dest('app/img/svg'));
});

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

// минифицируем JS библиотеки
gulp.task('scripts', function(){
	return gulp.src([
		'app/libs/jquery/dist/jquery.min.js',
		'app/libs/magnific-popup/dist/jquery.magnific-popup.min.js',
		])
	.pipe(concat('libs.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('app/js/'));
});

// компилируем CSS библиотеки в одну
gulp.task('css-libs', ['sass'], function(){
	return gulp.src('app/css/libs.css')
	.pipe(cssnano())
	.pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest('app/css'));
});

// синхронизируем работу с браузером
gulp.task('browser-sync', function(){
	browserSync({
		server: {
			baseDir: 'app',
			index: "page-home.html"
		},
		notify:false
	})
});

// чистим кэш 
gulp.task('clean', function(){
	return cache.clearAll();
});

gulp.task('clear', function(){
	return del.sync('dist');
});

// сжимаем картинки
gulp.task('img', function(){
	 return gulp.src('app/img/**/*')
	 .pipe(cache(imagemin({
    interlaced: true,
    progressive: true,
    svgjPlugins: [{removeViewBox: false}],
    une:[pngquant()]
	 })))
	 .pipe(gulp.dest('dist/img'));
});

// запускаем задачу для просмотра
gulp.task('watch', ['browser-sync', 'pug', 'css-libs', 'scripts',],  function() {
	gulp.watch('app/sass/**/*.sass', ['sass']);
	gulp.watch(['app/pug/**/*.+(pug|jade)','app/blocks/**/*.+(pug|jade)'],['pug']);
	gulp.watch('app/*.html', browserSync.reload);
	gulp.watch('app/js/**/*.js', browserSync.reload);
});

// собираем проект
gulp.task('build',['clean','img', 'sass', 'scripts'], function(){

	var buildCss = gulp.src([
		'app/css/main.css',
		'app/css/libs.min.css',
		])
	  .pipe(gulp.dest('dist/css'));

	var buildFonts = gulp.src('app/fonts/**/*')
	  .pipe(gulp.dest('dist/fonts'));

	var buildJs = gulp.src('app/js/**/*')
	  .pipe(gulp.dest('dist/js'));

	var builfHTML = gulp.src('app/*.html')
	  .pipe(gulp.dest('dist'));

});