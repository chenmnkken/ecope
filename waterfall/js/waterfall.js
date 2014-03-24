/*
* Waterfall( Fixed Width ) component for jQuery ( AMD Module )
*
* Copyright (c) 2013-2014 Yiguo Chan
* Released under the MIT Licenses
*
* Docs : https://github.com/chenmnkken/ecope/wiki/Waterfall-%E7%AD%89%E5%AE%BD%E7%80%91%E5%B8%83%E6%B5%81
* Mail : chenmnkken@gmail.com
* Date : 2014-03-24 
*/

define(function(){

'use strict';

var defaults = {
	colWidth : 252,                      // Number	列宽(包含列的padding)
	container : window,	                 // String|Element|jQuery Object	布局容器，默认为当前页面的window
	create : null,                       // Function	创建单元格的函数，函数的返回值是HTML字符串
	reservedWidth : 20,                  // Number	布局容器中需要预留的宽度
    init : null,                         // Function	瀑布流初始化时执行的回调函数
    load : null,                         // Function	瀑布流用于加载数据的函数
	maxCols : null,                      // Number	最大列数
	maxHeight : 800,                     // Number  单元格的最大高度，大于该高度将对图片进行裁切
    minCols : 2,	                     // Number  最小列数
	spaceY : 14,                         // Number  纵向间距
    specialPosition : null,              // String  瀑布流初始化时添加在瀑布流最左列或最右列的特殊元素方位(left|right)
    serialize : function( data ){        // Function	用于格式化数据的函数
        return data;
    }
};
    
var easyWF = {

    /*
     * 函数节流
     * @param{ Function } 频繁触发的函数
     * @return{ Function } 节流后的函数
     */
    throttle : function( fn ){        
        var timer;
        
        return function(){
            var self = this,
                args = arguments;
                
            clearTimeout( timer );
            timer = setTimeout(function(){
                fn.apply( self, args );
            }, 50 );
        };
    },
    
    /*
     * 初始化瀑布流的高度和间距排序数组
     * @param{ Object } 频繁触发的函数
     */    
    initHeights : function( o ){
        var initHeight = o.initHeight,
            cols = o.cols,
            i = 0,
            index, heights, margins;
        
        heights = o.heights = [];
        margins = o.margins = [];
        
        for( ; i < cols; i++ ){
            heights[i] = 0;
            margins[i] = 0 - initHeight;
        }
        
        if( o.specialPosition ){
            index = o.specialPosition === 'left' ? 0 : cols - 1;
            heights[ index ] = initHeight;
            margins[ index ] = 0;               
        }
    },
        
    /*
     * 计算列的高度
     * - 添加第一组图的时候根据图片高度的累加计算出的高度和列的实际高度做比较
     * - 高度相等时保持累加来计算高度，性能更好
     * - 高度不相等时每次都取列的实际高度
     * @param{ Object } 配置参数
     */       
    getColHeights : function( o ){
        var prevHeights = o.prevHeights,
            heights = o.heights,
            len = heights.length,              
            colElem = o.colElem,
            i = 0,
            height;
            
        o.fixedHeight = true;

        for( ; i < len; i++ ){
            height = prevHeights[i] + colElem.eq( i ).outerHeight();
            
            if( height !== heights[i] ){
                o.fixedHeight = false;
                heights[i] = height;                
            }
        }
    },
    
    /*
     * 获取瀑布流在滚动时加载的scrollTop值
     * @param{ Object } 配置参数
     * @return{ Number } scrollTop值
     */       
    getLoadOffset : function( o ){ 
        o.loadOffset = o.target.outerHeight() + o.targetTop - Math.round( o.containerHeight * 1.5 );    
    },
    
    /*
     * 获取瀑布流在滚动时应该恢复或删除瀑布流的scrollTop值
     * @param{ Object } 配置对象
     * @param{ jQuery Object } 用于计算的组元素
     */           
    getChangeOffset : function( o, elem ){
        var offset = elem.outerHeight() + elem.offset().top;        
        elem.data( 'changeOffset', offset + o.containerHeight / 2 );
    }, 
    
    /*
     * 创建瀑布流的组元素
     */ 
    createGroup : function( o ){        
        return $( '<div class="wf_group"/>' ).appendTo( o.target );
    },
    
    /*
     * 创建瀑布流的列元素，并将其添加到Fragment中
     * @param{ Object } 配置参数
     * @return{ jQuery Object } 列元素
     */ 
    createCol : function( o ){
        var margins = o.margins,
            html = '',
            i = 0;
        
        for( ; i < o.cols; i++ ){
            html += '<ul class="wf_col"' + 
                ( margins[i] ? 'style="margin-top:' + margins[i] + 'px"' : '' ) +
                '/>';
        }
        
        return $( html ).appendTo( o.mainFragment );
    },
    
    /*
     * 获取瀑布流排序数组中最大或最小的元素
     * @param{ Array } 排序数组
     * @param{ Boolean } 最大/最小
     * @return { Array } [ 元素的索引，元素值 ]
     */ 
    getExtreme : function( arr, isMin ){
        var len = arr.length,        
            extreme = arr[0],
            flag = false,
            index = 0,        
            i = 1, 
            item;
            
        for( ; i < len; i++ ){
            item = arr[i];
            flag = isMin ? item < extreme : item > extreme;
            if( flag ){
                extreme = item;
                index = i;
            }
        }
        
        return {
            index : index,
            item : extreme
        };
    },
    
    /*
     * 向瀑布流的列中添加单元格
     * @param{ Object } 配置参数
     * @param{ Object } 缓存
     * @param{ String } 索引值
     */    
    addCell : function( o, data, index ){    
        var cellElem = data.elem || $( o.create(data) ),
            min = easyWF.getExtreme( o.heights, true ),
            height = Math.min( data.height, o.maxHeight ),
            minIndex = min.index;

        if( index !== undefined ){
            o.wfCache[ index ].push({
                height : height,
                elem : cellElem
            });        
        }
        
        o.heights[ minIndex ] = min.item + height + o.spaceY;
        o.colElem.eq( minIndex ).append( cellElem );
    },

    /*
     * 向瀑布流中添加列
     * @param{ Object } 配置参数
     * @param{ jQuery Object } 组元素
     */   
    addCol : function( o, groupElem, index ){
        var heights = o.heights,
            margins = o.margins,
            height, maxHeight, cache, len, i;

        groupElem.empty().append( o.mainFragment );
        easyWF.getChangeOffset( o, groupElem );
        
        if( !o.fixedHeight && index !== undefined ){
            cache = o.wfCache[ index ];
            len = cache.length;
        
            // 列被初次添加到页面中时，重新计算单元格的高度
            for( i = 0; i < len; i++ ){
                cache[i].height = cache[i].elem.outerHeight();
            }
        
            easyWF.getColHeights( o );  
        } 
        
        maxHeight = easyWF.getExtreme( heights, false ).item;
        
        for( i = 0; i < o.cols; i++ ){
            margins[i] = heights[i] - maxHeight;
        }

        if( o.initOffset ){
            height = groupElem.outerHeight() + groupElem.offset().top;
            
            // 初始化时要确保加载好一屏半的图片
            if( height < o.initOffset ){     
                easyWF.loadData( o );
                return;
            }
            
            o.initOffset = 0;
        }    
    }, 
    
    /*
     * 离线排序，离线排序比在DOM树中进行排序更快
     * @param{ Object } 配置参数
     * @param{ Number } 索引
     * @param{ Number } 上一组的最高列的高度
     */      
    offlineSort : function( o, index, prevHeight ){
        var heights = o.heights,
            margins = o.margins,
            maxHeight = easyWF.getExtreme( heights, false ).item,
            groupElem = o.groupElems.eq( index ),
            fragment = o.fragments[ index ],
            i = 0;
            
        $( fragment ).empty();
        fragment.appendChild( o.mainFragment );   
        groupElem.css( 'height', maxHeight - prevHeight + 'px' );
        easyWF.getChangeOffset( o, groupElem );
        
        for( ; i < o.cols; i++ ){
            margins[i] = heights[i] - maxHeight;
        }
    },
    
    /*
     * 删除组
     * @param{ Object } 配置参数
     */     
    removeGroup : function( o ){
        var elem = o.removeElem,
            nextElem = elem.next(),
            fragment = fragment = o.target[0].ownerDocument.createDocumentFragment();
    
        elem.addClass( 'wf_empty' ).css({
            visibility : 'hidden',
            height : elem.height() + 'px'
        });

        fragment = o.target[0].ownerDocument.createDocumentFragment();
        elem.children().appendTo( fragment );
        o.fragments.push( fragment );
        o.revertElem = elem;        
        
        if( nextElem.length && nextElem.hasClass('wf_group') ){
            o.removeElem = nextElem;
        }
    },
    
    /*
     * 恢复组
     * @param{ Object } 配置参数
     */     
    revertGroup : function( o ){
        var elem = o.revertElem,
            prevElem = elem.prev();

        elem.removeClass( 'wf_empty' )
            .append( o.fragments.pop() )
            .css({
                visibility : '',
                height : ''
            });             
            
        o.removeElem = elem;
            
        if( prevElem.length && prevElem.hasClass('wf_group') ){
            o.revertElem = prevElem;        
            
            if( o.scrollTop < prevElem.data('changeOffset') ){
                easyWF.revertGroup( o );
            }            
        }        
    },
    
    /*
     * 数据加载完成后的一些操作
     * @param{ Object } 配置参数
     * @param{ Object } 加载完成获取到的数据
     */ 
    loadComplete : function( o, data ){
        var listData = o.data = o.serialize( data ),
            index = o.wfCache.length,
            createNewGroup = false,
            target = o.target,
            result;

        if( !listData || !listData.length ){
            return;
        }           

        target.trigger( 'likecreatebefore', [ data ] ); 

        if( listData.length >= o.cols ){
            o.groupElem = easyWF.createGroup( o );
            o.groupElems = target.children( 'div.wf_group' );
            o.wfCache[ index ] = [];   
            o.colElem = easyWF.createCol( o ); 
        }
        // 数据长度小于列数时将不再新建组
        else{
            index--;
            createNewGroup = true;
        }

        o.prevHeights = o.heights.concat();
        
        $.each( listData, function( i, data ){
            easyWF.addCell( o, data, index );
        });                
        
        if( !createNewGroup ){
            easyWF.addCol( o, o.groupElem, index );    
        }
        
        easyWF.getLoadOffset( o );
        
        if( o.removeElem === undefined ){
            o.removeElem = o.groupElem;
        }
        
        o.reLoading = true;                
        target.trigger( 'likecreateafter', [ data ] );
    },

    // 加载数据
    loadData : function( o ){
        var loadPromise = o.load();
        
        o.reLoading = false;
        
        setTimeout(function(){            
            // 第一次的数据源可能并不会通过ajax传输
            if( loadPromise ){
                if( typeof loadPromise.done === 'function' ){
                    loadPromise.done(function( data ){
                        easyWF.loadComplete( o, data );
                    });
                }
                else{
                    easyWF.loadComplete( o, loadPromise );
                }
            }
        }, 50 );        
    },      
    
    // 绑定滚动事件
    bindScroll : function( o ){
        o.container.on( 'scroll.waterfall', function(){
            var scrollTop = o.container.scrollTop(),
                lastScrollTop = o.scrollTop,
                removeOffset, revertOffset;
                
            o.scrollTop = scrollTop;
                
            if( o.reLoading && ~o.loadOffset && scrollTop >= o.loadOffset ){
                easyWF.loadData( o );
            }
            
            // 往下滚动
            if( scrollTop > lastScrollTop ){
                removeOffset = o.removeElem.data( 'changeOffset' );
            
                if( scrollTop > removeOffset ){
                    easyWF.removeGroup( o );
                }
            }
            // 往上滚动
            else{  
                if( o.revertElem !== undefined ){
                    revertOffset = o.revertElem.data( 'changeOffset' );
                
                    if( scrollTop < revertOffset ){
                        easyWF.revertGroup( o );
                    }
                }
            }
        });    
    },

    // 绑定resize事件
    bindResize : function( o ){        
        o.container.on( 'resize.waterfall', easyWF.throttle(function(){        
            var lastElem = o.groupElems.filter( '.wf_empty' ).last(),
                nextElem = lastElem.next(),
                bakWidth = o.containerWidth,
                bakHeight = o.containerHeight,
                colWidth = o.colWidth,   
                target = o.target,             
                cols, tWidth, tHeight;
                
            o.containerWidth = o.container.width() - o.reservedWidth;
            o.containerHeight = Math.max( o.container.height(), 600 );
			tWidth = o.containerWidth - ( o.containerWidth % colWidth );
			cols = tWidth / colWidth;
  
			if( cols < o.minCols ){
				cols = o.minCols;
				tWidth = cols * colWidth;
			}

			if( cols !== o.cols && (!o.maxCols || cols <= o.maxCols) ){                
				// 瀑布流的列数为：组容器的宽度 / 列宽
				o.cols = cols;
				target.css( 'width', tWidth + 'px' );
				easyWF.initHeights( o );                 
				
				$.each( o.wfCache, function( i, data ){
					var groupElem = o.groupElems.eq( i ),
						prevHeight = easyWF.getExtreme( o.heights, false ).item;

					o.colElem = easyWF.createCol( o );
					
					$.each( data, function( _, item ){
						easyWF.addCell( o, item );
					});                
					
					if( groupElem.hasClass('wf_empty') ){
						easyWF.offlineSort( o, i, prevHeight );                        
					}
					else{
						easyWF.addCol( o, groupElem );
					}    
				});
				
				if( nextElem.length ){
					o.scrollTop = nextElem.offset().top + Math.round( nextElem.height() / 2 );
					o.container.scrollTop( o.scrollTop );
					o.removeElem = nextElem;
					o.revertElem = lastElem;
				}
				else{
					o.removeElem = o.groupElems.eq( 0 );
					delete o.revertElem;
				}                
		
				easyWF.getLoadOffset( o );
				target.trigger( 'likeresize', [ tWidth ] );
			}
			// 仅高度有变化
			else if( o.containerHeight !== bakHeight ){
				easyWF.getLoadOffset( o );
			}
        }));
    },

    // 初始化方法
    init : function( o ){
        // 强制添加滚动条
        if( $.isWindow(o.container[0]) ){
            o.container[0].document.documentElement.style.overflowY = 'scroll';
        }

        var initPromise,
            target = o.target,
            colWidth = o.colWidth,   
            maxCols = o.maxCols,
            minCols = o.minCols,
            tWidth, cols,
            
            callback = function(){
                o.initHeight = Math.min( target.height(), o.maxHeight );
                easyWF.initHeights( o );
                easyWF.loadData( o );
            };
			
		// 强制去掉瀑布流元素初始化时的多余高度
		target.css({
			fontSize : '0px',
			lineHeight : '0px'
		});
            
        o.containerWidth = o.container.width() - o.reservedWidth;
        o.containerHeight = Math.max( o.container.height(), 600 );
        o.initOffset = Math.round( o.containerHeight * 1.5 );
        tWidth = o.containerWidth - ( o.containerWidth % colWidth );
        cols = tWidth / colWidth;
        
        if( maxCols && cols > maxCols ){
            tWidth = maxCols * colWidth;
            cols = maxCols;
        }
        else if( cols < o.minCols ){
            tWidth = minCols * colWidth;
            cols = minCols;
        }
        
        o.cols = cols;            
        target.css( 'width', tWidth + 'px' );
        
        if( o.init ){
            initPromise = o.init( tWidth );
        }
        
        // 可能init回调存在异步操作，故需要使用到promise机制
        if( initPromise && typeof initPromise.done === 'function' ){
            initPromise.done( callback );
        }
        else{
            callback();           
        }
        
        easyWF.bindScroll( o );    
        
        if( o.maxCols !== o.minCols ){
            easyWF.bindResize( o );
        }
    }
    
};

var Waterfall = function( target, options ){
    target = $( target ).eq( 0 );
    options = options || {};    
    
    if( !target.length ){
        return;
    }
    
    var o = $.extend( {}, defaults, options );     
    this.__o__ = o; 
    
    o.container = $( o.container );  
    
    $.extend( o, {
        target : target,
        mainFragment : target[0].ownerDocument.createDocumentFragment(), // 暂时存放DOM元素的文档碎片容器
        initHeight : 0,      // 瀑布流初始化的高度
        targetTop : target.offset().top, // 瀑布流元素的offsetTop
        scrollTop : 0,       // 包裹容器的上一次scrollTop值
        prevHeights : null,  // 存放上一组列的高度
        reLoading : false,   // 是否重新加载
        fixedHeight : false, // 是否固定单元格的高度
        wfCache : [],        // 用于存放每个单元格的高度以及jQuery Object的引用
        fragments : [],      // 用于存放剥离DOM树的DOM元素
        loadOffset : -1,     // 加载更多数据的offset临界值
        initOffset : 0,      // 初始化时的offset临界值
        heights : null,      // 存放列的高度
        margins : null,      // 存放列的marginTop值
        offsets : {},        // 存放组的offset值
        containerWidth : 0,  // 包裹容器的宽度
        containerHeight : 0  // 包裹容器的高度
    });    
    
    easyWF.init( o );     
};

Waterfall.prototype = {

    on : function( type, fn ){
        if( this.__o__ ){
            var self = this;
            
            this.__o__.target.on( 'like' + type, function( e, width ){
                e.type = type;                
                if( width ){
                    if( typeof width === 'number' ){
                        e.width = width;
                    }
                    else{
                        e.extraData = width;
                    }                    
                }
                fn.call( self, e );
                e.stopPropagation();
            });            
        }
        
        return this;
    },
    
    un : function( type ){
        if( this.__o__ ){
            this.__o__.target.off( 'like' + type );
        }
        
        return this;
    },    
    
    reload : function(){
        var o = this.__o__;
        
        o.wfCache = [];
        o.fragments = [];
        o.reLoading = false;
        
        o.groupElems.remove();
        
        delete o.init;
        delete o.cols;        
        delete o.colElem;
        delete o.groupElem;
        delete o.groupElems;
        delete o.removeElem;
        delete o.revertElem;
        delete o.initHeight;
        
        easyWF.init( o );
    },
    
    loadEnd : function(){
        this.__o__.reLoading = false;
    }
    
};

if( !$.ui ){
    $.ui = {};
}

$.ui.Waterfall = Waterfall;

});