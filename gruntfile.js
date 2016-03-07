module.exports = function ( grunt ) {
    grunt.initConfig( {
        uglify: {
            options: {
                mangle   : false,
                sourceMap: true
            },
            dist   : {
                files: {
                    "fancyscroll.min.js": [ "fancyscroll.js" ]
                }
            }
        },
        cssmin: {
            target: {
                files: {
                    "fancyscroll.min.css": [ "fancyscroll.css" ]
                }
            }
        }
    } );

    grunt.loadNpmTasks( "grunt-contrib-uglify" );
    grunt.loadNpmTasks( "grunt-contrib-cssmin" );
};