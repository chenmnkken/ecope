/*
* LikeScrollbar component for jQuery ( AMD Module )
*
* Copyright (c) 2013 Yiguo Chan
* Released under the MIT Licenses
*
* Docs : https://github.com/chenmnkken/ecope/wiki/LikeScrollbar-%E6%BB%9A%E5%8A%A8%E6%9D%A1%E6%A8%A1%E6%8B%9F
* Mail : chenmnkken@gmail.com
* Date : 2013-11-19
*/

define(['../../drag/js/drag'], function(){

'use strict';

var defaults = {
    axis : 'y',
    left : 0,
    top : 0
};

$.fn.wheel = function( type, fn ){
    var eventType = $.browser.mozilla ? 'DOMMouseScroll' : 'mousewheel',        
        fixEvent = function( e ){
            var originalEvent = e.originalEvent,
                event = {};
            
            if( 'wheelDelta' in originalEvent ){
                event.wheelDelta = Math.round( originalEvent.wheelDelta );
            }
            else if( 'detail' in originalEvent ){                
                event.wheelDelta = -originalEvent.detail * 40;
            }

            return event;
        };
        
    if( type === 'on' ){
        this.on( eventType, function( e ){
            var event = $.extend( e, fixEvent(e) );
            fn.call( this, e );
        });
    }
    else if( type === 'off' ){
        this.off( eventType, fn );
    }        
};

var easyScrollbar = {

    create : function( o, height ){
        var isY = o.axis === 'y',
            trackSize = isY ? 'height:100%' : 'width:100%',
            thumbPos = isY ? 'top:0px' : 'left:0px',
            html = '<div class="ecope_likescrollbar" style="position:absolute;">' +
                '<div class="lsb_track" style="position:absolute;top:0px;left:0px;z-index:1;overflow:hidden;' + trackSize + '"></div>' +
                '<div class="lsb_thumb" style="position:absolute;z-index:2;cursor:pointer;overflow:hidden;' + thumbPos + '"></div>' +
            '</div>';
            
        o.scrollbarElem = $( html ).appendTo( document.body );
        o.trackElem = o.scrollbarElem.find( '.lsb_track' );
        o.thumbElem = o.scrollbarElem.find( '.lsb_thumb' );
    },
    
    position : function( o ){
        var isY = o.axis === 'y',
            INNER = isY ? 'innerHeight' : 'innerWidth',
            OUTER = isY ? 'outerWidth' : 'outerHeight',
            SIZENAME = isY ? 'height' : 'width',
            target = o.target,
            offset = target.offset(),
            offsetTop = offset.top,
            offsetLeft = offset.left,
            innerSize = target[ INNER ](),
            outerSize = target[ OUTER ](),
            scrollSize = target[0][ isY ? 'scrollHeight' : 'scrollWidth' ],
            scrollPos = target[0][ isY ? 'scrollTop' : 'scrollLeft' ],
            thumbSize = Math.round( innerSize / scrollSize * innerSize / 2 ),
            cssMap, initPos;
            
        if( innerSize === scrollSize ){
            o.scrollbarElem.remove();
            return false;
        }
        
        if( isY ){
            cssMap = {
                height : innerSize + 'px',
                left : offsetLeft + outerSize - 17 + o.left + 'px',
                top : offsetTop + o.top + 'px'
            };
        }
        else{
            cssMap = {
                width : innerSize + 'px',
                top : offsetTop + outerSize - 17 + o.top + 'px',
                left : offsetLeft + o.left + 'px'
            };
        }        

        o.scrollSize = innerSize - thumbSize;
        o.ratio = ( scrollSize - innerSize ) / o.scrollSize;
        initPos = Math.round( scrollPos / o.ratio );
        
        o.scrollbarElem.css( cssMap );        
        o.thumbElem.css( SIZENAME, thumbSize + 'px' )
            .css( isY ? 'top' : 'left', initPos + 'px' );
            
        return true;
    },
    
    bindWheel : function( o, scrollbar ){
        o.target.wheel( 'on', function( e ){
            var thumbElem = o.thumbElem,
                isY = o.axis === 'y',
                SCROLL = isY ? 'scrollTop' : 'scrollLeft',
                posName = isY ? 'top' : 'left',
                pos = parseInt( thumbElem.css(posName) ),
                distance = 15;
        
            if( e.wheelDelta < 0 ){
                pos += distance;
            }
            else{
                pos -= distance;
            }
            
            pos = pos < 0 ? 0 : 
                pos > o.scrollSize ? o.scrollSize : pos;
            
            thumbElem.css( posName, pos + 'px' );
            this[ SCROLL ] = Math.round( pos * o.ratio );
            scrollbar.scroll = pos;
            o.target.trigger( 'likescroll' );
            e.preventDefault();
        });
    },
    
    bindDrag : function( o, scrollbar ){
        var isY = o.axis === 'y',
            ratio = o.ratio,
            target = o.target,
            elem = target[0];
        
        o.drag = new $.ui.Drag( o.thumbElem, {
            axis : o.axis,
            container : o.scrollbarElem,
            moveHand : false
        });
        
        o.drag.on( 'drag', function(){
                var pos = isY ? this.top : this.left,
                    SCROLL = isY ? 'scrollTop' : 'scrollLeft';
                
                elem[ SCROLL ] = Math.round( pos * ratio );
                scrollbar.scroll = pos;
                target.trigger( 'likescroll' );
            })
            .on( 'dragstart', function(){
                target.trigger( 'likescrollstart' );
            })
            .on( 'dragend', function(){
                target.trigger( 'likescrollend' );
            });
    },

    init : function( o, scrollbar ){
        o.target.css( 'overflow', 'hidden' );
        easyScrollbar.create( o );
        
        if( easyScrollbar.position(o) ){
            easyScrollbar.bindDrag( o, scrollbar );
            easyScrollbar.bindWheel( o, scrollbar );
        }
    }

};

var LikeScrollbar = function( target, options ){
    target = $( target ).eq( 0 );
    options = options || {};
    
    if( !target.length ){
        return;
    }    
    
    var o =  $.extend( {}, defaults, options );        
        
    o.target = target;
    this.__o__ = o;        
    
    easyScrollbar.init( o, this );
};

LikeScrollbar.prototype = {

    resize : function(){
        var o = this.__o__;
        
        o.drag.destroy();
        
        if( easyScrollbar.position(o) ){
            easyScrollbar.bindDrag( o, this );
        }
    },

    destroy : function(){
        if( !this.__o__ ){
            return;
        }    
 
        var o = this.__o__;
        
        o.drag.destroy();
        o.scrollbarElem.remove();        
        
        o.target.css( 'overflow', '' )
            .off( 'likescrollstart likescroll likescrollend' )
            .wheel( 'off' );
        
        this.__o__ = o = null;
        delete this.__o__;
    },

    on : function( type, fn ){
        if( !this.__o__ ){
            return this;
        }
        
        var self = this,
            o = self.__o__;
        
        o.target.on( 'like' + type, function( e ){
            e.type = type;
            e.target = o.scrollbarElem[0];
            fn.call( self, e );
            e.stopPropagation();
        });
        
        return this;
    },
    
    un : function( type ){
        if( this.__o__ ){
            this.__o__.target.off( 'like' + type );
        }
        
        return this;
    }

};

if( !$.ui ){
    $.ui = {};
}

$.ui.LikeScrollbar = LikeScrollbar;

});