/*
* Lazyload component for jQuery ( AMD Module )
*
* Copyright (c) 2013 Yiguo Chan
* Released under the MIT Licenses
*
* Docs : https://github.com/chenmnkken/ecope/wiki/Lazyload-%E5%BB%B6%E8%BF%9F%E5%8A%A0%E8%BD%BD
* Mail : chenmnkken@gmail.com
* Date : 2013-10-27
*/

define(function(){

'use strict';

// 修复jQuery在取offset时如果是在一个含有滚动条的容器出错的问题
$.fn.__offset__ = function(){
    var offset = { top : 0, left : 0 },
        elem = this[0];

    if( !elem || elem.nodeType !== 1 ){
        return offset;
    }

    return {
        top : elem.offsetTop,
        left : elem.offsetLeft
    };
};

var easyLazyload = {
    
    triggerHandle : function( o, offset, type ){
        var threshold = o.threshold,
            scroll = o.scroll,
            currentOffset;
            
        currentOffset = o.isReverse ? offset.offsetReverse : offset.offsetForward;
        return currentOffset >= ( scroll - threshold ) && currentOffset <= ( o.size + scroll + threshold )
    },    
    
    load : {
        img : function( o, elem, isScroll ){
            var attrName = o.attrName,
                lazysrc;
            
            if( elem[0].tagName !== 'IMG' ){
                return;
            }
            
            lazysrc = elem.attr( attrName );
            
            if( !lazysrc ){
                return;
            }
            
            // 只在触发滚动事件时才会使用动画效果
            if( o.effects && isScroll ){
                elem.css( 'visibility', 'hidden' ).one( 'load', function(){
                    easyLazyload.effects[ o.effects ]( o, this ); 
                });
            }

            elem[0].src = lazysrc;
            // 移除缓存
            elem.removeData( 'offset' ).removeAttr( attrName );               
        },
        
        dom : function( o, elem ){
            var val = elem.val(),
                parent;
                
            if( elem[0].tagName !== 'TEXTAREA' ){
                return;
            }
            
            parent = elem.parent();
            parent.html( val );
            parent.trigger( 'likeload' );
            elem.remove();
        }
    }
    
};

easyLazyload.effects = {

    fade : function( o, target ){
        $( target ).css({ 
                display : 'none',
                visibility : '' 
            })
            .fadeIn( o.duration );        
    }

};

// 以左右滑动、上下滑动效果显示图片
$.each({
    slideX : [ 'left', 'width' ],
    slideY : [ 'top', 'height' ]
}, function( name, val ){
    var posName = val[0],
        sizeName = val[1];

    easyLazyload.effects[ name ] = function( o, target ){
        target = $( target );
        var parent = target.parent(),
            from = {},
            to = {},            
            complete = function(){
                target.css({
                    position : '',
                    top : '',
                    left : ''
                });
                
                parent.css({
                    overflow : '',
                    position : ''
                });
            };
            
        from[ posName ] = '-' + target[ sizeName ]() + 'px';
        to[ posName ] = '0px';
            
        parent.css({
            overflow : 'hidden',
            position : 'relative'
        });
        
        target.css({
                position : 'relative',
                visibility : '' 
            })
            .css( from )
            .animate( to, o.duration, complete );
    };
    
});

var Lazyload = function( target, options ){
    target = $( target );
    options = options || {};
    
    if( !target.length ){
        return;
    }
    
    var o = $.extend({
            type       :   'img',           // String        延迟加载的类型 img : 图片 dom : dom元素
            trigger    :   'scroll',        // String        触发加载的事件类型
            container  :   window,          // String||Element|jQuery Object 设置在某个容器内滚动
            axis       :   'y',             // Boolean       是否纵向滚动触发 x : 横向滚动 y : 纵向
            threshold  :   0,               // Number        还有多少距离触发加载的临界值   
            duration   :   400,             // Number        动画效果的运行时间
            attrName   :   'data-lazysrc'   // String        用于存放在img标签上的自定义特性名        
        }, options ),
        
        isY = o.axis === 'y', 
        $win = $( window ),        
        loadType = o.type,
        container = $( o.container ),   
        elems = $.makeArray( target ), 
        triggerHandle = easyLazyload.triggerHandle,                
        OFFSET = isY ? 'top' : 'left',    
        isScrollEvent = o.trigger === 'scroll',
        isWindow = $.isWindow( container[0] ),
        methodName = isWindow ? 'offset' : '__offset__',
        triggerElem = isScrollEvent ? container : target,
        SIZE = isY ? 'height' : 'width',
        OUTERSIZE = isY ? 'outerHeight' : 'outerWidth',
        SCROLL = isY ? 'scrollTop' : 'scrollLeft';  
        
    if( !elems || !elems.length ){
        return;
    }
    
    o.originalScroll = 0;
    o.isReverse = null;
        
    var load = function( e ){
        var i = 0,
            isCustom = false,
            isTrigger, offset, offsetForward, $elem, parent, eventType;
            
        o.scroll = container[ SCROLL ]();
        o.size = container[ SIZE ]();        
        o.isReverse = o.scroll < o.originalScroll ? true : false;
        o.originalScroll = o.scroll;
            
        if( e ){
            eventType = e.type;
            if( eventType !== 'scroll' && eventType !== 'resize' ){
                isCustom = true;
            }
        }
        
        for( ; i < elems.length; i++ ){         
            $elem = $( elems[i] );
            
            if( !isCustom ){
                offset = $elem.data( 'offset' );
                
                if( offset === undefined ){
                    parent = $elem.parent();
                    offsetForward = parent[ methodName ]()[ OFFSET ];                
                    
                    offset = {
                        offsetForward : offsetForward,
                        offsetReverse : offsetForward + parent[ OUTERSIZE ]()
                    };

                    $elem.data( 'offset', offset );
                }
                
                isTrigger = triggerHandle( o, offset, eventType );  
            }
            else{
                isTrigger = isCustom;
            }
            
            // 开始加载
            if( isTrigger ){
                isTrigger = false;                
                easyLazyload.load[ loadType ]( o, $elem, eventType === 'scroll' );
                // 从DOM数组中移除该DOM    
                elems.splice( i--, 1 );
            }
        }
        
        // 所有的图片加载完后卸载触发事件
        if( !elems.length ){
            container.off( eventType + '.lazyload' );            
            $win.off( 'resize.lazyload' );
            elems = null;
        }
    };

    triggerElem[ isScrollEvent ? 'on' : 'one' ]( o.trigger + '.lazyload', load );
    
    if( isWindow ){
        $win.on( 'resize.lazyload', load );    
    }

    if( isScrollEvent ){
        load({ type : 'scroll' });
    }
    
    o.target = target;
    this.__o__ = o;
};

Lazyload.prototype = {
    
    on : function( type, fn ){
        if( !this.__o__ ){
            return this;
        }
        
        var o = this.__o__,
            self = this,
            target = o.target,
            eventType = o.type === 'img' ? type : 'like' + type,
            bindEvent = function( e ){
                $( this ).off( eventType );
                e.type = type;
                fn.call( self, e );
                e.stopPropagation();            
            };
            
            
        if( o.type === 'img' ){        
            target.on( eventType, bindEvent );
        }
        else{
            target.each(function(){
                $( this ).parent().on( eventType, bindEvent );
            });
        }
        
        return this;
    }
    
};

if( !$.ui ){
    $.ui = {};
}

$.ui.Lazyload = Lazyload;

});