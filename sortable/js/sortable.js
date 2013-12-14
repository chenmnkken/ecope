/*
* Sortable component for jQuery ( AMD Module )
*
* Copyright (c) 2013 Yiguo Chan
* Released under the MIT Licenses
*
* Docs : https://github.com/chenmnkken/ecope/wiki/Sortable-%E6%8B%96%E5%8A%A8%E6%8E%92%E5%BA%8F
* Mail : chenmnkken@gmail.com
* Date : 2013-10-27
*/
define(['../../drop/js/drop'], function(){

'use strict';

var defaults = {       
    connect    :   null,      // String 允许符合选择器匹配的拖放排序列表插入到当前拖放排序列表中
    disable    :   null       // String 禁止拖拽列表中符合该选择器匹配的子元素进行拖放排序操作
};

var Drag = $.ui.Drag,
    Drop = $.ui.Drop,

    easySortable = {

        start : function( e ){
            $( e.drag ).css({
                opacity : '0.3',
                zIndex : '10000'
            });        
        },
        
        end : function( e ){
            var dragElem = $( e.drag );
            dragElem.css( 'zIndex', '' )
                .animate({ opacity : 1 }, function(){
                    dragElem.css( 'opacity', '' );
                });    
        },
        
        enter : function( o, e ){
            var dragElem = e.drag,
                dropElem = e.drop,
                dragParent = dragElem.parentNode,
                $drag = $( dragElem ),
                $drop = $( dropElem ),
                dragIndex = $drag.index(),
                dropIndex = $drop.index(),
                connect = $drop.data( 'sortConnect' ),
                isPrev = false,
                sibling;
                
            if( dropElem.parentNode === dragParent ){          
                // 如果是非相邻的2个元素进行排序，需要先记录drop元素的兄弟元素    
                if( o.drops.length > 2 && Math.abs(dragIndex - dropIndex) > 1 ){
                    sibling = $drop.next();
                    
                    if( !sibling.length ){
                        sibling = $drop.prev();
                        isPrev = true;
                    }
                }
                
                $drag[ dragIndex < dropIndex ? 'before' : 'after' ]( dropElem );
                
                // 根据drop元素的兄弟元素的位置来插入drag元素
                if( sibling ){
                    sibling[ isPrev ? 'after' : 'before' ]( dragElem ); 
                }
            }
            else if( connect && Drop.filter(dragParent, connect) ){
                $drop.before( dragElem );
                $drag.data( 'sortConnect', connect );
            }
            else{
                return;
            }
            
            // drop元素的位置变更后需要重新更新dropCache中的位置值
            Drop.refresh( $drop );
            o.target.trigger( 'moved', [ dragElem, dropElem ]);
        }

    };

var Sortable = function( target, options ){
    target = $( target ).eq( 0 );
    options = options || {};
    
    if( !target.length ){
        return;
    }
    
    var o = $.extend( {}, defaults, options ),        
        elems = target.children(),
        connect = o.connect,
        drags = [],
        drops = [],
        i = 0,
        len;
        
    o.drags = drags;
    o.drops = drops;    
    o.target = target;

    elems.each(function(){
        var elem = $( this );
        if( !o.disable || !elem.is(o.disable) ){        
            drags.push( 
                new Drag( this, {
                    refresh : false,
                    proxy : true
                }) 
            );
            
            drops.push(
                new Drop( this )
            );
            
            if( connect ){
                elem.data( 'sortConnect', connect );
            }
        }
    });

    $.each( drags, function( i, drag ){                    
        drag.on( 'dragstart', easySortable.start )
            .on( 'dragend', easySortable.end );

        drops[i].on( 'dropenter', function( e ){
            easySortable.enter( o, e );
        });
    });
    
    this.__o__ = o;
};

Sortable.prototype = {
    
    destroy : function(){
        if( !this.__o__ ){
            return;
        }
        
        var o = this.__o__;
        
        o.drags.forEach(function( drag, i ){
            drag.destroy();
            o.drops[i].destroy();
        });
        
        o.target.off( 'moved' );        
        o = o.drags = o.drops = null;
        delete this.__o__;
    },
    
    on : function( type, fn ){
        if( !this.__o__ ){
            return;
        }
        
        var self = this;        
        this.__o__.target.on( type, function( e, drag, drop ){
            e.drag = drag;
            e.drop = drop;
            e.type = type;
            fn.call( self, e );
            e.stopPropagation();
        });
        
        return this;
    },
    
    un : function( type ){
        if( this.__o__ ){
            this.__o__.target.off( type );
        }
        
        return this;
    }
};

if( !$.ui ){
    $.ui = {};
}

$.ui.Sortable = Sortable;

});