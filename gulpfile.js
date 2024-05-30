const { src, dest, series, parallel, watch } = require("gulp");

const sass = require("gulp-sass")(require("sass"));

const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const autoprefixer = require("autoprefixer");
const rename = require("gulp-rename");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const sourcemaps = require("gulp-sourcemaps");
const clean = require("gulp-clean");

const browserSync = require("browser-sync").create();
const reload = browserSync.reload;

const kit = require("gulp-kit");

const paths = {
	html: "./html/**/*.kit",
	dist: "./dist",
	sass: "./src/sass/**/*.scss",
	sassDest: "./dist/css",
	js: "./src/js/**/*.js",
	jsDest: "./dist/js",
	img: "./src/img/*",
	imgDest: "./dist/img",
};

function sassCompiler(done) {
	const plugins = [
		autoprefixer({ Browserslist: ["last 1 version"] }),
		cssnano(),
	];

	src(paths.sass)
		.pipe(sourcemaps.init())
		.pipe(sass().on("error", sass.logError))
		.pipe(postcss(plugins))
		.pipe(rename({ suffix: ".min" }))
		.pipe(sourcemaps.write())
		.pipe(dest(paths.sassDest));
	done();
}

function javascript(done) {
	src(paths.js)
		.pipe(sourcemaps.init())
		.pipe(
			babel({
				presets: ["@babel/env"],
			})
		)
		.pipe(uglify())
		.pipe(rename({ suffix: ".min" }))
		.pipe(sourcemaps.write())
		.pipe(dest(paths.jsDest));
	done();
}

function minifyImages(done) {
	src(paths.img)
		.pipe(imagemin())
		.pipe(rename({ suffix: ".min" }))
		.pipe(dest(paths.imgDest));
	done();
}

function handleKits(done) {
	src(paths.html).pipe(kit()).pipe(dest("./"));
	done();
}

function cleanFiles(done) {
	src(paths.dist, { read: false }).pipe(clean());
	done();
}

function startBrowserSync(done) {
	browserSync.init({
		server: {
			baseDir: "./",
		},
		notify: false,
	});
	done();
}

function watchForChanges(done) {
	watch("./*.html").on("change", reload);
	watch(
		[paths.html, paths.sass, paths.js],
		parallel(handleKits, sassCompiler, javascript)
	).on("change", reload);
	watch(paths.img, minifyImages).on("change", reload);
	done();
}

const mainFunctions = parallel(
	handleKits,
	sassCompiler,
	javascript,
	minifyImages
);

exports.cleanFiles = cleanFiles;

exports.default = series(mainFunctions, startBrowserSync, watchForChanges);
