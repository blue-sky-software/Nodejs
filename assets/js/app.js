$(function() {

  var doCmd = function(vpnIp, cmd, params) {
    params = params || '';
    return $.get('/stream/proxy', { 'path': vpnIp + '/' + cmd + '.xml?' + params });
  };

  if($('.login.container').length) {
    console.log('sd');
    $('body').vegas({
      timer: false,
      overlay: '/images/overlay.png',
      slides: [
        { src: '/images/streets/1.jpg' },
        { src: '/images/streets/2.jpg' }
      ]
    });
  }

  if($('.stream').length) {
    $('.stream > .card-action a').click(function(e) {
      e.preventDefault();
    }).mousedown(function(e) {
      e.preventDefault();
      var url = $(this).parent().data('url');
      var direction = $(this).data('action');
      doCmd(url, 'moveptz', 'dir=' + direction);
      $(this).removeClass('grey-text').addClass('blue-text');
    }).mouseup(function(e) {
      e.preventDefault();

      var url = $(this).parent().data('url');
      doCmd(url, 'moveptz', 'dir=stop');
      $(this).addClass('grey-text').removeClass('blue-text');
    });
  }

  if($('.wifi-panel').length) {
    var url = $('#vpnip').val();

    doCmd(url, 'wifi').then(function(res) {
      $('#wifiPreload').hide();
      $('#wifiForm').show();
      var wifi = res.data.Result;
      console.log(wifi);
      $('#wifiForm input').prop('disabled', wifi.Enable[0] !== '1');
      $('#wifiForm input[type=checkbox]').prop('checked', wifi.Enable[0] === '1');
      $('#wifiForm input[type=password]').val(wifi.Password[0]);
      $('#wifiForm input[name=ssid]').val(wifi.Ssid[0]);
      $('#wifiConnected').text(wifi.Connected[0] === '1' ? 'Connected' : 'Disconnected');
      $('#wifiForm input[type=checkbox]').prop('disabled', false);

      var id = $('#wifiForm select[name=encrypt]').parent().find('input:first').data('activates');
      var val = $('#wifiForm select[name=encrypt] option[value=' + wifi.AuthMode[0] + ']').text()
      $('#' + id + ' li:contains(' + val + ')' ).click();

      id = $('#wifiForm select[name=encryptType]').parent().find('input:first').data('activates');
      val = $('#wifiForm select[name=encryptType] option[value=' + wifi.EncrypType[0] + ']').text()
      $('#' + id + ' li:contains(' + val + ')' ).click();

      $('#wifiForm input[type=checkbox]').change(function() {
        $('#wifiForm input').prop('disabled', !$(this).prop('checked'));
        $(this).prop('disabled', false);
      });

      $('#wifiForm button').click(function(e) {
        e.preventDefault();
        $('#wifiForm').hide();
        $('#wifiPreload').show();

        var count = 50;
        setInterval(function() {
          $('#wifiConnected').text('Please wait ' + (count--) + ' seconds');

          if(count === 1) {
            location.reload(true);
          }
        }, 1000);
        
        var param = "enable=" + ($('#wifiForm input[type=checkbox]').is(':checked') ? '1' : '0');
        param += '&ssid=' + encodeURIComponent($('#wifiForm input[name=ssid]').val());
        param += '&channel=0';
        param += '&AuthMode=' + encodeURIComponent($('#wifiForm select[name=encrypt]').parent().find('input:first').val().replace('-', ''));
        param += '&EncrypType=' + encodeURIComponent($('#wifiForm select[name=encryptType]').parent().find('input:first').val());
        param += '&wifi_password=' + encodeURIComponent($('#wifiForm input[type=password]').val());
        doCmd(url, 'setwifi', param);
      });

    });
  }

  $('select').material_select();
  
  $('.dropdown-button').dropdown({ hover: false });

});