(function($){
  var megapixImageUrl = '/crm/page/js/nt-mod/mod-fileUpload/megapix-image.js';
  var megapixcssUrl = '/crm/page/js/nt-mod/mod-fileUpload/files-upload.css';
  var getTokenUrl = '/crm/pic/getToken';
  var Qiniu_UploadUrl = "http://up.qiniu.com";
  var docpng = '/crm/page/img/icon/doc.png';
  var rarpng = '/crm/page/img/icon/rar.png';
  var xlspng = '/crm/page/img/icon/doc.png';

  $.fn.nt_FileUpload = function(option){

    var _this = $(this),picturelist = [],picdata = [],picurl=[],gloableXHr;

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
      _this.append('<a class="nt-global-file-upload-botton" href="javascript:void(0);">添加文件</a>').append(fileObj);

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
        var fileslist = this.files,num = 0;

        for(var i=0,len=fileslist.length;i<len;i++){
          if(fileslist[i].size>100000000){
            if($.fn.nt_tip){
              $.fn.nt_tip(fileslist[i].name+'文件大小不能大于100M','danger');
            }else{
              alert(fileslist[i].name+'文件大小不能大于100M');
            }
            continue;
          }

          (function(i){
            var checkType = getFileType(fileslist[i])

            if(checkType.result == 'picture'){
              picturelist[i]=fileslist[i];

              fileToBase64(fileslist[i],function(base64){
                picdata[i] = base64;
                num++;
                if( num == len){
                  newPicList(picdata);
                  fileObj.val('');
                }
              });
            }else if(checkType.result == 'file'){
              picturelist[i]=fileslist[i];

              picdata[i] = checkType.type;

              num++;

              if( num == len){
                newPicList(picdata);
                fileObj.val('');
              }
            }else{
              if($.fn.nt_tip){
                $.fn.nt_tip(fileslist[i].name+'文件格式不能识别','danger');
              }else{
                alert(fileslist[i].name+'文件格式不能识别');
              }
              num++;
            }

          }(i));

        }
      });

      _this.on('click','.delete',function(){
        var item = $(this).data('item');
        picdata.splice(item,1);
        picturelist.splice(item,1);

        if(item == 0){
          if(gloableXHr){
            gloableXHr.abort();
            gloableXHr = null;
            _this.find('.nt-global-file-upload-confirm-btn').html('继续上传');
          }
          newPicList(picdata);
        }else{
          _this.find('.nt-global-file-upload-piclist .picli'+item).remove();
        }
        _this.find('.nt-global-file-upload-confirm-btn').removeClass('uploading');

      });

      _this.on('click','.nt-global-file-upload-cancel-btn',function(){
        var item = $(this).data('item');
        picdata = [];
        picturelist = [];
        _this.find('.nt-global-file-upload-piclist').html('');
        fileObj.val('');
        option.cancel && option.cancel();
      });

      _this.on('click','.nt-global-file-upload-confirm-btn',function(){
        if($(this).hasClass('uploading')){
          if($.fn.nt_tip){
            $.fn.nt_tip('正在上传中，请不要重复点击提交','danger');
          }else{
            alert('正在上传中，请不要重复点击提交');
          }
          return;
        }
        if(picdata.length>0){
          confirmEvent(picdata,option.confirm);
          $(this).addClass('uploading').html('正在上传');
          _this.find('.nt-global-file-upload-botton').hide();
        }else{
          if($.fn.nt_tip){
            $.fn.nt_tip('请选择图片！！','danger');
          }else{
            alert('请选择图片！！');
          }
        }
      });


    }

    //把file对象转base64
    function fileToBase64(file,cb){
      var mpImg = new MegaPixImage(file);
      var resImg = document.getElementById('megapixImage');
      mpImg.render(resImg, { quality: 0.6 },function(){
        cb(resImg.src);
      });
    }

    //传入file对象
    function getFileType(file){
      var fileName = file.name;
      var fileType = fileName.split('.').pop();
      if($.inArray(fileType,['jpg','JPG','png','PNG'])>=0){
        return {result:'picture',type:fileType};
      }else if($.inArray(fileType,['doc','docx','xlsx','xls','rar','zip','DOC','DOCX','XLSX','XLS','RAR','ZIP'])>=0){
        return {result:'file',type:fileType};
      }else{
        return {result:'unknown',type:fileType};
      }
    }

    function suffix(file_name){
      var result =/\.[^\.]+/.exec(file_name);
      return result;
    }

    //生成图片列表
    function newPicList(picdata){
      var htmlstr = '';
      for(var i=0,len=picdata.length;i<len;i++){
        if($.inArray(picdata[i],['rar','zip','RAR','ZIP'])>=0){
          htmlstr += '<li class="picli'+i+'"><img src="'+rarpng+'"><span data-item="'+i+'" class="delete">×</span><span class="progress"><span></span></span><span class="speed"></span></li>';
        }else if($.inArray(picdata[i],['doc','DOC','docx','DOCX'])>=0){
          htmlstr += '<li class="picli'+i+'"><img src="'+docpng+'"><span data-item="'+i+'" class="delete">×</span><span class="progress"><span></span></span><span class="speed"></span></li>';
        }else if($.inArray(picdata[i],['xls','XLS','xlsx','XLSX'])>=0){
          htmlstr += '<li class="picli'+i+'"><img src="'+xlspng+'"><span data-item="'+i+'" class="delete">×</span><span class="progress"><span></span></span><span class="speed"></span></li>';
        }else{
          htmlstr += '<li class="picli'+i+'"><img src="'+picdata[i]+'"><span data-item="'+i+'" class="delete">×</span><span class="progress"><span></span></span><span class="speed"></span></li>';
        }

      }

      _this.find('.nt-global-file-upload-piclist').html(htmlstr);
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

    //点击确定的时候执行的事件
    function confirmEvent(picdata,cb){

      getToken(function(code){
        if(code){
          linedUp(picdata,code,cb);
        }
      });
    }

    function linedUp(picdata,code,cb){
      if(picdata.length>0){
        if($.inArray(picdata[0],['doc','docx','xlsx','xls','rar','zip','DOC','DOCX','XLSX','XLS','RAR','ZIP'])>=0){
          gloableXHr = filesUpload(code,picdata,picturelist,0,function(){
            linedUp(picdata,code,cb);
          });
        }else{
          gloableXHr = picUpload(code,picdata,0,function(){
            linedUp(picdata,code,cb);
          });
        }
      }else{
        _this.find('.nt-global-file-upload-confirm-btn').removeClass('uploading').html('上传图片');
        _this.find('.nt-global-file-upload-botton').show();
        cb && cb(picurl);
      }
    }



    //上传图片
    function picUpload(token,picdata,i,cb){
      var formdata = new FormData();
      formdata.append("token",token);
      var key = 'jpg_' + new Date().getTime() +  Math.floor((Math.random() * 100000))+'.jpg';
      formdata.append("key", key);
      var blob = dataURLtoBlob(picdata[i]);
      formdata.append("file", blob);
      var xhr = new XMLHttpRequest();
      xhr.open('POST', Qiniu_UploadUrl, true);
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
          $('.picli'+i).addClass('uploading')
          $('.picli'+i).find('.progress span').width(percentComplete+"%").html(percentComplete+"%");
          $('.picli'+i).find('.speed').html(formatSpeed);
        }
      }, false);
      xhr.onreadystatechange = function(response) {
        if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText != "") {
          picurl.push({name:picturelist[i].name,result:xhr.responseText});
          picdata.splice(i,1);
          picturelist.splice(i,1);
          newPicList(picdata);
          cb && cb();
        } else if (xhr.status != 200 && xhr.responseText) {
          picdata.splice(i,1);
          picturelist.splice(i,1);
          $('.picli'+i).find('.progress').addClass('danger').find('span').html('');
          $('.picli'+i).find('.speed').html('传输失败，').css('text-align','center');
          if($.fn.nt_tip){
            $.fn.nt_tip('传输失败，请稍后重试','danger');
          }else{
            alert('传输失败，请稍后重试');
          }
          setTimeout(function(){
            newPicList(picdata);
            cb && cb();
          },800);
        }
      };
      startDate = new Date().getTime();
      xhr.send(formdata);
      return xhr;
    }

    function filesUpload(token,picdata,picturelist,i,cb){
      var formdata = new FormData();
      formdata.append("token",token);
      var key = picdata[i]+'_' + new Date().getTime() +  Math.floor((Math.random() * 100000))+'.'+picdata[i];
      formdata.append("key", key);
      formdata.append("file", picturelist[i]);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', Qiniu_UploadUrl, true);
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
          $('.picli'+i).addClass('uploading')
          $('.picli'+i).find('.progress span').width(percentComplete+"%").html(percentComplete+"%");
          $('.picli'+i).find('.speed').html(formatSpeed);
        }
      }, false);
      xhr.onreadystatechange = function(response) {
        if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText != "") {
          picurl.push({name:picturelist[i].name,result:xhr.responseText});
          picdata.splice(i,1);
          picturelist.splice(i,1);
          newPicList(picdata);
          cb && cb();
        } else if (xhr.status != 200 && xhr.responseText) {
          picdata.splice(i,1);
          picturelist.splice(i,1);
          $('.picli'+i).find('.progress').addClass('danger').find('span').html('');
          $('.picli'+i).find('.speed').html('传输失败').css('text-align','center');
          if($.fn.nt_tip){
            $.fn.nt_tip('传输失败，请稍后重试','danger');
          }else{
            alert('传输失败，请稍后重试');
          }
          setTimeout(function(){
            newPicList(picdata);
            cb && cb();
          },800);
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