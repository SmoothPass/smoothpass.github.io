//This module is for the High-Medium-Low story mode
var storyMode = ( function () {
	var module = {};
	//Constants
	var CHAR_LIMIT = 30;
	var UNIQUE_CHAR_LIMIT = 20;	

	//program variables
	var storyNumber;
	var groupList;
	var storyBank;
	var securityLevel;
	var accountIndex;
	var limitListLength;
	var groupSaltList;
	var groupHashesList;
	var selectedStoryIndex;
	//TEMP!
	var records = [];

	//UTILITIES
	String.format = function () {
		var s = arguments[0];
		for (var i = 0; i < arguments.length - 1; i++) {       
			var reg = new RegExp("\\{" + i + "\\}", "gm");             
			s = s.replace(reg, arguments[i + 1]);
		}
		return s;
	}

	//calculate the length of the groupList
	function calculateListLength (totalLength) {
		return Math.ceil(totalLength/10);
	}

	//calculate number of Unique chars for key-up
	function calculateUniqueChar (txt) {
		var chr;
		var uniqueCharList = [];
		for (var i=0; i<txt.length; i++) {
			chr = txt.charAt(i);
			if (uniqueCharList.indexOf(chr) === -1) {
				uniqueCharList.push(chr);
			}
		}
		return uniqueCharList.length;
	}

	//for key -up 
	function limits (obj, suffix) {
		var counter = $("#charCounter".concat(suffix));
		var uniqueCounter = $("#uniqueCharCounter".concat(suffix));
		var txt = obj.val();
		var length = txt.length;
		var uniqueLength = calculateUniqueChar(txt);

		//if length not enough 
		if ( !(length >= CHAR_LIMIT && uniqueLength >= UNIQUE_CHAR_LIMIT) ) {
			counter.html(length);
			uniqueCounter.html(uniqueLength);
		} else {
			//enable button TO DO fix butto CSS
			var id = 'submitRandom'.concat(suffix);
			document.getElementById(id).disabled = false;
			counter.html(length);
			uniqueCounter.html(uniqueLength);
		}
	}

	function createSaltList () {
		var result = groupList.map(function (e) { return ''; });
		groupSaltList = result;
		return result;
	}

	function createGroupHashesList () {
		var length = groupList.length;
		var result = [];
		for (var i=0; i<length; i++) {
			result.push('');
		}
		groupHashesList = result;
		return result;
	}

	function generateStoryGroup () {
		var limitsList = [];
		var length = calculateListLength(storyNumber);

		for (var i=0; i<length; i++) {
			if (i != length-1) {
				//push 10 for all except last one
				limitsList.push(10);
			} else {
				//last element in the list
				if (storyNumber % 10 === 0) {
					limitsList.push(10);
				} else {
					limitsList.push(storyNumber % 10)
				}
			}
		}
		return limitsList;
	}
	function selectBankStory (index) {
		$.mobile.changePage('#generateRandomness');
		selectedStoryIndex = index;
	}

	function startGame() {
		var group, startFrom;
		var curLimit = 0;
		var limitsList = groupList;
		var index = selectedStoryIndex;
		var records = programVariables.storyBankTable.query();


		for ( var i=0; i<limitsList.length; i++ ) {
			curLimit += limitsList[i];
			if (index < curLimit) {
				//falls in the group 
				//sets all stories in the same group to be true
				startFrom = curLimit - limitsList[i];
				for (var j=startFrom; j<curLimit; j++) {
					records[j].set('used', true);
				}
				group = programVariables.getGroupFromRecordIndices(
						startFrom, curLimit);
				memoryGame.startGameNow(group, i);
				//playtheGame
				return;
			}
		}
	}

	function recoverStory (index) {
		var group, startIndex;
		var limitsList = groupList;
		var curLimit = 0;
		for (var i=0; i<limitsList.length; i++) {
			curLimit += limitsList[i];
			if (index < curLimit) {
				startIndex = curLimit - limitsList[i];
				group = storyBank.slice(startIndex, curLimit);
				recoveryMechanism.generateRecoveryPage(group, i, index);
				$.mobile.changePage("#recover");
				return;
			}
		}
	}

	function populateBank () {
		var person, scene, used, tuple;
		var personIndex, sceneIndex;
		var copyPeopleList = appConstants.getPeopleList().slice(0);
		var copyScenesList = appConstants.getScenesList().slice(0);
		var usedPersonList = [];
		var usedSceneList = [];
		var finalPersonList = [];
		var finalSceneList = [];
		var finalRecords = [];
		var storyBankLocal = [];
		var numOfStories = storyNumber;
		var groupListLocal = groupList;
		var temp = $("#randomnessTextBoxStoryMode").val();

		//should use sha256 but needs to be modified.  currently uses random 
		//var storyBankList = Sha256.generate(temp, 43);
		for (var i=0; i<numOfStories; i++) {
			personIndex = Math.floor(Math.random() * copyPeopleList.length);
			sceneIndex = Math.floor(Math.random() * copyScenesList.length);

			person = copyPeopleList[personIndex];
			scene = copyScenesList[sceneIndex];
			used = false;
			tuple = [person, scene, used];
			finalPersonList.push(person);
			finalSceneList.push(scene);
			finalRecords.push(tuple);
			records.push(tuple);
			storyBankLocal.push([person, scene]); //including boolean
			//another way to calculate group number?
			programVariables.insertStory(person, scene, used, Math.floor(i/10));
			copyPeopleList.splice(personIndex, 1);
			copyScenesList.splice(sceneIndex, 1);
		}
		storyBank = storyBankLocal;
		renderStoryBank();
		$.mobile.changePage('#bank');
	}

	function gatherInfo () {
		var securityNum = $('#slider').val();
		var numberOfAccounts = $('#numAccountOption').val();
		if (securityNum === 50) {
			securityLevel = 'Medium';
			if (numberOfAccounts === 14) {
				storyNumber = 9;
			} else if (numberOfAccounts === 30) {
				storyNumber = 11;
			} else if (numberOfAccounts === 45) {
				storyNumber = 12;
			} else if (numberOfAccounts === 80) {
				storyNumber = 14;
			} else { //assume no more than 100?
				storyNumber = 15;
			}
		} else if (securityNum === 0) {
			securityLevel = "Low";
			if (numberOfAccounts === 14) {
				storyNumber = 4;
			} else if (numberOfAccounts === 30) {
				storyNumber = 6;
			} else if (numberOfAccounts === 45) {
				storyNumber = 7;
			} else if (numberOfAccounts === 80) {
				storyNumber = 8;
			} else { //assume no more than 100?
				storyNumber = 9;
			}
		} else {
			securityLevel = 'High';
			if (numberOfAccounts === 14) {
				storyNumber = 23;
			} else if (numberOfAccounts === 30) {
				storyNumber = 29;
			} else if (numberOfAccounts === 45) {
				storyNumber = 34;
			} else if (numberOfAccounts === 80) {
				storyNumber = 44;
			} else { //assume no more than 100?
				storyNumber = 50;
			}
		}
		$.mobile.changePage('#mode43');
		limitListLength = calculateListLength(storyNumber);
		groupList = generateStoryGroup();
		programVariables.insertRecord(securityLevel, groupList,
				createGroupHashesList(), createSaltList() );
	}
	
	//CONTROLLER 
	module.getGroupHashesList = function () {
		return groupHashesList;
	}

	module.getSecurityLevel = function () {
		return securityLevel;
	}

	module.getAccountIndex = function () {
		return accountIndex; 
	}

	module.getStoryBank = function () {
		return storyBank;
	}

	module.getGroupList = function () {
		return groupList;
	}

	module.getGroupSaltList = function () {
		return groupSaltList;
	}

	module.incrementAccountIndex = function () {
		accountIndex += 1;
		return null;
	}

	module.setSecurityLevel = function (level) {
		securityLevel = level;
	}

	module.setAccountIndex = function (index) {
		accountIndex = index;
	}

	module.setGroupList = function (list) {
		groupList = list;
	}
	
	module.setGroupHashesList = function (hashList) {
		groupHashesList = hashList;
	}

	module.setGroupSaltList = function (saltList) {
		groupSaltList = saltList;
	}

	module.updateStoryBankList = function () {
		updateStoryBankList();
	}

	module.emptyStoryBank = function () {
		storyBank = [];
	}

	module.setStoryBank = function (bank) {
		storyBank = bank;
	}

	module.recoverStory = function (i) {
		recoverStory(i);
	}

	module.selectBankStory = function (i) {
		selectBankStory(i);
	}

	module.gatherInfo = function () {
		gatherInfo();
	}

	module.populateBank = function () {
		populateBank();
	}

	module.limits = function (obj, suffix) {
		limits(obj, suffix);
	}

	module.startGame = function () {
		startGame();
	}
	//VIEW
	function updateStoryBankList () {
		$('#bankStories').empty();
		//sort? no need for storyMode
		renderStoryBank();
	}

	//rendering story bank
	function renderStoryBank () {
		$('#bank').bind("pageshow", function() {
			var record, date, person, scene, used, score;
			var className, button, pair, newli, listHTML;
			var records = programVariables.storyBankTable.query();

			if (records.length > 0) {
				listHTML = '<div id="bankStories"><ul data-role="listview" \
						data-inset="true">';
				for (var i=0; i<records.length; i++) {
					record = records[i];
					date = rehearsalModule.extractDate(	
							record.get('lastRehearsed'));
					score = Math.round(
							rehearsalModule.calculateScoreForStory(record));
					person = record.get('person');
					scene = record.get('scene');
					used = record.get('used');

					if (used) {
						className = "initializedStory";
						button = "\
								<p style='margin:0px; margin-top:2%'><button \
								onclick='storyMode.recoverStory(" + i + ")' \
								style='text-align:center;font-family=Lato;'>\
								Recover This Story</button></p>";
						pair = "\
								<li class='" + className + "'><span \
								class='pairdiv'><figure><img class=pair \
								src=images/person/{0}.jpg /><figcaption>\
								<p class='storyText'>{1}</p><p class='dateText'\
								>{4}</p></figcaption></figure><figure><img \
								class=pair src=images/scene/{2}.jpg />\
								<figcaption><p class='storyText'>{3}</p><p \
							 	class='scoreText'>Score:{5}</p></figcaption>\
							 	</figure></span>" + button + "</li>";
						newli = String.format(pair, person, 
								person.split('_').join(' '), 
								scene.toLowerCase(),
								scene.split('_').join(' '), 
								date, score.toString());
					} else {
						className = "unInitializedStory";
						button = "\
								<p style='margin:0px; margin-top:2%'><button \
								onclick='storyMode.selectBankStory(" + i + ")' \
								style='text-align:center;font-family=Lato;'>\
								Generate This Story</button></p>";
						pair = "<li class='"  + className + "'><span \
								class='pairdiv'><figure><img class=pair \
								src=images/person/{0}.jpg /><figcaption><p \
								class='storyText'>{1}</p><p class='dateText'>\
								</p></figcaption></figure><figure><img \
								class=pair src=images/scene/{2}.jpg />\
								<figcaption><p class='storyText'>{3}</p>\
								<p class='scoreText'></p></figcaption></figure>\
								</span>" + button + "</li>";
						newli = String.format(pair, person, 
								person.split('_').join(' '), 
								scene.toLowerCase(),
								scene.split('_').join(' '));
					}

					listHTML += newli;
				}
				listHTML += "</ul></div>";
				$('#banklist').html(listHTML);
				$("#bankStories").listview().listview("refresh");
			}

		});
	}
	return module;
}());

