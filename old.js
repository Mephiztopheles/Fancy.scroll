(function () {
    var logged = false,
        mouse = {},
        id = 0,
        $ = jQuery;

    // get scrollable parent
    function sp( el ) {
        var position = el.css( "position" ),
            excludeStaticParent = position === "absolute",
            scrollParent = el.prop( 'nodeName' ) == "TEXTAREA" && el[ 0 ].scrollHeight - el.outerHeight() > 0 ? el : false;
        if ( !el )
            scrollParent = el.parents().filter( function () {
                var parent = $( this );
                if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
                    return false;
                }
                return (/(auto|scroll)/).test( parent.css( "overflow" ) + parent.css( "overflow-y" ) + parent.css( "overflow-x" ) ) && parent[ 0 ].scrollHeight - parent.outerHeight() > 0;
            } ).eq( 0 );
        return position === "fixed" || !scrollParent.length ? $( el[ 0 ].ownerDocument || document ) : scrollParent;
    }

    /**
     * @param element
     * @param [options]
     *
     */
    window.FancyScroll = function FancyScroll( element, options ) {
        if ( !$( element ).length ) {
            console.info( "Element does not exist. Skipping..." );
            return;
        }
        this.name = 'FancyScroll';
        this.id = id++;
        this.version = '1.6.2';
        this.disabled = false;
        this.scroll = 0;
        this.timer = 0;

        this.element = $( element )[ 0 ].nodeName == "#document" ? $( 'body' ) : $( element );
        // check if this is body for other behaviour
        this.isBody = $( element )[ 0 ].nodeName == "#document" || $( element )[ 0 ].nodeName == 'BODY';
        // check if this is chrome for other behaviour
        this.isChrome = navigator.userAgent.indexOf( 'Chrome' ) > 0;

        this.wrapper = this.element.parent();

        this.y = $( '<div/>', {
            id   : this.name + '-y-' + this.id,
            class: this.name + '-rail ' + this.name + '-y-rail'
        } );
        this.y.cursor = $( '<div/>', { id: this.name + '-y-cursor-' + this.id, class: this.name + '-cursor' } );

        this.x = $( '<div/>', {
            id   : this.name + '-x-' + this.id,
            class: this.name + '-rail ' + this.name + '-x-rail'
        } );
        this.x.cursor = $( '<div/>', { id: this.name + '-x-cursor-' + this.id, class: this.name + '-cursor' } );

        this.options = $.extend( {}, window.FancyScroll.options, options );
        this.speed = this.options.scrollSpeed;
        this.animation = {
            running: false,
            options: { duration: this.speed, easing: 'linear' }
        };

        this.mobile = (navigator.userAgent.indexOf( 'Mobile' ) > 1 || navigator.userAgent.indexOf( 'iPad' ) > 1 || navigator.userAgent.indexOf( 'Mobile' ) > 1);

        this.showCursor = function ( rail ) {

            // in case it is not disabled and there is a ratio AND if my rails is Y
            if ( !this.disabled && this.ratioY > 1 && (!rail || rail == 'y') ) {
                this.y.css( 'display', '' ).removeClass( this.name + '-mode-' + this.options.hideMode + '-out' ).addClass( this.name + '-mode-' + this.options.hideMode + '-in' );

                // if i am allowed to hide, and i'm not holding the mouse over the rail and i'm not dragged, hide the cursor after 1 min
                if ( this.options.autoHide )
                    this.delay( function () {if ( !this.y.cursor.active && !this.y.cursor.dragged )this.hideCursor()}, 1000 );
            }

            // in case it is not disabled and there is a ratio AND if my rails is X
            if ( !this.disabled && this.ratioX > 1 && (!rail || rail == 'x') ) {
                this.x.css( 'display', '' ).removeClass( this.name + '-mode-' + this.options.hideMode + '-out' ).addClass( this.name + '-mode-' + this.options.hideMode + '-in' );

                // if i am allowed to hide, and i'm not holding the mouse over the rail and i'm not dragged, hide the cursor after 1 min
                if ( this.options.autoHide )
                    this.delay( function () {if ( !this.x.cursor.active && !this.y.cursor.dragged )this.hideCursor()}, 1000 );
            }
            return this;
        };

        this.hideCursor = function ( force ) {
            // check again if i am enabled
            if ( !this.disabled ) {
                if ( force ) {
                    this.y.hide();
                    this.x.hide();
                }
                // remove the animation classes (css)
                this.y.removeClass( this.name + '-mode-' + this.options.hideMode + '-in' ).addClass( this.name + '-mode-' + this.options.hideMode + '-out' );
                this.x.removeClass( this.name + '-mode-' + this.options.hideMode + '-in' ).addClass( this.name + '-mode-' + this.options.hideMode + '-out' );
            }
            return this;
        };

        this.disable = function () {
            // hide me and disable me
            this.hideCursor( true );
            this.disabled = true;
            if ( this.mobile && this.options.mobile ) {
                $( document ).on( 'touchmove.FancyScroll-disable', function ( e ) {
                    if ( !sp( $( e.target ) ).length )
                        e.preventDefault();
                } );
            }
            return this;
        };

        this.enable = function () {
            this.disabled = false;
            // enable me and removy my display style
            this.y.css( 'display', '' );
            this.x.css( 'display', '' );
            if ( this.mobile && this.options.mobile ) {
                $( document ).unbind( 'touchmove.FancyScroll-disable' );
            }
            return this;
        };

        this.resize = function ( options ) {
            // check if i want to reposition me
            options = $.extend( {
                reposition: true
            }, options );
            // other behaviour for body
            // get WayToScroll
            if ( this.isBody ) {
                this.element.wtsY = this.element[ 0 ].scrollHeight - window.innerHeight;
            } else {
                this.element.wtsY = this.element[ 0 ].scrollHeight - this.element.outerHeight();
            }
            // other behaviour for body
            // get WayToScroll
            if ( this.isBody ) {
                this.element.wtsX = this.element[ 0 ].scrollWidth - window.innerWidth;
            } else {
                this.element.wtsX = this.element[ 0 ].scrollWidth - this.element.outerWidth();
            }

            this.position();

            // style my rail
            this.y.css( {
                top   : this.element.position().top + parseInt( this.element.css( 'borderTop' ) || 0 ) + parseInt( this.element.css( 'marginTop' ) || 0 ),
                height: this.isBody ? '100%' : this.element.innerHeight()
            } );
            this.x.css( {
                left : this.element.position().left + parseInt( this.element.css( 'marginRight' ) ),
                width: this.isBody ? '100%' : this.element.outerWidth()
            } );

            // style my cursor
            this.y.cursor.css( {
                height   : this.y.height() - ( this.y.height() * (this.element.wtsY / this.element[ 0 ].scrollHeight ) ),
                minHeight: this.options.cursorMinHeight
            } );
            this.x.cursor.css( {
                width   : this.element.outerWidth() - ( this.element.outerWidth() * (this.element.wtsX / this.element[ 0 ].scrollWidth ) ),
                minWidth: this.options.cursorMinHeight
            } );

            this.moveCursor();

            // calculate WayToScroll for my rails
            this.y.wts = this.y.height() - this.y.cursor.outerHeight();
            this.x.wts = this.x.width() - this.x.cursor.outerWidth();

            // calculate ratio
            this.ratioY = this.element.wtsY / this.y.wts;
            this.ratioX = this.element.wtsX / this.x.wts;

            // hide rails if no ratio available
            if ( this.ratioY < 1 )
                this.y.css( 'display', 'none' );
            else
                this.y.css( 'display', '' );

            if ( this.ratioX < 1 )
                this.x.css( 'display', 'none' );
            else
                this.x.css( 'display', '' );

            return this;
        };

        this.reload = function ( data ) {
            var params = $.extend( {
                max   : this.options.infiniteSize,
                offset: 0
            }, data );
            this.options.infiniteData = data;
            // refill cache
            this.getCache( params );
        };

        this.destroy = function () {
            // remove class
            this.element.removeClass( this.name + '-element' );
            // reset overflow and unbind events
            this.element.css( 'overflow', '' ).unbind( '.' + this.name );
            $( window ).unbind( '.' + this.name );
            // reset cursor
            $( 'html' ).css( { cursor: '' } );
            //re move rails
            this.y.remove();
            this.x.remove();
        };

        if ( !this.options.mobile && this.mobile ) {
            this.disable();
        }

        if ( !this.element.data( this.name ) )
            this.init();

    };

    window.FancyScroll.prototype = {

        init: function () {
            var fn = this;
            if ( !logged ) {
                logged = true;
            }

            // save me to element data
            this.element.data( this.name, this );

            var lastY = 0;
            if ( !this.options.mobile && this.mobile ) {
                this.element.on( 'touchend.' + this.name, function ( e ) {
                    var currentY = e.originalEvent.changedTouches[ 0 ].clientY;
                    if ( currentY < lastY ) {
                        // SCROLLING DOWN
                        fn.scrollDirection = 'down';
                    } else {
                        // SCROLLING UP
                        fn.scrollDirection = 'up';
                    }
                    lastY = currentY;
                    fn.scrollEvents();
                } );
//                add classes and make unscrollable
                this.element.addClass( this.name + '-element' );
                this.element.css( { overflow: 'auto', '-webkit-overflow-scrolling': 'touch' } );
            } else {
                this.element.on( 'DOMMouseScroll.' + this.name + ' mousewheel.' + this.name + ' MozMousePixelScroll.' + this.name + ' touchmove.' + this.name, function ( e ) {
                    "use strict";

                    if ( fn.disabled )
                        return;

                    var closest = $( e.target ).closest( '.' + fn.name + '-element' ),
                        up = e.originalEvent.wheelDelta / 120 > 0 || e.originalEvent.detail / 120 < 0,
                        scrollable = sp( $( e.target ) );

                    // if i am prevented and i am body and closest is not this element -> dont scroll
                    if ( fn.options.preventDefault && (closest.length && !closest.is( fn.element )) ) {
                        fn.debug( 'has fancyscroll' );
                        if ( up && closest.data( 'FancyScroll' ).infinite && closest.data( 'FancyScroll' ).infinite.last.up ) {
                            fn.debug( 'the ' + fn.name + '-element has infiniteScroll, is currently on way up and is not on top yet' );
                            return true;
                        }
                        if ( up && closest.scrollTop() ) {
                            fn.debug( 'the ' + fn.name + '-element is currently on way up and is not on top yet' );
                            return;
                        } else if ( !up && closest.scrollTop() < closest[ 0 ].scrollHeight - closest.outerHeight() ) {
                            fn.debug( 'the ' + fn.name + '-element is currently on way down and is not on bottom yet' );
                            return true;
                        }
                    }
                    // if i am prevented and closest scrollable element is not this.element and closest scrollable element is not document -> dont scroll
                    if ( fn.options.preventDefault && (!scrollable.is( fn.element ) && !scrollable.is( $( document ) )) ) {
                        fn.debug( 'scrollable parent' );
                        if ( up && scrollable.scrollTop() ) {
                            fn.debug( 'the container, the mouse is in, is currently on way up and didnt stop on top' );
                            return;
                        } else if ( !up && scrollable.scrollTop() < scrollable[ 0 ].scrollHeight - scrollable.outerHeight() ) {
                            fn.debug( 'the container, the mouse is in, is currently on way down and didnt stop on bottom' );
                            return true;
                        }
                    }

                    if ( fn.mobile ) {
                        // get mobile touch event
                        var currentY = e.originalEvent.touches[ 0 ].clientY;
                        if ( currentY <= lastY ) {
                            // SCROLLING DOWN
                            fn.scrollDown();
                        } else {
                            // SCROLLING UP
                            fn.scrollUp();
                        }
                        lastY = currentY;
                    } else {
                        // get direction by wheelDelta or detail
                        if ( up ) {
                            // SCROLLING UP
                            fn.scrollUp();
                        }
                        else {
                            // SCROLLING DOWN
                            fn.scrollDown();
                        }
                    }
                } );

                if ( this.options.y ) {
                    this.y.append( this.y.cursor );
                    this.wrapper.append( this.y );
                }
                if ( this.options.x ) {
                    // currently disabled due to uncomplete
                    // this.x.append( this.x.cursor );
                    // this.wrapper.append( this.x );
                }

                // add classes and make unscrollable
                this.element.addClass( this.name + '-element' );
                this.element.css( { overflow: 'hidden' } );

                this.y.cursor.css( {
                    background  : this.options.cursorColor,
                    position    : 'relative',
                    right       : 0,
                    border      : ( this.options.borderColor ? '1px solid ' + this.options.borderColor : ''),
                    borderRadius: this.options.borderRadius,
                    cursor      : this.options.cursorCursor
                } ).addClass( this.name + '-theme-' + this.options.theme + '-cursor' );

                this.x.cursor.css( {
                    background  : this.options.cursorColor,
                    position    : 'relative',
                    top         : 0,
                    border      : ( this.options.borderColor ? '1px solid ' + this.options.borderColor : ''),
                    borderRadius: this.options.borderRadius,
                    cursor      : this.options.cursorCursor
                } ).addClass( this.name + '-theme-' + this.options.theme + '-cursor' );

                // set position and style from options
                this.y.css( {
                    position       : (this.isBody ? 'fixed' : 'absolute'),
                    backgroundColor: this.options.railColor,
                    width          : this.options.cursorWidth
                } ).addClass( this.name + '-theme-' + this.options.theme + '-rail' );
                this.x.css( {
                    position       : (this.isBody ? 'fixed' : 'absolute'),
                    backgroundColor: this.options.railColor,
                    width          : this.options.cursorWidth
                } ).addClass( this.name + '-theme-' + this.options.theme + '-rail' );
                // hide cursor by default
                this.hideCursor();
                this.position();

                this.element.on( 'mouseenter.' + this.name, function () {
                    // add class hovered
                    fn.y.addClass( 'hovered' );
                    fn.showCursor();
                } ).on( 'mouseleave.' + this.name, function () {
                    // remove class hovered
                    fn.y.removeClass( 'hovered' );
                } );

                this.y.on( 'mouseenter.' + this.name, function () {
                    // add class hovered and stay
                    fn.y.addClass( 'hovered' );
                    fn.y.cursor.active = true;
                    fn.showCursor();
                } ).on( 'mouseleave.' + this.name, function () {
                    // remove class hovered
                    fn.y.removeClass( 'hovered' );
                    fn.y.cursor.active = false;
                } );
                var $body = $( 'body' ),
                    unselectable = $body.attr( 'unselectable' ),
                    user_select = $body.css( 'user-select' );

                // cursor grab event
                this.y.cursor.on( 'mousedown.' + this.name, function ( e ) {
                    "use strict";
                    mouse = {};
                    mouse.start = e.clientY;
                    mouse.old = e.clientY;
                    fn.y.cursor.dragged = true;
                    fn.y.cursor.active = true;

                    mouse.wts = {};
                    mouse.wts.up = mouse.start - parseInt( fn.y.cursor.css( 'top' ) ) - 2;
                    mouse.wts.down = mouse.start + fn.y.wts - parseInt( fn.y.cursor.css( 'top' ) ) + 2;
                    // calculate ways and set cursor for all and prevent selection

                    $body.css( {
                        "cursor"    : fn.options.cursorCursor,
                        "userSelect": "none"
                    } ).attr( 'unselectable', 'on' ).on( 'selectstart.' + fn.name, false );
                } );

                $( window ).on( 'mousemove.' + fn.name, function ( e ) {
                    "use strict";

                    // just if im dragged
                    if ( fn.y.cursor.dragged ) {
                        var wts;
                        // other behaviour for !chrome and body
                        // calculate scroll
                        if ( fn.isBody && !fn.isChrome ) {
                            wts = fn.wrapper.scrollTop() + (( fn.element.wtsY / fn.y.wts ) * ( e.clientY - mouse.old ));
                            fn.wrapper.scrollTop( Math.round( wts ) );
                        } else {
                            wts = fn.element.scrollTop() + (( fn.element.wtsY / fn.y.wts ) * ( e.clientY - mouse.old ));
                            fn.element.scrollTop( Math.round( wts ) );
                        }
                        // calculate way
                        fn.scrollDirection = (e.clientY > mouse.old ? 'down' : 'up');
                        fn.scrollEvents();
                        // resize but dont reposition
                        fn.resize( { reposition: false } );

                        // set old position for another calculation
                        if ( e.clientY >= mouse.wts.up && e.clientY <= mouse.wts.down ) {
                            mouse.old = e.clientY;
                        }
                    }
                } );

                $( window ).on( 'mouseup.' + this.name + ' touchend.' + this.name, function () {
                    "use strict";
                    // unbind selection
                    $body.unbind( '.' + fn.name );
                    if ( unselectable ) $body.attr( 'unselectable', unselectable );
                    else $body.removeAttr( "unselectable" );
                    if ( user_select != "text" ) $body.css( "user-select", user_select );
                    else $body.css( "user-select", "" );

                    // reset cursor
                    $body.css( { cursor: '' } );
                    // destroy mouse
                    mouse = {};
                    fn.y.cursor.active = false;
                    fn.y.cursor.dragged = false;
                } );
            }

            // infinitescroll
            if ( this.options.infiniteUrl ) {
                this.initInfinite();
                var me = this,
                    params = $.extend( {}, this.options.infiniteData ),
                    // save data to second params for first max entries
                    initParams = $.extend( {}, this.options.infiniteData );

                initParams.max = this.options.infiniteMax;
                initParams.offset = this.options.infiniteStart || 0;
                params.max = this.options.infiniteSize;
                params.offset = Math.max( 0, initParams.offset - this.options.infiniteSize );
                if ( !this.options.infiniteStart ) {
                    // get cache from start (0)
                    this.getCache( params );
                } else {
                    // send ajax request for the first max elements
                    $.ajax( {
                        url    : this.options.infiniteUrl,
                        global : false,
                        // use the initparams herefore
                        data   : initParams,
                        success: function ( data ) {
                            var index = initParams.offset,
                                // convert data
                                list = me.convert( data );
                            // append each element in data to cache and element ( not text )
                            $.each( list, function () {
                                if ( !me.infinite.cache[ index ] )
                                    me.infinite.cache[ index ] = this;
                                index++;
                            } );

                            var i = me.options.infiniteStart,
                                count = i;
                            while ( i <= me.options.infiniteStart + me.options.infiniteMax ) {
                                if ( me.infinite.cache[ i ] ) {
                                    me.element.append( me.infinite.cache[ i ] );
                                    count++;
                                }

                                i++;
                            }

                            // save current
                            me.infinite.current.up = me.options.infiniteStart;
                            me.infinite.current.down = count;

                            // save last
                            me.infinite.last.up = me.infinite.current.up;
                            me.infinite.last.down = me.infinite.current.down;
                            // save index
                            me.infinite.index.up = me.infinite.current.up;
                            me.infinite.index.down = me.infinite.current.down;

                            // save relative
                            me.infinite.relative.up = Math.max( 0, me.infinite.index.up - 1 );
                            me.infinite.relative.down = me.infinite.index.down - 1;
                            // set height
                            me.infinite.height = me.element[ 0 ].scrollHeight;
                            // resize
                            me.resize();
                            me.infinite.count = me.options.infiniteMax;
                            // fire events to make something after cache reloaded
                            me.element.trigger( me.name + ':newCache' );
                            me.element.trigger( me.name + ':append' );
                        }
                    } );

                    // get the rest of the cache
                    $.ajax( {
                        url    : this.options.infiniteUrl,
                        global : false,
                        data   : params,
                        success: function ( data ) {
                            var index = params.offset,
                                // convert
                                list = me.convert( data );
                            // fill cache
                            $.each( list, function () {
                                if ( !me.infinite.cache[ index ] )
                                    me.infinite.cache[ index ] = this;
                                index++;
                            } );
                        }
                    } );
                }
            }

            this.timeout( this.resize, 300 );
        },

        initInfinite: function () {
            this.infinite = {
                cache   : [],
                height  : 0,
                loading : { up: false, down: false },
                last    : { up: 0, down: 0 },
                index   : { up: this.options.infiniteStart, down: 0 },
                relative: { up: 0, down: 0 },
                current : { up: this.options.infiniteStart, down: 0 },
                max     : { up: false, down: this.options.infiniteStop }
            };
            return this;
        },

        position: function () {
            this.y.css( { left: this.element.position().left - this.options.margin + this.element.outerWidth() - this.y.width() - parseInt( this.element.css( 'borderRight' ) || 0 ) + parseInt( this.element.css( 'marginLeft' ) ) } );
            this.x.css( { top: this.element.position().top - this.options.margin + this.element.outerHeight() - this.x.height() + parseInt( this.element.css( 'marginTop' ) ) } );
            return this;
        },

        moveCursor: function () {
            // other behaviour for not chrome and body
            // animate cursor as fast as scrolling

            function move( type ) {
                var rx = ( this.y.height() - this.y.cursor.outerWidth() ) / this.element.wtsX,
                    ry = ( this.y.height() - this.y.cursor.outerHeight() ) / this.element.wtsY,
                    z = ( this.scrollDirection == 'up' ? -this.scroll : this.scroll ),
                    sx = ( this[ type ].scrollLeft() + (this.animation.running ? z : 0) ) * rx,
                    sy = ( this[ type ].scrollTop() + (this.animation.running ? z : 0) ) * ry,
                    x = ( this.scrollDirection == 'up' ? Math.max( 0, sx ) : Math.min( this.x.wts, sx ) ),
                    y = ( this.scrollDirection == 'up' ? Math.max( 0, sy ) : Math.min( this.y.wts, sy ) );

                if ( this.options.smooth && !this.y.cursor.dragged ) {
                    // stop cursor and fire new animation
                    this.y.cursor.stop().animate( {
                        top: y
                    }, this.animation.options );
                    // stop cursor and fire new animation
                    this.x.cursor.animate( {
                        left: x
                    }, this.animation.options );
                } else {
                    // stop cursor and reposition
                    this.y.cursor.stop().css( {
                        top: this[ type ].scrollTop() * ry
                    } );
                    // stop cursor and reposition
                    this.x.cursor.css( {
                        left: this[ type ].scrollLeft() * rx
                    } );
                }
            }

            if ( this.isBody && !this.isChrome ) {
                move.call( this, 'wrapper' );
            } else {
                move.call( this, 'element' );
            }
            return this;
        },

        scrollUp: function ( val ) {
            "use strict";

            // define scrollDirection to see where it goes
            this.scrollDirection = 'up';

            function scroll( type ) {
                var value = val || this[ type ].scrollTop() - this.options.scrollValue;
                this.scroll = val || this.options.scrollValue;
                if ( this.options.smooth && !this.y.cursor.dragged ) {

                    if ( this.animation.running ) {
                        this.animation.options.duration /= 4;
                        this.animation.options.duration *= 3;
                        // value =  val || this[type].scrollTop() - this.options.scrollValue * 2;
                    }
                    else
                        this.animation.options.duration = this.speed;
                    this.animation.running = true;
                    this[ type ].stop( true, true ).animate( { scrollTop: value }, this.animation.options );
                    // fire scrollevents
                    this.timeout( this.scrollEvents, this.speed + 5 );
                }
                // without animation
                else {
                    this.animation.running = true;
                    this[ type ].scrollTop( value );
                    // fire scrollevents
                    this.scrollEvents();
                }
            }

            if ( this.options.linear ? !this.animation.running : true ) {
                if ( this.isBody && !this.isChrome ) {
                    scroll.call( this, 'wrapper' );
                } else {
                    scroll.call( this, 'element' );
                }
                // resize the scroller
                this.resize( { reposition: false } );
                // and show the cursor
                this.showCursor();
            }
            return this;
        },

        scrollDown: function ( val ) {
            "use strict";

            // define scrollDirection to see where it goes
            this.scrollDirection = 'down';

            function scroll( type ) {
                var value = val || this[ type ].scrollTop() + this.options.scrollValue;
                this.scroll = val || this.options.scrollValue;
                if ( this.options.smooth && !this.y.cursor.dragged ) {
                    if ( this.animation.running ) {
                        this.animation.options.duration /= 4;
                        this.animation.options.duration *= 3;
                        // value =  val || this[type].scrollTop() + this.options.scrollValue * 2;
                    }
                    else
                        this.animation.options.duration = this.speed;
                    this.animation.running = true;
                    this[ type ].stop( true, true ).animate( { scrollTop: value }, this.animation.options );
                    // fire scrollevents
                    this.timeout( this.scrollEvents, this.speed + 5 );
                }
                // without animation
                else {
                    this.animation.running = true;
                    this[ type ].scrollTop( value );
                    // fire scrollevents
                    this.scrollEvents();
                }
            }

            if ( this.options.linear ? !this.animation.running : true ) {
                if ( this.isBody && !this.isChrome ) {
                    scroll.call( this, 'wrapper' );
                } else {
                    scroll.call( this, 'element' );
                }
                // resize the scroller
                this.resize( { reposition: false } );
                // and show the cursor
                this.showCursor();
            }

            return this;
        },
        scrollTo  : function ( val ) {
            function scroll( type ) {

                this.scroll = val || this.options.scrollValue;

                this.scrollDirection = val < this[ type ].scrollTop() ? 'down' : 'up';
                if ( this.options.smooth && !this.y.cursor.dragged ) {
                    if ( this.animation.running ) {
                        this.animation.options.duration /= 4;
                        this.animation.options.duration *= 3;
                        // value =  val || this[type].scrollTop() + this.options.scrollValue * 2;
                    }
                    else
                        this.animation.options.duration = this.speed;
                    this.animation.running = true;
                    this[ type ].stop( true, true ).animate( { scrollTop: val }, this.animation.options );
                    // fire scrollevents
                    this.timeout( this.scrollEvents, this.speed + 5 );
                }
                // without animation
                else {
                    this.animation.running = true;
                    this[ type ].scrollTop( val );
                    // fire scrollevents
                    this.scrollEvents();
                }
            }

            if ( this.options.linear ? !this.animation.running : true ) {
                if ( this.isBody && !this.isChrome ) {
                    scroll.call( this, 'wrapper' );
                } else {
                    scroll.call( this, 'element' );
                }
                // resize the scroller
                this.resize( { reposition: false } );
                // and show the cursor
                this.showCursor();
            }

            return this;
        },

        delay: function ( callback, ms ) {
            var fn = this;
            clearTimeout( this.timer );
            this.timer = setTimeout( function () {callback.call( fn )}, ms );
        },

        timeout: function ( callback, ms ) {
            var fn = this;
            setTimeout( function () {
                callback.call( fn )
            }, ms );
        },

        getScroll: function () {

        },

        scrollEvents: function () {
            // infiniteScroll
            if ( this.options.infiniteUrl ) {
                var space,
                    me = this,
                    onEdge,
                    isMaxLength,
                    i,
                    first = this.element.children().first().outerHeight(),
                    params = $.extend( {
                        max   : this.options.infiniteSize,
                        offset: this.infinite.current.down
                    }, this.options.infiniteData );
                this.infinite.relative.up = this.element.scrollTop() > first ? Math.max( 0, Math.floor( this.element.scrollTop() / first ) ) : 1;
                this.infinite.relative.down = Math.floor( ( this.element.scrollTop() + this.element.outerHeight() ) / first );
                // if way is going down
                if ( this.scrollDirection == 'down' ) {

                    // enough space to bottom? range from cursor bottom edge to rail bottom edge
                    space = this.infinite.relative.down + this.options.infiniteBuffer >= this.element.children().length;
                    // is enough in cache to prepend?
                    var hasCache = this.infinite.cache[ this.infinite.index.down + 1 ] ? true : false,
                        // is option on which position to stop reached?
                        mustNotStop = (this.options.infiniteStop.down != false ? this.options.infiniteStop.down >= this.infinite.current.down : true);

                    if ( space && hasCache && mustNotStop ) {
                        i = 0;
                        while ( i < this.options.infiniteAppend ) {
                            i++;
                            if ( !$( this.element.children()[ this.infinite.relative.down ] ).length ) {
                                // add one to current and last down
                                this.infinite.current.down++;
                                this.infinite.index.down++;
                                this.infinite.relative.down++;
                                this.infinite.last.down++;
                                // append next element from cache to element
                                this.element.append( $( this.infinite.cache[ this.infinite.index.down ] ) );
                                // add to infinite height
                                this.infinite.height += this.element[ 0 ].scrollHeight + this.element.height();
                            } else {
//                                throw new Error( 'Element already in list: ' + this.infinite.relative.down )
                            }
                        }
                        // trigger append event
                        this.element.trigger( this.name + ':append' );
                    }
                    // am i scrolled down with some space to bottom edge?
                    onEdge = this.infinite.relative.down + this.options.infiniteSize / 5 >= this.infinite.cache.length;
                    // am i able to load some more?
                    isMaxLength = this.infinite.cache.length >= this.options.infiniteMax;
                    // if onEdge, isMaxLength and not loading
                    if ( onEdge && isMaxLength && !this.infinite.loading.down ) {
                        // extend params
                        params = $.extend( { max: this.options.infiniteSize }, this.options.infiniteData );
                        // set offset to next cache item
                        params.offset = this.infinite.cache.length - 1;
                        // set loading to true to prevent double loading
                        this.infinite.loading.down = true;
                        $.ajax(
                            {
                                url    : this.options.infiniteUrl,
                                global : false,
                                data   : params,
                                success: function ( data ) {
                                    var index = params.offset,
                                        // convert
                                        list = me.convert( data );
                                    // add to cache
                                    $.each( list, function () {
                                        if ( !me.infinite.cache[ index ] )
                                            me.infinite.cache[ index ] = this;
                                        index++;
                                    } );
                                    // set loading to false
                                    me.infinite.loading.down = false;
                                }
                            }
                        );
                    }

                    // scrolling up then
                } else {

                    // is space to top small enough so i am able to append
                    space = this.infinite.relative.up - this.options.infiniteBuffer <= this.infinite.last.up;
                    // if space and previous element in cache
                    if ( space && this.infinite.cache[ this.infinite.index.up ] && this.options.infiniteStop.up <= this.infinite.index.up ) {
                        i = 0;
                        while ( i < this.options.infiniteAppend ) {
                            i++;
                            // subtract from current
                            this.infinite.current.up--;
                            // subtract from last
                            this.infinite.last.up--;
                            // subtract from index
                            this.infinite.index.up--;
                            // subtract from relative
                            this.infinite.relative.up--;
                            // prepend previous cache item to element
                            this.element.prepend( $( this.infinite.cache[ this.infinite.index.up ] ) );
                            // add to infinite height
                            this.infinite.height += $( this.infinite.cache[ this.infinite.index.up ] ).height();
                        }

                        // trigger prepend event
                        this.element.trigger( this.name + ':prepend' );
                    }
                    // get first key in complete cache
                    for ( var firstKey in this.infinite.cache ) break;
                    // check if i am reaching top so far to ask for more cache
                    onEdge = this.infinite.current.up - firstKey <= this.options.infiniteSize / 5;
                    // set params
                    params = this.options.infiniteData;
                    params.offset = Math.max( 0, me.infinite.current.up - me.options.infiniteSize );
                    params.max = this.options.infiniteSize;
                    // if oneEdge max up is not reached and is not loading
                    if ( onEdge && !this.infinite.max.up && !this.infinite.loading.up ) {
                        if ( params.offset == 0 )
                        // set max up to true to prevent more cache with 0 offset
                            this.infinite.max.up = true;

                        // set loading for prevent
                        this.infinite.loading.up = true;
                        $.ajax( {
                            url    : this.options.infiniteUrl,
                            data   : params,
                            success: function ( data ) {
                                var index = params.offset,
                                    // convert
                                    list = me.convert( data );
                                // add to cache
                                $.each( list, function () {
                                    if ( !me.infinite.cache[ index ] )
                                        me.infinite.cache[ index ] = this;
                                    index++;
                                } );
                                if ( index != params.offset )
                                    me.infinite.loading.up = false;
                            }
                        } );
                    }

                }
            }

            // function to trigger
            function triggerEvent( fn, type ) {
                var event = $.Event( {
                    type       : fn.name + ':' + type,
                    FancyScroll: fn,
                    y          : fn.y
                } );
                fn.element.trigger( event );
            }

            // if option is in percent
            // check if i reached this position
            // and trigger the event for it
            if ( this.options.beforeTop.toString().indexOf( '%' ) > 0 ) {
                if ( this.element.scrollTop() * 100 / this.element.wtsY <= parseInt( this.options.beforeTop ) ) {
                    triggerEvent( this, 'top' );
                }
            } else {
                if ( this.element.scrollTop() <= 0 + this.options.beforeTop ) {
                    triggerEvent( this, 'top' );
                }
            }
            if ( this.options.beforeBottom.toString().indexOf( '%' ) > 0 ) {
                if ( this.element.scrollTop() * 100 / this.element.wtsY >= 100 - parseInt( this.options.beforeBottom ) ) {
                    triggerEvent( this, 'bottom' );
                }
            } else {
                if ( this.element.scrollTop() >= this.element.wtsY - this.options.beforeBottom ) {
                    triggerEvent( this, 'bottom' );
                }
            }
            // trigger scroll event and direction event
            this.animation.running = false;
            this.element.trigger( this.name + ':scroll' );
            this.element.trigger( this.name + ':' + this.scrollDirection );

        },

        // you can use this function to convert your data
        // remember that text can not be displayed so please wrap it in elements
        // you can access it by VARNAME.convert || $(element).data('FancyScroll').convert
        convert     : function ( data ) {
            "use strict";
            var list = [];
            $.each( $( data ), function () {
                if ( this.nodeName.toString() != '#text' ) {
                    list.push( this )
                }

            } );
            return list;
        },

        // get new cache
        // built in for searching in lists
        getCache    : function ( params ) {
            var me = this,
                p = [];
            //set initparams and second params for first max and the rest of the cache
            p[ 0 ] = $.extend( {}, params, { max: this.options.infiniteMax } );
            p[ 1 ] = $.extend( {}, params, {
                offset: this.options.infiniteMax,
                max   : this.options.infiniteSize - this.options.infiniteMax
            } );
            // first load cache to be faster after appended
            $.ajax( {
                url    : this.options.infiniteUrl,
                global : false,
                data   : p[ 1 ],
                success: function ( data ) {
                    var index = me.options.infiniteMax,
                        list = me.convert( data );
                    $.each( list, function () {
                        if ( !me.infinite.cache[ index ] )
                            me.infinite.cache[ index ] = this;
                        index++;
                    } );
                }
            } );

            // get first max and append it after converting
            $.ajax( {
                url    : this.options.infiniteUrl,
                global : false,
                data   : p[ 0 ],
                success: function ( data ) {
                    me.initInfinite();

                    me.element.html( '' );
                    me.infinite.cache = me.convert( data );
                    for ( var i in me.infinite.cache ) {
                        me.element.append( $( me.infinite.cache[ i ] ) );

                    }

                    // set current
                    me.infinite.current.down = parseInt( i );
                    //set index
                    me.infinite.index.down = parseInt( i );
                    // set count
                    me.infinite.count = parseInt( i );
                    // set last
                    me.infinite.last.down = parseInt( i );

                    // resize
                    me.resize();
                    // trigger events
                    me.element.trigger( me.name + ':prepend' );
                    me.element.trigger( me.name + ':newCache' );
                }
            } );
        },

        debug: function () {
            if ( this.options.debug )
                console.log( arguments )
        }
    };

    window.FancyScroll.options = {
        scrollValue    : 100, // how many pixel to scroll?
        scrollSpeed    : 10, // how fast do you want to scroll?
        margin         : 0, // want a margin?
        beforeTop      : 0, // how mouch before reaching top to trigger Top-Event? 100 || '20%'
        beforeBottom   : 0, // how mouch before reaching bottom to trigger Bottom-Event? 100 || '20%'
        cursorMinHeight: false, // min height of the cursor?
        cursorWidth    : false, // how big you want the railcursor?
        cursorColor    : false, // which colour should it have?
        railColor      : false, // which colour should the rail have?
        mobile         : false, // replace in mobile? events will fired if you dont want to replace
        selectEnabled  : true, // enable scrolling while selecting?
        autoHide       : true, // hide the scroller automaticly?
        preventDefault : true, // want to prevent outer scrollbar on scrolling in inner container?
        borderColor    : false, // color of the border frm cursor
        borderRadius   : false, // border-radius from the cursor
        smooth         : true, // want smooth scroll?
        linear         : false, // linear scrolling or scroll as fast as mousewheel
        x              : false, // show y-rail?
        y              : true, // show x-rail?
        debug          : false, // want to log all what can happen?
        theme          : 'default', // which them to apply?
        cursorCursor   : 'pointer', // do you want a cursor?
        hideMode       : 'fade', // which mode do you prefer?
        infiniteUrl    : '', // url which is called
        infiniteSize   : 250, // cachesize
        infiniteStart  : 0, // which strtpoint (offset)
        infiniteMax    : 20, // how much max displayed
        infiniteData   : {}, // parameters to add
        infiniteBuffer : 5, // how much to buffer?
        infiniteAppend : 1, // how much to append/prepend?
        infiniteStop   : { up: 0, down: false } // stop at this points when scrolling
    }

})();
