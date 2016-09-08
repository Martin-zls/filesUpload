(function($){
  var megapixImageUrl = '/crm/page/js/nt-mod/mod-fileUpload/megapix-image.js';
  var megapixcssUrl = '/crm/page/js/nt-mod/mod-fileUpload/files-upload.css';
  var getTokenUrl = '/crm/pic/getToken';
  var Qiniu_UploadUrl = "http://up.qiniu.com";
  var docpng = '/crm/page/img/icon/doc.png';
  var rarpng = '/crm/page/img/icon/rar.png';
  var xlspng = '/crm/page/img/icon/xls.png';
  var quality = 0.8;

  $.fn.nt_FileUpload = function(option){

    var _this = $(this),picturelist = [],picdata = [],picurl=[],gloableXHr,uploaderURL=option.uploader||Qiniu_UploadUrl;

    //管理要上传的图片
    function FileM(){};

    FileM.prototype = {
      filelist:{length:0},
      //往列表中存放图片的file对象
      add: function(file){
        var _that = this;

        var id = +new Date() + "1" + _that.filelist.length;

        _that.filelist[id] = {
          file: file,
          filetype: _that.getFileType(file),
          big: window.URL.createObjectURL(file)
        };

        _that.filelist.length++;

        var htmlstr = _that.getPichtml(id,_that.filelist[id].filetype,_that.filelist[id].big);
        _that.showpicture(id,htmlstr);

        _that.change();

        return id;
      },
      delete: function(id){
        var _that = this;
        delete _that.filelist[id];
        _that.filelist.length--;
        _this.find('.nt-global-file-upload-piclist .picli'+id).remove();
        _that.change();
      },
      change: function(){
        var _that = this;

        if(_that.filelist.length>0){
          _this.find('.nt-global-file-upload-checkall-box').show();
        }else{
          _this.find('.nt-global-file-upload-checkall-box').hide();
        }
      },
      getallfile: function(){
        return this.filelist;
      },
      //传入file对象，质量quality参数，回调函数cb会返回对应的base64数据
      fileToBase64: function(file,quality,orientation,cb){
        var mpImg = new MegaPixImage(file);
        var resImg = document.getElementById('megapixImage'),data={};

        if(quality) data.quality = quality;
        if(orientation) data.orientation = orientation;

        mpImg.render(resImg, data ,function(){
          cb(resImg.src);
        });
      },
      //获取图片的后缀名
      getFileType: function(file){
        var fileName = file.name;
        var fileType = fileName.split('.').pop();
        return fileType;
      },
      //生成图片的html
      getPichtml: function(id,filetype,filedata){
        var _that = this;
        var htmlstr = '';
        if($.inArray(filetype,['rar','zip','RAR','ZIP'])>=0){
          htmlstr += '<li class="picli'+id+'"><img src="'+rarpng+'"><span data-item="'+id+'" class="delete">×</span><span class="progress"><span></span></span><span class="speed"></span></li>';
        }else if($.inArray(filetype,['doc','DOC','docx','DOCX'])>=0){
          htmlstr += '<li class="picli'+id+'"><img src="'+docpng+'"><span data-item="'+id+'" class="delete">×</span><span class="progress"><span></span></span><span class="speed"></span></li>';
        }else if($.inArray(filetype,['xls','XLS','xlsx','XLSX'])>=0){
          htmlstr += '<li class="picli'+id+'"><img src="'+xlspng+'"><span data-item="'+id+'" class="delete">×</span><span class="progress"><span></span></span><span class="speed"></span></li>';
        }else{
          htmlstr += '<li class="picli'+id+'"><label for="compression'+id+'"><input class="compression" id="compression'+id+'" data-item="'+id+'" name="compression'+id+'" type="checkbox" '+(_that.filelist[id].quality?'checked="checked"':'')+'><img src="'+filedata+'"><div class="tools"><span data-item="'+id+'" class="rotation">旋转</span><span data-item="'+id+'" class="delete">×</span></div><span class="progress"><span></span></span><span class="speed"></span></label></li>';
        }
        return htmlstr;
      },
      //把图片htmlstr插入到页面中。
      showpicture: function(id,htmlstr){
        if(_this.find('.nt-global-file-upload-piclist .picli'+id).length>0){
          _this.find('.nt-global-file-upload-piclist .picli'+id).replaceWith(htmlstr);
        }else{
          _this.find('.nt-global-file-upload-piclist').append(htmlstr);
        }
      },
      //旋转图片
      rotationpicture: function(id){
        var _that = this;
        var typerotation = {6:3,3:8,8:0,0:6}
        _that.lock('正在旋转图片！');
        if(_that.filelist[id].rotation == undefined){
          _that.filelist[id].rotation = 6;
        }else{
          _that.filelist[id].rotation = typerotation[_that.filelist[id].rotation];
        }

        _that.fileToBase64(_that.filelist[id].file,_that.filelist[id].quality,_that.filelist[id].rotation,function(data){
          _that.filelist[id].small = data;
          var htmlstr = _that.getPichtml(id,_that.filelist[id].filetype,data);
          _that.showpicture(id,htmlstr);
          _that.open();
        });
      },
      compression: function(id,cb){
        var _that = this;
        var file = _that.filelist[id];
        file.quality = quality;

        _that.fileToBase64(file.file,file.quality,file.rotation,function(data){
          file.small = data;
          var htmlstr = _that.getPichtml(id,file.filetype,data);
          _that.showpicture(id,htmlstr);
          cb && cb();
        });
      },
      reduction: function(id,cb){
        var _that = this;
        delete _that.filelist[id].quality;
        if(_that.filelist[id].rotation){
          _that.fileToBase64(_that.filelist[id].file,_that.filelist[id].quality,_that.filelist[id].rotation,function(data){
            _that.filelist[id].small = data;
            var htmlstr = _that.getPichtml(id,_that.filelist[id].filetype,data);
            _that.showpicture(id,htmlstr);
            cb && cb();
          });
        }else{
          var htmlstr = _that.getPichtml(id,_that.filelist[id].filetype,_that.filelist[id].big);
          _that.showpicture(id,htmlstr);
          delete _that.filelist[id].small;
          cb && cb();
        }
      },
      lock: function(txt){
        $('.nt-global-file-upload-lock').show().find('.tips').html(txt);
      },
      open: function(){
        $('.nt-global-file-upload-lock').hide().find('.tips').html('');
      }
    };
    var fileManage = new FileM();

    //加载css、js的方法
    var dynamicLoading = {
      css: function(path){
        if(!path || path.length === 0){
          throw new Error('argument "path" is required !');
        }
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.href = path;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        head.appendChild(link);
      },
      js: function(path){
        if(!path || path.length === 0){
          throw new Error('argument "path" is required !');
        }
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = path;
        script.type = 'text/javascript';
        head.appendChild(script);
      }
    }

    //添加file控件
    function andFileObj(){
      var fileObjstr = '<input style="display: none;" type="file" id="fileInput'+(+ new Date())+'" multiple="multiple">';
      var fileObj = $(fileObjstr);
      _this.append('<a class="nt-global-file-upload-botton" href="javascript:void(0);">添加文件</a><div class="nt-global-file-upload-checkall-box"><label for="nt-global-file-upload-checkall"><input id="nt-global-file-upload-checkall" type="checkbox">&nbsp;&nbsp;全选</label><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>TIPS:</b>&nbsp;&nbsp;选中图片，会为对图片进行压缩，节省您的提交时间！</span></div>').append(fileObj);

      if(_this.find('#megapixImage').length == 0){
        var imgstr = '<img style="display: none;" id="megapixImage">';
        _this.append(imgstr);
      }

      if(_this.find('.nt-global-file-upload-piclist').length == 0){
        var piclist = '<ul class="nt-global-file-upload-piclist"></ul>';
        _this.append(piclist);
      }

      if(_this.find('.nt-global-file-upload-controlbox').length == 0){
        var boxstr = '<div class="nt-global-file-upload-controlbox"><a href="javascript:;" class="nt-global-file-upload-confirm-btn">上传图片</a><a href="javascript:;" class="nt-global-file-upload-cancel-btn">取消</a></div>';
        _this.append(boxstr);
      }

      _this.css('position','relative');
      _this.prepend('<div class="nt-global-file-upload-lock"><span class="tips">123123</span></div>');


      return fileObj;
    }

    //判断浏览器是不是低于ie9
    function itIE9(){
      if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion .split(";")[1].replace(/[ ]/g,"")=="MSIE8.0" || navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion .split(";")[1].replace(/[ ]/g,"")=="MSIE9.0") {
        return true;
      }else{
        return false;
      }
    }


    //绑定一些点击事件
    function bingEvent(fileObj,option){

      _this.on('click','.nt-global-file-upload-botton',function(){
        fileObj.click();
      });

      fileObj.on('change',function(){
        var fileslist = this.files,num = 0,picturenum = {picture:0,file:0,unknow:0,big:0},picfinish=0;

        for(var i=0,len=fileslist.length;i<len;i++){
          fileManage.add(fileslist[i]);
        }
        fileObj.val('');
      });

      _this.on('click','.delete',function(){
        var item = $(this).data('item');
        fileManage.delete(item);
      });

      _this.on('click','.rotation',function(){
        var item = $(this).data('item');
        fileManage.rotationpicture(item);
        return false;
      });

      _this.on('click','.nt-global-file-upload-cancel-btn',function(){
        delete fileManage;
        option.cancel && option.cancel();
      });

      _this.on('change','#nt-global-file-upload-checkall',function(){
        var value = $(this).prop('checked'),num=0;

        if(value){
          fileManage.lock('正在压缩图片！');
        }else{
          fileManage.lock('正在还原图片！');
        }

        $('.nt-global-file-upload-piclist [type="checkbox"]').prop('checked',value);

        for (var i in fileManage.filelist){
          if(i !== 'length'){
            if(value){
              fileManage.compression(i,function(){
                num++;

                if(num == fileManage.filelist.length){
                  fileManage.open();
                }
              });
            }else{
              fileManage.reduction(i,function(){
                num++;

                if(num == fileManage.filelist.length){
                  fileManage.open();
                }
              })
            }

          }
        }

      });

      _this.on('change','.nt-global-file-upload-piclist .compression',function(){
        var value = $(this).prop('checked');
        var item = $(this).data('item');
        if(value){
          fileManage.lock('正在压缩图片！');
        }else{
          fileManage.lock('正在还原图片！');
        }
        if(value){
          fileManage.compression(item,function(){
            fileManage.open();
          });
        }else{
          fileManage.reduction(item,function(){
            fileManage.open();
          });
        }
      });

      _this.on('click','.nt-global-file-upload-confirm-btn',function(){
        fileManage.lock('正在为您提交图片！');
        var filelist = fileManage.filelist,picurl=[],num=0,len = filelist.length;
        getToken(function(code){
          if(code){
            for(var i in filelist){
              (function(i){
                if(i !== 'length'){

                  if(filelist[i].rotation || filelist[i].quality){
                    picUpload(code,filelist[i].small,function(formatSpeed,percentComplete){
                      $('.picli'+i).addClass('uploading')
                      $('.picli'+i).find('.progress span').width(percentComplete+"%").html(percentComplete+"%");
                      $('.picli'+i).find('.speed').html(formatSpeed);
                    },function(data){
                      picurl.push({name:filelist[i].file.name,result:data});
                      fileManage.delete(i);
                      num++;
                      isfinish(num,picurl);
                    },function(error){
                      $('.picli'+i).find('.progress').addClass('danger').find('span').html('');
                      $('.picli'+i).find('.speed').html('传输失败，').css('text-align','center');
                      setTimeout(function(){
                        fileManage.delete(i);
                      },800);
                      num++;
                      isfinish(num,picurl);
                    })
                  }else{

                    filesUpload(code,filelist[i].file,function(formatSpeed,percentComplete){
                      $('.picli'+i).addClass('uploading')
                      $('.picli'+i).find('.progress span').width(percentComplete+"%").html(percentComplete+"%");
                      $('.picli'+i).find('.speed').html(formatSpeed);
                    },function(data){
                      picurl.push({name:filelist[i].file.name,result:data});
                      fileManage.delete(i);
                      num++;
                      isfinish(num,picurl);
                    },function(error){
                      $('.picli'+i).find('.progress').addClass('danger').find('span').html('');
                      $('.picli'+i).find('.speed').html('传输失败，').css('text-align','center');
                      setTimeout(function(){
                        fileManage.delete(i);
                      },800);
                      num++;
                      isfinish(num,picurl);
                    });
                  }
                }
              })(i);
            }
          }
        });

        function isfinish(num,picurl){
          if(num == len){
            option.confirm(picurl);
            fileManage.open();
          }
        }


      });


    }


    //获取上传图片的token
    function getToken(cb){
      $.ajax(getTokenUrl)
      .done(function(data){
        if(data.code == '0000'){
          cb(data.result);
        }else{
          alert(data.msg);
          cb(false);
        }
      });
    }



    //上传图片
    function picUpload(token,picdata,progress,success,error){
      var formdata = new FormData();
      formdata.append("token",token);
      var key = 'jpg_' + new Date().getTime() +  Math.floor((Math.random() * 100000))+'.jpg';
      formdata.append("key", key);
      var blob = dataURLtoBlob(picdata);
      formdata.append("file", blob);
      var xhr = new XMLHttpRequest();
      xhr.open('POST', uploaderURL, true);
      var startDate;
      xhr.upload.addEventListener("progress", function(evt) {
        if (evt.lengthComputable) {
          var nowDate = new Date().getTime();
          taking = nowDate - startDate;
          var x = (evt.loaded) / 1024;
          var y = taking / 1000;
          var uploadSpeed = (x / y);
          var formatSpeed;
          if (uploadSpeed > 1024) {
            formatSpeed = (uploadSpeed / 1024).toFixed(2) + "Mb\/s";
          } else {
            formatSpeed = uploadSpeed.toFixed(2) + "Kb\/s";
          }
          var percentComplete = Math.round(evt.loaded * 100 / evt.total);
          progress && progress(formatSpeed,percentComplete);
        }
      }, false);
      xhr.onreadystatechange = function(response) {
        if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText != "") {
          success && success(xhr.responseText);
        } else if (xhr.status != 200 && xhr.responseText) {
          error && error(xhr.responseText);
        }
      };
      startDate = new Date().getTime();
      xhr.send(formdata);
      return xhr;
    }

    function filesUpload(token,file,progress,success,error){
      var formdata = new FormData();
      formdata.append("token",token);
      var key = fileManage.getFileType(file)+'_' + new Date().getTime() +  Math.floor((Math.random() * 100000))+'.'+fileManage.getFileType(file);
      formdata.append("key", key);
      formdata.append("file", file);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', uploaderURL, true);
      var startDate;
      xhr.upload.addEventListener("progress", function(evt) {
        if (evt.lengthComputable) {
          var nowDate = new Date().getTime();
          taking = nowDate - startDate;
          var x = (evt.loaded) / 1024;
          var y = taking / 1000;
          var uploadSpeed = (x / y);
          var formatSpeed;
          if (uploadSpeed > 1024) {
            formatSpeed = (uploadSpeed / 1024).toFixed(2) + "Mb\/s";
          } else {
            formatSpeed = uploadSpeed.toFixed(2) + "Kb\/s";
          }
          var percentComplete = Math.round(evt.loaded * 100 / evt.total);
          progress && progress(formatSpeed,percentComplete);
        }
      }, false);
      xhr.onreadystatechange = function(response) {
        if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText != "") {
          success && success(xhr.responseText);
        } else if (xhr.status != 200 && xhr.responseText) {
          error && error(xhr.responseText);
        }
      };
      startDate = new Date().getTime();
      xhr.send(formdata);

      return xhr;
    }



    //吧base64转为blob对象
    function dataURLtoBlob(dataurl) {
      var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while(n--){
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {type:mime});
    }


    //初始化事件
    function init(option){
      //检查浏览器
      if(itIE9()){
        alert('你的浏览器版本过低，请升级到ie10或以上。或者使用谷歌浏览器。');
        return false;
      }

      dynamicLoading.js(megapixImageUrl);
      dynamicLoading.css(megapixcssUrl);

      var fileObj = andFileObj();

      bingEvent(fileObj,option);
    }

    init(option);


  };

}(jQuery));