function countChecked() {
	  var  = $( "input:checked" );
	  console.log(n);
}

$(document).ready( function() {
	$('#randomnessTextBoxStoryMode').keyup( function() {
		storyMode.limits($(this), 'StoryMode');
	});
	$('#accountsList').submit(accountPage.submit);
	programVariables.client.authenticate();

	$('#randomnessTextBox').keyup(function() {
    	storyMode.limits($(this), '');
    });
	if (programVariables.client.isAuthenticated()) {
		programVariables.initialize();
	}
	$( "input[type=checkbox]" ).on( "click", countChecked );

	$(document).on("pagecreate", "#accounts", function() {
		var ticks  = '<div class="sliderTickmarks "><span>6</span></div>';
        ticks += '<div class="sliderTickmarks singleSpan"><span>10</span></div>';
        ticks += '<div class="sliderTickmarks "><span>20</span></div>';
        ticks += '<div class="sliderTickmarks "><span>30</span></div>';
        ticks += '<div class="sliderTickmarks "><span>40</span></div>';
        ticks += '<div class="sliderTickmarks "><span>50</span></div>';
        ticks += '<div class="sliderTickmarks "><span>60</span></div>';
        ticks += '<div class="sliderTickmarks "><span>70</span></div>';
        ticks += '<div class="sliderTickmarks "><span>80</span></div>';
        ticks += '<div class="sliderTickmarks "><span>90</span></div>';
        ticks += '<div class="sliderTickmarks "><span>100</span></div>';
    	$("#mainSliderBar .ui-slider-track").prepend(ticks);
	})
});