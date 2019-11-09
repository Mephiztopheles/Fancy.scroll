( function ( $ ) {

    Fancy.require( {
        jQuery: false,
        Fancy : "1.0.2"
    } );

    let i                = 1,
        NAME             = "FancyScroll",
        VERSION          = "1.1.1",
        timer            = 0,
        mouse            = {},
        logged           = false,
        MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

    class FancyScroll {

        /**
         * FancyScroll
         * @param {Object} element
         * @param {Object} settings
         */
        constructor( element, settings ) {

            const el = $( element ) [ 0 ].nodeName === "#document" ? $( 'body' ) : $( element );

            this.id       = i;
            this.name     = NAME;
            this.version  = VERSION;
            this.element  = el;
            this.disabled = false;
            this.isBody   = el [ 0 ].nodeName === "#document" || el [ 0 ].nodeName === 'BODY';
            this.wrapper  = el.parent();
            i++;

            if ( !logged ) {

                logged = true;
                Fancy.version( this );
            }

            this.settings  = $.extend( {}, Fancy.settings [ NAME ], settings );
            this.direction = {};

            this.init();
            this.addEventListener();
            this.hideCursor();
            this.resize();
            this.position();

            return this;
        }

        init() {

            this.y        = $( '<div/>', {
                id   : this.name + '-y-' + this.id,
                class: this.name + '-rail ' + this.name + '-y-rail'
            } );
            this.y.cursor = $( '<div/>', {
                id   : this.name + '-y-cursor-' + this.id,
                class: this.name + '-cursor'
            } );

            this.x        = $( '<div/>', {
                id   : this.name + '-x-' + this.id,
                class: this.name + '-rail ' + this.name + '-x-rail'
            } );
            this.x.cursor = $( '<div/>', {
                id   : this.name + '-x-cursor-' + this.id,
                class: this.name + '-cursor'
            } );

            this.left = this.element.scrollLeft();
            this.top  = this.element.scrollTop();

            // add classes and make unscrollable
            this.element.addClass( this.name + '-element' );
            if ( this.settings.mobile ? true : !Fancy.mobile ) {
                this.element.css( {
                    overflow: 'hidden'
                } );
            } else {
                this.element.css( {
                    overflow: 'auto'
                } );
            }
            if ( this.settings.y && this.settings.mobile ? true : !Fancy.mobile ) {
                this.y.append( this.y.cursor );
                this.wrapper.append( this.y );
            }
            if ( this.settings.x && this.settings.mobile ? true : !Fancy.mobile ) {
                // currently disabled due to uncomplete
                // this.x.append( this.x.cursor );
                // this.wrapper.append( this.x );
            }

            this.y.cursor.css( {
                background  : this.settings.cursorColor,
                position    : 'relative',
                right       : 0,
                border      : ( this.settings.borderColor ? '1px solid ' + this.settings.borderColor : '' ),
                borderRadius: this.settings.borderRadius,
                cursor      : this.settings.cursorCursor
            } ).addClass( this.name + '-theme-' + this.settings.theme + '-cursor' );

            this.x.cursor.css( {
                background  : this.settings.cursorColor,
                position    : 'relative',
                top         : 0,
                border      : ( this.settings.borderColor ? '1px solid ' + this.settings.borderColor : '' ),
                borderRadius: this.settings.borderRadius,
                cursor      : this.settings.cursorCursor
            } ).addClass( this.name + '-theme-' + this.settings.theme + '-cursor' );

            this.y.css( {
                position       : ( this.isBody ? 'fixed' : 'absolute' ),
                backgroundColor: this.settings.railColor,
                width          : this.settings.cursorWidth
            } ).addClass( this.name + '-theme-' + this.settings.theme + '-rail' );
            this.x.css( {
                position       : ( this.isBody ? 'fixed' : 'absolute' ),
                backgroundColor: this.settings.railColor,
                width          : this.settings.cursorWidth
            } ).addClass( this.name + '-theme-' + this.settings.theme + '-rail' );
        }

        showCursor( rail ) {

            // in case it is not disabled and there is a ratio AND if my rails is Y
            if ( !this.disabled && this.ratioY > 1 && ( !rail || rail === 'y' ) ) {

                this.y.removeClass( this.name + '-mode-' + this.settings.hideMode + '-out' ).addClass( this.name + '-mode-' + this.settings.hideMode + '-in' );

                // if i am allowed to hide, and i'm not holding the mouse over the rail and i'm not dragged, hide the cursor after 1 min
                if ( this.settings.autoHide ) {

                    this.delay( () => {
                        if ( !this.y.cursor.active && !this.y.cursor.dragged )
                            this.hideCursor();
                    }, 1000 );
                }
            }

            // in case it is not disabled and there is a ratio AND if my rails is X
            if ( !this.disabled && this.ratioX > 1 && ( !rail || rail === 'x' ) ) {

                this.x.removeClass( this.name + '-mode-' + this.settings.hideMode + '-out' ).addClass( this.name + '-mode-' + this.settings.hideMode + '-in' );

                // if i am allowed to hide, and i'm not holding the mouse over the rail and i'm not dragged, hide the cursor after 1 min
                if ( this.settings.autoHide ) {

                    this.delay( () => {
                        if ( !this.x.cursor.active && !this.y.cursor.dragged )
                            this.hideCursor();
                    }, 1000 );
                }
            }
            return this;
        }

        hideCursor() {

            // check again if i am enabled
            if ( !this.disabled ) {

                // remove the animation classes (css)
                this.y.removeClass( this.name + '-mode-' + this.settings.hideMode + '-in' ).addClass( this.name + '-mode-' + this.settings.hideMode + '-out' );
                this.x.removeClass( this.name + '-mode-' + this.settings.hideMode + '-in' ).addClass( this.name + '-mode-' + this.settings.hideMode + '-out' );
            }

            return this;
        }

        disable() {

            // hide me and disable me
            this.hideCursor();
            this.disabled = true;

            // hide me complete to prevent visibility
            this.y.hide().removeClass( this.name + '-mode-' + this.settings.hideMode + '-in' ).addClass( this.name + '-mode-' + this.settings.hideMode + '-in' );
            this.x.hide().removeClass( this.name + '-mode-' + this.settings.hideMode + '-in' ).addClass( this.name + '-mode-' + this.settings.hideMode + '-in' );
            return this;
        }

        enable() {

            this.disabled = false;
            // enable me and removy my display style
            this.y.css( 'display', '' );
            this.x.css( 'display', '' );
            return this;
        }

        resize() {

            // other behaviour for body
            // get WayToScroll
            if ( this.isBody )
                this.element.wtsY = this.element [ 0 ].scrollHeight - window.innerHeight;
            else
                this.element.wtsY = this.element [ 0 ].scrollHeight - this.element.outerHeight();

            // other behaviour for body
            // get WayToScroll
            if ( this.isBody )
                this.element.wtsX = this.element [ 0 ].scrollWidth - window.innerWidth;
            else
                this.element.wtsX = this.element [ 0 ].scrollWidth - this.element.outerWidth();


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
                height   : this.y.height() - ( this.y.height() * ( this.element.wtsY / this.element [ 0 ].scrollHeight ) ),
                minHeight: this.settings.cursorMinHeight
            } );
            this.x.cursor.css( {
                width   : this.element.outerWidth() - ( this.element.outerWidth() * ( this.element.wtsX / this.element [ 0 ].scrollWidth ) ),
                minWidht: this.settings.cursorMinHeight
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
        }

        destroy() {

            // remove class
            this.element.removeClass( this.name + '-element' );
            // reset overflow and unbind events
            this.element.css( 'overflow', '' ).unbind( '.' + this.name );
            $( window ).unbind( '.' + this.name );
            // reset cursor
            $( 'html' ).css( {
                cursor: ''
            } );
            //re move rails
            this.y.remove();
            this.x.remove();
        }

        addEventListener() {

            let lastY = 0;

            this.element.on( 'mouseenter.' + this.name, () => {

                if ( !this.disabled ) {

                    // add class hovered
                    this.y.addClass( 'hovered' );
                    this.showCursor();
                }
            } ).on( 'mouseleave.' + this.name, () => {
                // remove class hovered
                this.y.removeClass( 'hovered' );
            } ).on( "touchstart." + this.name, function ( e ) {
                lastY = e.originalEvent.touches [ 0 ].clientY;
            } );

            const doScroll = ( e ) => {

                if ( !this.disabled ) {

                    if ( this.settings.mobile ? true : !Fancy.mobile ) {

                        let delta = 0;
                        if ( !e )
                            e = window.event;
                        else
                            e = e.originalEvent;

                        if ( e.wheelDelta )
                            delta = e.wheelDelta / 120;
                        else if ( e.detailX || e.detailY )
                            delta = -( e.detailX || e.detailY ) / 3;

                        let closest = $( e.target ).closest( '.' + this.name + '-element' ),
                            up      = delta > 0;

                        // if i am prevented and i am body and closest is not this element -> dont scroll
                        if ( this.settings.preventDefault && ( closest.length && !closest.is( this.element ) ) ) {

                            this.debug( 'has fancyscroll' );

                            if ( up && closest.data( 'FancyScroll' ).infinite && closest.data( 'FancyScroll' ).infinite.last.up ) {

                                this.debug( 'the ' + this.name + '-element has infiniteScroll, is currently on way up and is not on top yet' );
                                return true;
                            }

                            if ( up && closest.scrollTop() ) {

                                this.debug( 'the ' + this.name + '-element is currently on way up and is not on top yet' );
                                return;

                            } else if ( !up && closest.scrollTop() < closest [ 0 ].scrollHeight - closest.outerHeight() ) {

                                this.debug( 'the ' + this.name + '-element is currently on way down and is not on bottom yet' );
                                return true;
                            }
                        }

                        // if i am prevented and closest scrollable element is not this.element and closest scrollable element is not document -> dont scroll
                        /*if( this.settings.preventDefault && ( !scrollable.is( this.element ) && !scrollable.is( $( document ) ) ) ) {
                            this.debug( 'scrollable parent' );
                            if( up && scrollable.scrollTop() ) {
                                this.debug( 'the container, the mouse is in, is currently on way up and didnt stop on top' );
                                return;
                            } else if( !up && scrollable.scrollTop() < scrollable [ 0 ].scrollHeight - scrollable.outerHeight() ) {
                                this.debug( 'the container, the mouse is in, is currently on way down and didnt stop on bottom' );
                                return true;
                            }
                        }*/
                        if ( e.type === "touchmove" ) {

                            // get mobile touch event
                            let currentY = e.touches && e.touches [ 0 ].clientY;
                            up           = currentY >= lastY;

                            if ( up ) {

                                if ( this.top ) {

                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    // SCROLLING UP
                                    this.scrollTo( this.left, this.top - ( currentY - lastY ) );
                                }
                            } else {

                                if ( this.top < this.element[ 0 ].scrollHeight - this.element.outerHeight() ) {

                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    // SCROLLING DOWN
                                    this.scrollTo( this.left, this.top + ( lastY - currentY ) );
                                }
                            }

                            lastY = currentY;

                        } else {
                            // get direction by wheelDelta or detail
                            if ( up ) {

                                if ( this.top ) {

                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    // SCROLLING UP
                                    this.scrollTo( this.left, this.top - this.settings.scrollValue * delta );
                                }
                            } else {

                                if ( this.top < this.element[ 0 ].scrollHeight - this.element.outerHeight() ) {

                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    // SCROLLING DOWN
                                    this.scrollTo( this.left, this.top + this.settings.scrollValue * -delta );
                                }
                            }
                        }
                    } else {
                        this.scrollEvents();
                    }
                } else {
                    e.preventDefault();
                }
            };

            this.element.on( 'DOMMouseScroll.' + this.name + ' mousewheel.' + this.name + ' MozMousePixelScroll.' + this.name + ' touchmove.' + this.name, doScroll );
            /** IE/Opera. */
            this.element [ 0 ].onmousewheel = this.element [ 0 ].onmousewheel = doScroll;

            this.y.on( 'mouseenter.' + this.name, () => {

                // add class hovered and stay
                this.y.addClass( 'hovered' );
                this.y.cursor.active = true;
                this.showCursor();

            } ).on( 'mouseleave.' + this.name, () => {

                // remove class hovered
                this.y.removeClass( 'hovered' );
                this.y.cursor.active = false;
            } );

            this.y.on( "click." + this.name, ( e ) => {

                e.preventDefault();
                e.stopPropagation();
                // coming soon
                if ( e.target === this.y[ 0 ] ) {
                    // (offset - half cursor) * 100 / height
                    this.scrollTo( this.left, ( this.element[ 0 ].scrollHeight * Math.min( 100, Math.max( 0, ( e.offsetY - this.y.cursor.height() / 2 ) * 100 / ( this.y.height() ) ) ) / 100 ) );
                }
            } );

            // cursor grab event
            this.y.cursor.on( 'mousedown.' + this.name, ( e ) => {

                e.preventDefault();
                e.stopPropagation();
                mouse                 = {};
                mouse.start           = e.clientY;
                mouse.old             = e.clientY;
                this.y.cursor.dragged = true;
                this.y.cursor.active  = true;
                $( 'html' ).css( {
                    cursor: this.settings.cursorCursor
                } );

                mouse.wts      = {};
                mouse.wts.up   = mouse.start - parseInt( this.y.cursor.css( 'top' ) ) - 2;
                mouse.wts.down = mouse.start + this.y.wts - parseInt( this.y.cursor.css( 'top' ) ) + 2;
                // calculate ways and set cursor for all and prevent selection

                $( document, 'body' ).on( 'selectstart.' + this.name, function ( event ) {
                    "use strict";
                    event.preventDefault();
                } );
            } );

            $( window ).on( 'mousemove.' + this.name, ( e ) => {


                // just if im dragged
                if ( this.y.cursor.dragged ) {

                    let wts;
                    // other behaviour for !chrome and body
                    // calculate scroll
                    if ( this.isBody && !Fancy.isChrome )
                        wts = this.wrapper.scrollTop() + ( ( this.element.wtsY / this.y.wts ) * ( e.clientY - mouse.old ) );
                    else
                        wts = this.element.scrollTop() + ( ( this.element.wtsY / this.y.wts ) * ( e.clientY - mouse.old ) );

                    this.scrollTo( this.left, Math.round( wts ) );

                    // resize but dont reposition
                    this.resize();

                    // set old position for another calculation
                    if ( e.clientY >= mouse.wts.up && e.clientY <= mouse.wts.down ) {
                        mouse.old = e.clientY;
                    }
                }
            } );

            $( window ).on( 'mouseup.' + this.name + ' touchend.' + this.name, () => {

                // unbind selection
                $( document ).unbind( 'selectstart.' + this.name );
                // reset cursor
                $( 'html' ).css( {
                    cursor: ''
                } );
                // destroy mouse
                mouse                 = {};
                this.y.cursor.active  = false;
                this.y.cursor.dragged = false;
            } );

            // create an observer instance
            if ( MutationObserver ) {

                const observer = new MutationObserver( ( mutations ) => {

                    mutations.forEach( ( mutation ) => {

                        this.resize();
                        this.position();
                    } );
                } );

                // pass in the target node, as well as the observer options
                observer.observe( this.element [ 0 ], {
                    subtree          : false,
                    attributeOldValue: false,
                    attributes       : true,
                    childList        : true,
                    characterData    : true
                } );
            }

            this.element.on( 'DOMAttrModified', ( e ) => {

                if ( e.attrName === 'style' ) {

                    this.resize();
                    this.position();
                }
            } );
        }

        position() {

            this.y.css( {
                left: this.element.position().left - this.settings.margin + this.element.outerWidth() - this.y.width() - parseInt( this.element.css( 'borderRight' ) || 0 ) + parseInt( this.element.css( 'marginLeft' ) )
            } );

            this.x.css( {
                top: this.element.position().top - this.settings.margin + this.element.outerHeight() - this.x.height() + parseInt( this.element.css( 'marginTop' ) )
            } );

            return this;
        }

        /**
         * scrolling to x-position
         * @param {Number} [x]
         * @param {Number} [y]
         * @returns {FancyScroll}
         */
        scrollTo( x, y ) {

            if ( x < 0 )
                x = 0;

            if ( y < 0 )
                y = 0;

            if ( x > this.element.wtsX )
                x = this.element.wtsX;

            if ( y > this.element.wtsY )
                y = this.element.wtsY;

            // define scrollDirection to see where it goes
            if ( x > this.left )
                this.direction.x = 'right';
            else if ( x < this.left )
                this.direction.x = 'left';
            else
                this.direction.x = false;

            if ( y > this.top )
                this.direction.y = 'down';
            else if ( y < this.top )
                this.direction.y = 'up';
            else
                this.direction.y = false;

            this.showCursor();
            if ( this.settings.smooth ) {

                const speed = this.settings.scrollValue / this[ type ][ 0 ].scrollHeight * 10000;
                this.element.stop( true ).animate( { scrollTop: y }, speed, () => {

                    // move cursor
                    this.moveCursor();
                    // resize the scroller
                    this.resize();
                    // and show the cursor
                    this.showCursor();
                    // fire scrollevents
                    if ( this.direction.y )
                        this.scrollEvents();
                } );
            } else {

                this.element.scrollTop( y );
                // move cursor
                this.moveCursor();
                // fire scrollevents
                if ( this.direction.y )
                    this.scrollEvents();
            }

            this.top = y;


            this.element.scrollLeft( x );
            this.left = x;
            // fire scrollevents
            if ( this.direction.x )
                this.scrollEvents();

            return this;
        }

        moveCursor() {

            const rx = ( this.y.height() - this.y.cursor.outerWidth() ) / this.element.wtsX,
                  ry = ( this.y.height() - this.y.cursor.outerHeight() ) / this.element.wtsY;

            // stop cursor and reposition
            this.y.cursor.css( {
                top: this.element.scrollTop() * ry
            } );
            // stop cursor and reposition
            this.x.cursor.css( {
                left: this.element.scrollLeft() * rx
            } );

            return this;
        }

        delay( callback, ms ) {

            clearTimeout( timer );
            timer = setTimeout( () => callback.call( this ), ms );
        }

        scrollEvents() {

            // if option is in percent
            // check if i reached this position
            // and trigger the event for it
            if ( this.settings.beforeTop.toString().indexOf( '%' ) > 0 ) {

                if ( this.element.scrollTop() * 100 / this.element.wtsY <= parseInt( this.settings.beforeTop ) && this.direction.y === "up" )
                    this._triggerEvent( 'top' );

            } else {

                if ( this.element.scrollTop() <= this.settings.beforeTop && this.direction.y === "up" )
                    this._triggerEvent( 'top' );
            }

            if ( this.settings.beforeBottom.toString().indexOf( '%' ) > 0 ) {

                if ( this.element.scrollTop() * 100 / this.element.wtsY >= 100 - parseInt( this.settings.beforeBottom ) && this.direction.y === "down" )
                    this._triggerEvent( 'bottom' );

            } else {

                if ( this.element.scrollTop() >= this.element.wtsY - this.settings.beforeBottom && this.direction.y === "down" )
                    this._triggerEvent( 'bottom' );
            }
            // trigger scroll event and direction event
            this.element.trigger( this.name + ':scroll' );
            this.element.trigger( this.name + ':' + this.scrollDirection );
        }

        _triggerEvent( type ) {

            const event = $.Event( {
                type       : this.name + ':' + type,
                FancyScroll: this,
                y          : this.y,
                x          : this.x
            } );

            this.element.trigger( event );
        };

        debug() {

            if ( this.settings.debug )
                console.log( arguments );
        }
    }

    Fancy.settings [ NAME ] = {
        scrollValue    : 100, // how many pixel to scroll?
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
        smooth         : false, // want smooth scroll?
        linear         : false, // linear scrolling or scroll as fast as mousewheel
        x              : false, // show y-rail?
        y              : true, // show x-rail?
        debug          : false, // want to log all what can happen?
        theme          : 'default', // which them to apply?
        cursorCursor   : 'pointer', // do you want a cursor?
        hideMode       : 'fade' // which mode do you prefer?
    };
    Fancy.scroll            = VERSION;
    Fancy.api.scroll        = function ( settings ) {
        return this.set( NAME, ( el ) => new FancyScroll( el, settings ) );
    };

} )( jQuery );