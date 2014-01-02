/*
* InputPlaceholder component for jQuery ( AMD Module )
*
* Copyright (c) 2013 Yiguo Chan
* Released under the MIT Licenses
*
* Docs : https://github.com/chenmnkken/ecope/wiki/InputPlaceholder-%E8%BE%93%E5%85%A5%E6%A1%86%E7%A9%BA%E7%99%BD%E5%8D%A0%E4%BD%8D%E6%96%87%E5%AD%97
* Mail : chenmnkken@gmail.com
* Date : 2014-01-01
*/
define(function(){

'use strict';

var defaults = {
    focusColor     :   '#999',      // String        获取焦点时的字体颜色值
    blurColor      :   '#333',      // String        失去焦点时的字体颜色值
    text           :   null         // String        占位文字
};

var supportInputEvent = !!( 'oninput' in window );

var easyIP = {

    // 绑定焦点处理事件
    bindFocus : function( o ){
        o.target.on( 'focus.inputplaceholder', function(){
            o.label.css( 'color', o.focusColor );
        });
    },
    
    // 绑定失去焦点事件
    bindBlur : function( o ){
        o.target.on( 'blur.inputplaceholder', function(){
            o.label.css( 'color', o.blurColor );
            
            if( o.timer ){
                clearInterval( o.timer );
                o.timer = null;
            }
        });
    },
    
    // 绑定input事件
    bindInput : function( o ){
        // 标准浏览器使用input事件
        if( supportInputEvent ){            
            o.target.on( 'input.inputplaceholder', function(){
                var val = o.target[0].value;
                
                if( o.target[0].type !== 'password' ){
                    val = $.trim( val );
                }
                
                if( val === '' ){
                    if( !o.visible ){
                        o.visible = true;
                        o.label.show();                        
                    }
                }
                else{                    
                    if( o.visible ){
                        o.visible = false;
                        o.label.hide();                        
                    }                    
                }    
            });
        }
        // 低版本浏览器使用keydown+定时器的方式来模拟input事件
        else{        
            o.target.on( 'keydown.inputplaceholder', function(){
                var val = o.target[0].value;
                
                if( o.target[0].type !== 'password' ){
                    val = $.trim( val );
                }                
                
                if( o.timer ){
                    clearInterval( o.timer );
                    o.timer = null;
                }                    
                
                if( val === '' ){
                    if( !o.visible ){
                        o.visible = true;
                        o.label.show();                        
                    }
                    else{
                        o.timer = setInterval(function(){
                            var val = o.target[0].value;
                            
                            if( o.target[0].type !== 'password' ){
                                val = $.trim( val );
                            }        
                        
                            if( val !== '' ){
                                clearInterval( o.timer );
                                o.timer = null;
                                o.visible = false;
                                o.label.hide();
                            }
                        }, 50 );
                    }
                }
                else{                    
                    if( o.visible ){
                        o.visible = false;
                        o.label.hide();                        
                    }                    
                }    
            });
        }
    },    
    
    // 绑定keyup事件
    bindKeyup : function( o ){
        o.target.on( 'keyup.inputplaceholder', function(){
            var val = o.target[0].value;
            
            if( o.target[0].type !== 'password' ){
                val = $.trim( val );
            }                    
        
            if( o.timer ){
                clearInterval( o.timer );
                o.timer = null;
            }
            
            if( val === '' ){
                if( !o.visible ){
                    o.visible = true;
                    o.label.show();
                }
            }
        });    
    },        
    
    // 将input的样式复制给label
    copyStyle : function( o ){
        var target = o.target,
            height = target.outerHeight(),
            offset = target.offset(),
            paddingLeft = parseInt( target.css('paddingLeft') ),
            borderLeftWidth = parseInt( target.css('borderLeftWidth') ),
            paddingRight = parseInt( target.css('paddingRight') ),
            borderRightWidth = parseInt( target.css('borderRightWidth') );
            
        o.visible = target[0].value === ''; 
            
        o.label.css({
            fontSize : target.css( 'fontSize' ),
            fontFamily : target.css( 'fontFamily' ),
            height : height + 'px',
            lineHeight : height + 'px',
            width : target.width() + 'px',
            paddingLeft : paddingLeft + borderLeftWidth + 'px',
            paddingRight : paddingRight + borderRightWidth + 'px',
            textIndent : target.css( 'textIndent' ),
            color : o.blurColor,
            position : 'absolute',
            top : offset.top + 'px',
            left : offset.left + 'px',
            cursor : 'text',
            display : o.visible ? 'block' : 'none'
        });
    },

    // 创建label标签
    createLabel : function( o, id ){
        var label = $( '<label for="' + id + '" style="-moz-user-select:none;">' + o.text + '</label>' );

        o.label = label;
        easyIP.copyStyle( o );
        
        label.appendTo( o.target[0].ownerDocument.body )
            // 防止双击时复制文本
            .on( 'selectstart', function(){
                return false;
            })
            .on( 'click', function(){
                o.target.focus();
            });
    },

    init : function( o ){
        var target = o.target,        
            id = target[0].id;
            
        if( id === undefined ){
            id = 'ecope_' + ( +new Date() ) + ( Math.random() + '' ).slice( -8 );
            target.id = id;
        }
            
        easyIP.createLabel( o, id );
        easyIP.bindFocus( o );
        easyIP.bindBlur( o );
        easyIP.bindInput( o );
        easyIP.bindKeyup( o );        
    }

};

var InputPlaceholder = function( target, options ){
    target = $( target ).eq( 0 );
    options = options || {};
    
    if( !target.length ){
        return;
    }
    
    var o = $.extend( {}, defaults, options );
    
    this.__o__ = o;    
    o.target = target;
    o.timer = null;
    easyIP.init( o );    
};

InputPlaceholder.prototype = {
    
    destroy : function(){
        if( !this.__o__ ){
            return;
        }
        
        var o = this.__o__;
        
        o.label.remove();
        o.target.off( 'focus.inputplaceholder blur.inputplaceholder input.inputplaceholder keydown.inputplaceholder keyup.inputplaceholder' );
        this.__o__ = o = null;
        delete this.__o__;
    },
    
    disable : function(){
        if( !this.__o__ ){
            return;
        }
        
        var o = this.__o__;
        
        o.visible = false;        
        o.label.hide();        
        o.target.off( 'focus.inputplaceholder blur.inputplaceholder input.inputplaceholder keydown.inputplaceholder keyup.inputplaceholder' );        
    },
    
    enable : function(){
        if( !this.__o__ ){
            return;
        }
        
        var o = this.__o__;
        
        if( !o.visible ){
            o.visible = true;        
            o.label.show();        
            easyIP.bindFocus( o );
            easyIP.bindBlur( o );
            easyIP.bindInput( o );
            easyIP.bindKeyup( o );    
        }
    }
    
};

if( !$.ui ){
    $.ui = {};
}

$.ui.InputPlaceholder = InputPlaceholder;

});