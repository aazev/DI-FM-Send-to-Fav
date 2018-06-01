// ==UserScript==
// @name         DI.FM send favourite to page
// @namespace    http://duxstudio.com.br
// @version      1.1.2
// @description  When the button like is clicked, it sends the information about the track, and channel currently playing to a webpage.
// @author       André Azevedo
// @match        *://www.di.fm/*
// @grant        GM_xmlhttpRequest
// @connect		 support.duxstudio.com.br
// @connect		 hooks.slack.com
// @noframes
// @downloadURL  http://support.duxstudio.com.br/bin/DIFMToPage.js
// @updateURL    http://support.duxstudio.com.br/bin/DIFMToPage.js
// ==/UserScript==

/*
	classes:
	up:		"value",  icon-thumbs-up-outline / icon-thumbs-up-filled
	dpwm:	icon-thumbs-down-outline / icon-thumbs-down-filled
*/

/*
$("#webplayer-region").on({
	click:function(evt){
		console.log("Click event triggered.");
		console.log($(this).attr("data-vote"));
	}
},".track-region .actions-container .voting-region .vote-buttons li");
*/
var options={
	ajaxMode:'Greasemonkey', //jQuery, Greasemonkey,debug
};

function safeEncode(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sendFavourite(info,voteKind){

	switch(options.ajaxMode){
		case "jQuery":
			$.ajax({
				url:"http://support.duxstudio.com.br/addFav.php",
				type:"POST",
				data:{
					action:"addFav",
					type:voteKind,
					favourite:info
				},
				error:function(jqXHR, textStatus, errorThrown){
					console.log("Error: "+textStatus+"("+errorThrown+")");
				},
				success:function(data, textStatus, jqXHR){
					console.log(data.message);
				}
			});
			break;
		case "Greasemonkey":
			var favourite={favourite:info};
			var uri="action=addFav&type="+voteKind+"&"+decodeURIComponent($.param(favourite));

			GM_xmlhttpRequest({
				url:"http://support.duxstudio.com.br/addFav.php",
				method:"POST",
				data:uri,
				headers:{
					"Content-Type": "application/x-www-form-urlencoded"
					},
				onerror:function(response){
					console.log("Error: "+response.responseText);
				},
				onload:function(response){
					console.log(response.responseText);
				}
			});
			break;
	}
}

function sendToSlack(info){
	var url="https://hooks.slack.com/services/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";
	$.ajax({
		url:url,
		method: "POST",
		//dataType: 'json',
		processData: false,
		data: 'payload='+JSON.stringify({
			"channel": "music",
			"username": "DIFM-BOT",
			"text": "<@U8ZPJCDND> acabou de adicionar <https://di.fm/tracks/"+info.track.id+info.chanUrl+"|*"+safeEncode(info.track.artist)+"* - "+safeEncode(info.track.title)+"> do canal <https://di.fm"+info.chanUrl+"|*"+info.chan+"*> aos favoritos!!!",
		}),
		error:function(jqXHR,textStatus, errorThrown){
			console.log(textStatus,errorThrown);
		},
		success:function(data,textStatus,jqXHR){
			console.log('Sucess!!! Slack said: '+data);
		},
		complete:function(jqXHR, textStatus){
			console.log(info,"And slack said: "+textStatus);
		}
	});
}
// di.app.request('webplayer:track')
// di.app.request('webplayer:channel')

function getTrackInfo(mode){
	var info={track:{}};
	switch(mode){
		default:
			var DITrackinfo=di.app.request('webplayer:track');
			var DIChannelinfo=di.app.request('webplayer:channel');
			info.chan = DIChannelinfo.attributes.name;
			info.chanUrl = "/"+DIChannelinfo.attributes.key;
			info.track.id = DITrackinfo.attributes.id;
			info.track.artist = DITrackinfo.attributes.display_artist;
			info.track.title = DITrackinfo.attributes.display_title;
	}

	return info;
}

$(document).ready(function(){
	$("#webplayer-region").on({
		click:function(evt){
			var voteKind=$(this).attr("data-vote");
			var info=getTrackInfo();
			sendFavourite(info,voteKind);
			sendToSlack(info);
		}
	},".track-region .actions-container .voting-region .vote-buttons li");
	//timecode
	$("#webplayer-region").on({
		click:function(evt){
			var info=getTrackInfo();
			sendToSlack(info);
		}
	},".track-region span.timecode");


	/*$("#content-wrap").on({
		click:function(evt){
			var voteKind=$(this).attr("data-vote");
			var DITrackinfo=di.app.request('webplayer:track');
			var DIChannelinfo=di.app.request('webplayer:channel');
			var info={track:{}};
			info.chan = DIChannelinfo.attributes.name;
			info.chanUrl = "/"+DIChannelinfo.attributes.key;
			info.track.id = DITrackinfo.attributes.id;
			info.track.artist = DITrackinfo.attributes.display_artist;
			info.track.title = DITrackinfo.attributes.display_title;
			sendFavourite(info,voteKind);
		}
	},"#recently-played .tracks-region .item .vote-button-region .track-voting li");*/
});