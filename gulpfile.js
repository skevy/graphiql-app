'use strict'

var gulp = require('gulp')
var sass = require('gulp-sass')

gulp.task('sass', () => {
    return gulp.src('./scss/**/*.scss')
        .pipe(sass({
            includePaths: '/./scss/'
        }).on('error', sass.logError))
        .pipe(gulp.dest('./css'))
})

gulp.task('sass:watch', () => {
    gulp.watch('./scss/**/*.scss', ['sass'])
})