var stringeeClient;
var call;
var authenticatedWithUserId = '';
var fromNumber = 'FROM_NUMBER';
var accessToken = 'YOUR_ACCESS_TOKEN';

$(document).ready(function () {
    //Check isWebRTCSupported
    console.log('StringeeUtil.isWebRTCSupported: ' + StringeeUtil.isWebRTCSupported());
    $('#connectBtn').on('click', function () {
        $('#connectedUserId').html('Connecting...');
        var accessToken = $('#accessTokenArea').val();
        console.log('accessToken...: ' + accessToken);
        stringeeClient = new StringeeClient();
        settingClientEvents(stringeeClient);
        stringeeClient.connect(accessToken); //Connect to Stringee server using access_token
    });
});

function makeACall() {
    var callTo = $('#callTo').val();
    if (callTo.length === 0) return;
    fromNumber = $('#fromNumber').val();
    if (fromNumber.length === 0) {
        fromNumber = authenticatedWithUserId;
    }
    call = new StringeeCall(stringeeClient, fromNumber, callTo);
    settingCallEvents(call);
    call.makeCall(function (res) {
        console.log('make call callback: ' + JSON.stringify(res));
        if (res.r !== 0) $('#callStatus').html(res.message);
        else {
            if (res.toType === 'internal') {
                $('#callType').html('App-to-App call');
            } else {
                $('#callType').html('App-to-Phone call');
            }
        }
    });
}

function settingClientEvents(client) {
    //The client connects to Stringee Server
    client.on('connect', function () {
        console.log('connected to StringeeServer');
    });
    //The client is authenticated
    client.on('authen', function (res) {
        console.log('on authen: ', res);
        if (res.r === 0) {
            authenticatedWithUserId = res.userId;
            $('#callBtn').removeAttr('disabled');
            $('#connectedUserId').html(authenticatedWithUserId);
        } else $('#connectedUserId').html(res.message);
    });
    //The client disconnects from Stringee Server
    client.on('disconnect', function () {
        console.log('disconnected');
        $('#callBtn').attr('disabled', 'disabled');
    });
    //Receives an incoming call
    client.on('incomingcall', function (incomingcall) {
        call = incomingcall;
        settingCallEvents(incomingcall);
        $('#incoming-call-div').show();
        $('#incoming_call_from').html(call.fromNumber);
        console.log('incomingcall: ', incomingcall);
        if (incomingcall.fromInternal) {
            $('#callType').html('App-to-App call');
        } else {
            $('#callType').html('Phone-to-App call');
        }
    });
    //The access_token expires
    client.on('requestnewtoken', function () {
        console.log('request new token; please get new access_token from YourServer and call client.connect(new_access_token)');
    });
    client.on('otherdeviceauthen', function (data) {
        console.log('otherdeviceauthen: ', data);
    });
}

function settingCallEvents(call1) {
    $('#hangupBtn').removeAttr('disabled');
    call1.on('error', function (info) {
        console.log('on error: ' + JSON.stringify(info));
    });
    call1.on('addlocalstream', function (stream) {
        console.log('on addlocalstream', stream);
    });
    call1.on('addremotestream', function (stream) {
        // reset srcObject to work around minor bugs in Chrome and Edge.
        console.log('on addremotestream', stream);
        remoteVideo.srcObject = null;
        remoteVideo.srcObject = stream;
    });
    call1.on('signalingstate', function (state) {
        console.log('signalingstate', state);
        if (state.code == 6) {
            $('#incoming-call-div').hide();
            callStopped();
        }
        if (state.code == 5) callStopped();
        var reason = state.reason;
        $('#callStatus').html(reason);
    });
    call1.on('mediastate', function (state) {
        console.log('mediastate ', state);
    });
    call1.on('info', function (info) {
        console.log('on info', info);
    });
    call1.on('otherdevice', function (data) {
        console.log('on otherdevice:' + JSON.stringify(data));
        if ((data.type === 'CALL_STATE' && data.code >= 200) || data.type === 'CALL_END') $('#incoming-call-div').hide();
    });
}

function answerCall() {
    call.answer(function (res) {
        console.log('answer res', res);
        $('#incoming-call-div').hide();
    });
}

function rejectCall() {
    callStopped();
    call.reject(function (res) {
        console.log('reject res', res);
        $('#incoming-call-div').hide();
    });
}

function hangupCall() {
    remoteVideo.srcObject = null;
    callStopped();
    call.hangup(function (res) {
        console.log('hangup res', res);
    });
}

function callStopped() {
    $('#hangupBtn').attr('disabled', 'disabled');
    setTimeout(function () {
        $('#callStatus').html('Call ended');
    }, 1500);
}