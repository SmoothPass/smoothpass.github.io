var memoryGame = (function () {
	var module = {};
	var PERSON_INDEX = 0;
	var ACTION_INDEX = 1;
	var OBJECT_INDEX = 2;
	var SCENE_INDEX = 3;
	var SCENE_INDEX_PARTIAL = 1;
	var INITIAL_STORY_INDEX = 0;
	var gameRestart = false;
	var fullGameList;
	var storyIndex;
	var checkIndex;
	var sequenceIndex;
	var progress;
	var gameScore; //?
	var currentGroupIndex; //used when storing
	var numStories;
	//TEMP!!
	var actionList; //= ['tickling', 'fighting', 'rubbing', 'biting', 'hugging', 'enlarging', 'tying', 'repairing', 'hiding' , 'signing'];
	var objectList; //= ['hammer', 'moose', 'snowflake', 'lock', 'igloo', 'leaf', 'dice', 'moon', 'heel', 'boot'];


	//utility function : string formatting for Javascript
	String.format = function() {
		var s = arguments[0];
		for (var i = 0; i < arguments.length - 1; i++) {       
			var reg = new RegExp("\\{" + i + "\\}", "gm");             
			s = s.replace(reg, arguments[i + 1]);
		}
		return s;
	}


	function flattenGroupHashList (listOfHashes) {
		return listOfHashes.join('&&&&&&');
	}

	function generateFullGameList (partialGameList) {
		//partialGameList contains gamePplList and gameScenesList
		
		var randomInput = $("#randomnessTextBox").val();
		var tuple = Sha256.generate(randomInput, partialGameList.length);
		actionList = tuple[0];
		objectList = tuple[1];
		var result = [];
		for (var i=0; i<partialGameList.length; i++) {
			var person = partialGameList[i][PERSON_INDEX];
			var scene = partialGameList[i][SCENE_INDEX_PARTIAL];
			var action = actionList[i];
			var object = objectList[i];
			result.push([person, action, object, scene]);
		}
		//call this function to compute hashes 
		//however due to callback cannot store them now
		recoveryMechanism.computeHashesForGroup(result, currentGroupIndex);
		return result;
	}
	function initializeGameVariables() {
		storyIndex = 0;
		checkIndex = 0;
		sequenceIndex = 0;
		gameScore = 0;
		progress = 0;
	}
	function startGame (gameList, groupIndex) {
		initializeGameVariables();
		currentGroupIndex = groupIndex;
		numStories = gameList.length;
		fullGameList = generateFullGameList(gameList);
		generateNextSequence();
		//clear seed generator input
		$("#randomnessTextBox").val('');
	}	

	function sameGameStart() {
		//without generating hash again;
		gameRestart = true;
		initializeGameVariables();
		generateNextSequence();
	}

	function generateNextSequence () {
		event.preventDefault();
		var story; 

		//generate next story
		if ( storyIndex <= sequenceIndex ) {
			story = fullGameList[storyIndex];
			displayStoryPage(story[PERSON_INDEX], story[ACTION_INDEX],
							 story[OBJECT_INDEX], story[SCENE_INDEX]);

			if (storyIndex === INITIAL_STORY_INDEX) {
				$.mobile.changePage("#gamepage");
			} else {
				$( "#gamepage" ).page( "destroy" ).page();
			}
			storyIndex += 1;

		//generate next check
		} else if ( (storyIndex > sequenceIndex) && 
					(checkIndex <= sequenceIndex) ) {

			if (checkIndex == -1) {
				story = fullGameList[sequenceIndex];
				displayCheckPage(story[PERSON_INDEX], story[SCENE_INDEX]);
				checkIndex += 1;
				gameScore = -1;
				fixStyle();

			} else if ( (checkIndex === INITIAL_STORY_INDEX) &&
					(sequenceIndex === INITIAL_STORY_INDEX) ) {
				story = fullGameList[INITIAL_STORY_INDEX];
				displayCheckPage(story[PERSON_INDEX], story[SCENE_INDEX]);
				checkIndex += 1;
				fixStyle();

			} else {
				generateNextCheck();
			}

		} else {
			if (checkIndex === numStories) {
				generateNextCheck();

			} else if (checkIndex > sequenceIndex) {
				sequenceIndex += 1;
				event.preventDefault();
				$('#game-password').focus();
				var act = fullGameList[checkIndex-1][ACTION_INDEX];
				var obj = fullGameList[checkIndex-1][OBJECT_INDEX];
				var inputAct = $('#gamestories').find('#game-password').val();
				var inputObj = $('#gamestories').find('#game-password-b').val();
				if (checkStoryRight(inputAct, inputObj, act, obj)) {
					checkIndex = -1;
					generateNextSequence();
				} else {
					sequenceIndex -= 1;
					displayWrongMark();
				}
				$( "#gamepage" ).page( "destroy" ).page();
			}
		}
	}

	function generateNextCheck() {
		event.preventDefault();
		var inputAct = $('#gamestories').find('#game-password').val();
		var inputObj = $('#gamestories').find('#game-password-b').val();
		inputAct = inputAct.toLowerCase();
		inputObj = inputObj.toLowerCase();

		var index = ( (checkIndex === 0) ? sequenceIndex : checkIndex-1);
		var action = fullGameList[index][ACTION_INDEX];
		var object = fullGameList[index][OBJECT_INDEX];

		if (checkStoryRight(inputAct, inputObj, action, object)) {

			//last check?
			if (checkIndex == numStories) {
				var buttons = "\
						<p><button onclick='memoryGame.sameGameStart()'>\
						Play Again</button></p>\
						<p><button onclick='memoryGame.gameFinished()'>\
						I Got All!</button></p>";
				$('#gamestories').html("<p>Final Score: " + 
						gameScore.toString() + "/" + numStories.toString() + 
						" </p>" + buttons);

				//STORE HASHES INTO GENERAL RECORD
				//score hashes for this group into generalRecord
				//only storing if not gameRestartBool
				if (!gameRestart) {
					var flattened = flattenGroupHashList(
							recoveryMechanism.getHashResults());
					storyMode.getGroupHashesList()[currentGroupIndex] = 
							flattened;
					programVariables.setGeneralRecordFlattenedListAtIndex(
							currentGroupIndex, flattened);
					//?hashes result clear
				}
			} else {
				$('#gamestories').find('#game-password').val('');
				var curPerson = fullGameList[checkIndex][PERSON_INDEX];
				var curScene = fullGameList[checkIndex][SCENE_INDEX];
				displayCheckPage(curPerson, curScene);
				checkIndex += 1;
				fixStyle();
			}

		} else {
			displayWrongMark();
		}
	}

	function checkStoryRight (inAct, inObj, correctAct, correctObj) {
		correctAct = correctAct.toLowerCase();
		correctObj = correctObj.toLowerCase();

		if ( (inAct.indexOf(correctAct)!= -1) 
				&& (inObj.indexOf(correctObj) != -1) ) {
			displayCheckMark();
			
			//calculateTotal & update PRogressBar
			progress += 1;
			var total = 0;
			for (var i=0; i<numStories; i++) {
				total += ( ( (i===0))? 1 : (i+2));
			}
			var p = progress/total*1.0;
			$('#progress-bar').val(p.toString());
			p = Math.round(p*100);
			$('#progress-val').html( ' ' + p.toString() + '%');
			gameScore += 1;
			return true;
		}
		return false;
	}

	function fixStyle () {
		$( "#gamepage" ).page( "destroy" ).page();
		$("#gameCheckNextButton").keypress(function(e) {
			//13 IS ENTER?	
			if (e.keyCode == 13) {
				generateNextSequence();
			}
		});
		$('.boxWidget div').removeClass()
		$('#game-password').focus();
	}

	//CONTROLLER
	module.sameGameStart = function () {
		sameGameStart();

	} 
	module.backtoGame = function () {
		$.mobile.changePage('#gamepage');
		setTimeout('', 1000);
		$('#game-password').focus();
	}

	module.forgetStory = function () {
		displayForgetStoryPage(checkIndex, sequenceIndex, fullGameList);
	}

	module.displayNextSequence = function () {
		generateNextSequence();
	}

	module.displayNextCheck = function () {
		generateNextCheck();

	}
	module.startGameNow = function (glist, i) {
		startGame(glist, i);	
	}

	module.gameFinished = function () {
		//CLEAR DATA
		fullGameList = [];
		//later change to what page? rehearsal page?
		$.mobile.changePage("#bank");
	}

	module.getVerbComboBoxWrapper = function (id) {
		//
		var source = generateActionSource();
		getJqWidgetsComboBox(id, source);
		//getVerbComboBox(id);
	}

	module.getObjectComboBoxWrapper = function (id) {
		getObjectComboBox(id);
	}
	//VIEW FUNCTIONS
	function displayStoryPage (person, action, object, scene) {
		//person action object scene
		var html = "\
				<div><figure><img class=clue src=images/person/{0}.jpg />\
				<figcaption>{1}</figcaption></figure>is<figure>\
				<img class=clue src=images/action/{2}1.jpg /><figcaption>{3}\
				</figcaption></figure>{8}<figure><img class=clue \
				src=images/object/{4}1.jpg /><figcaption>{5}</figcaption>\
				</figure>in/on<figure><img class=clue \
				src=images/scene/{6}.jpg /><figcaption>the {7}</figcaption>\
				</figure></div><div><a href='#' data-role='button' \
				tabindex='1' onclick='memoryGame.displayNextSequence();' >\
				Next</a></div>";

		var article = (object == 'igloo' ? 'an' : 'a');

		$('#gamestories').html(
				String.format(html, 
						person, person.split('_').join(' '),
						action, action, 
						object, object, 
						scene.toLowerCase(), 
						scene.split('_').join(' '), article));
		
	}

	function displayCheckPage (person, scene) {
		var html = "\
				<figure><img class=clue src=images/person/{0}.jpg />\
				<figcaption>{1}</figcaption></figure><figure><img class=clue \
				src=images/scene/{2}.jpg /><figcaption>{3}</figcaption>\
				</figure><span data-role='fieldcontain'><form action='#'>\
				<span class='boxWidget'><input type='text' autocorrect='off' \
				name='password' id='game-password' value='' \
				placeholder='doing what' autofocus='autofocus' tabindex='1'/>\
				<input type='text' autocorrect='off' name='password2' \
				id='game-password-b' value='' placeholder='doing what' \
				tabindex='2'/></span><br><br><div class=halfbuttonDiv>\
				<a data-role='button' id='gameCheckNextButton' \
				type='submit' class=right name='submit' value='submit' \
				onclick='memoryGame.displayNextSequence()'tabindex='3'>\
				Check and Next</a><a href='#' class=left data-role='button' \
				tabindex='4' onclick='memoryGame.forgetStory()'>I Forget</a>\
				</div></span></form></span>";

		$('#gamestories').html(String.format(html, person, 
				person.split('_').join(' '), scene.toLowerCase(), 
				scene.split('_').join(' ')));
		
		//load combo box
		getVerbComboBox('game-password');
		getObjectComboBox('game-password-b');
	}

	//generate the forgetStorypage 
	function displayForgetStoryPage (checkIndex, sequenceIndex, fullGameList) {
		var html = "\
				<div class=clueDiv><figure><img class=clue \
				src=images/person/{0}.jpg /><figcaption>{1}</figcaption>\
				</figure>is <figure><img class=clue src=images/action/{2}1.jpg \
				/><figcaption>{3}</figcaption></figure>{8}<figure>\
				<img class=clue src=images/object/{4}1.jpg /><figcaption>{5}\
				</figcaption></figure>in/on<figure>\
				<img class=clue src=images/scene/{6}.jpg />\
				<figcaption>the {7}</figcaption></figure></div>";
		
		var currentStory;
		if (checkIndex == INITIAL_STORY_INDEX) {
			currentStory = fullGameList[sequenceIndex];
		} else {
			currentStory = fullGameList[checkIndex-1];
		}

		//maybe get the article from appConstants later;
		var article = (currentStory[OBJECT_INDEX] == 'igloo') ? 'an' : 'a';

		$('#hintSpace').html(
				String.format( html, currentStory[PERSON_INDEX], 
						currentStory[PERSON_INDEX].split('_').join(' '), 
						currentStory[ACTION_INDEX], currentStory[ACTION_INDEX], 
						currentStory[OBJECT_INDEX], currentStory[OBJECT_INDEX], 
						currentStory[SCENE_INDEX].toLowerCase(), 
						currentStory[SCENE_INDEX].split('_').join(' '), 
						article));

		//later instead JQuery?
		$.mobile.changePage("#forgetPage");
	}


	function displayWrongMark () {
		document.getElementById("checkMark").src = 'images/wrong.png';
		$("#checkMark").css('display', 'inline');
		$('#gamestories').css('visibility', 'hidden');
		setTimeout( 
				function() { 
					$("#checkMark").css('display', 'none'); 
					$("#gamestories").css('visibility', 'visible');
					document.getElementById("checkMark").src = 
							'images/check.png';
					}, 1000 
		);
	}

	function displayCheckMark () {
		$("#checkMark").css('display', 'inline');
		$('#gamestories').css('visibility', 'hidden');
		setTimeout( 
				function() {
					$("#checkMark").css('display', 'none'); 
					$("#gamestories").css('visibility', 'visible')
				}, 1000 
		);
	}

	function generateActionSource() {
		var action;
		var actions = appConstants.getActionsList();
		var source = [];
		for (var i=0; i<actions.length; i++) {
			action = actions[i];
			var html = "<p>" + action + "</p>";
			source.push({html:action, title:action});
		}
		return source;
	}

	function getJqWidgetsComboBox(id, source) {
		$("#" + id).jqxComboBox( { source:source, selectedIndex: 0, 
				width: '250', height: '25px'});
	}

	function getObjectComboBox(id) {
		$('#' + id).kendoComboBox({
	    	dataTextField: "text",
	    	dataValueField: "value",
	        dataSource: [
	        	{ text: "ant", value: "ant"},
	        	{ text: "boot", value: "boot"},
	        	{ text: "bunny", value: "bunny"},
		        { text: "bus", value: "bus" },
	        	{ text: "calf", value: "calf"},
	        	{ text: "chandelier", value: "chandelier"},
	        	{ text: "cow", value: "cow" },
		        { text: "cupcake", value: "cupcake" },
		        { text: "daisy", value: "daisy" },
		        { text: "dandelion", value: "dandelion" },
		        { text: "dice", value: "dice"},
		        { text: "dome", value: "dome" },
		        { text: "dove", value: "dove" },
		        { text: "hammer", value: "hammer" },
		        { text: "heel", value: "heel" },
		        { text: "hen", value: "hen"},
		        { text: "hourglass", value: "hourglass" },
		        { text: "hydrant", value: "hydrant" },
		        { text: "igloo", value: "igloo" },
		        { text: "ladder", value: "ladder" },
		        { text: "ladybug", value: "ladybug" },
		        { text: "leaf", value: "leaf"},
		        { text: "lemon", value: "lemon" },
		        { text: "lime", value: "lime" },
		        { text: "lipstick", value: "lipstick" },
		        { text: "lock", value: "lock"},
		        { text: "lollipop", value: "lollipop" },
		        { text: "map", value: "map" },
		        { text: "moon", value: "moon"},
		        { text: "moose", value: "moose" },
		        { text: "owl", value: "owl" },
		        { text: "peach", value: "peach" },
		        { text: "piano", value: "piano" },
		        { text: "pizza", value: "pizza" },
		        { text: "safe", value: "safe" },
		        { text: "saw", value: "saw" },
		        { text: "seal", value: "seal"},
		        { text: "shark", value: "shark" },
		        { text: "shoe", value: "shoe" },
		        { text: "smore", value: "smore" },
		        { text: "snowflake", value: "snowflake"},
		        { text: "stapler", value: "stapler" },
		        { text: "suit", value: "suit"},
		        { text: "sumo", value: "sumo" },
		        { text: "teacup", value: "teacup" },
		        { text: "teepee", value: "teepee" },
		        { text: "tiger", value: "tiger" },
		        { text: "toaster", value: "toaster" },
		        { text: "toilet", value: "toilet" },
		        { text: "tricycle", value: "tricycle" },
		        { text: "violin", value: "violin" },
	        ],
	        filter: "startswith",
	        suggest: true,
	        placeholder: "What?"
	    });
	}

	function getVerbComboBox(id) {
		$('#' + id).kendoComboBox({
	    	dataTextField: "text",
	    	dataValueField: "value",
	        dataSource: [
		        { text: "balancing", value: "balancing" },
		        { text: "bending", value: "bending" },
		        { text: "biting", value: "biting"},
		        { text: "bouncing", value: "bouncing" },
		        { text: "building", value: "building" },
		        { text: "burning", value: "burning"},
		        { text: "chasing", value: "chasing" },
		        { text: "clapping", value: "clapping"},
		        { text: "climbing", value: "climbing" },
		        { text: "cooking", value: "cooking"},
		        { text: "digging", value: "digging"},
		        { text: "drinking", value: "drinking" },
		        { text: "enlarging", value: "enlarging" },
		        { text: "exploding", value: "exploding"},
		        { text: "feeding", value: "feeding" },
		        { text: "fighting", value: "fighting" },
		        { text: "flipping", value: "flipping" },
		        { text: "gnawing", value: "gnawing" },
		        { text: "hanging", value: "hanging"},
		        { text: "hiding", value: "hiding" },
		        { text: "hugging", value: "hugging"},
		        { text: "juggling", value: "juggling"},
		        { text: "kissing", value: "kissing" },
		        { text: "lassoing", value: "lassoing" },
		        { text: "licking", value: "licking" },
		        { text: "oiling", value: "oiling" },
		        { text: "painting", value: "painting"},
		        { text: "piloting", value: "piloting" },
		        { text: "pushing", value: "pushing" },
		        { text: "repairing", value: "repairing" },
		        { text: "rowing", value: "rowing" },
		        { text: "rubbing", value: "rubbing"},
		        { text: "saving", value: "saving" },
		        { text: "scratching", value: "scratching" },
		        { text: "signing", value: "signing" },
		        { text: "sipping", value: "sipping" },
		        { text: "shooting", value: "shooting"},
		        { text: "smelling", value: "smelling"},
		        { text: "stewing", value: "stewing" },
		        { text: "swallowing", value: "swallowing" },
		        { text: "swinging", value: "swinging" },
		        { text: "taping", value: "taping" },
		        { text: "tattooing", value: "tattooing" },
		        { text: "throwing", value: "throwing" },
		        { text: "tickling", value: "tickling"},
		        { text: "tugging", value: "tugging" },
		        { text: "tying", value: "tying" },
		        { text: "washing", value: "washing" },
		        { text: "wrapping", value: "wrapping" },
		        { text: "zooming", value: "zooming"},
		        ],
	        filter: "startswith",
	        suggest: true,
	        placeholder: "Doing?"
	    });
	}
	return module;
}());