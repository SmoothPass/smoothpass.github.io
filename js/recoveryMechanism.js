var recoveryMechanism = (function() {
	var module = {};

	var PERSON_INDEX_PUB = 0;
	var SCENE_INDEX_PUB = 1;
	var ACTION_INDEX_PRI = 1;
	var OBJECT_INDEX_PRI = 2;
	var MINIMUM_STORY_COUNT = 5;
	var NUM_OF_ROUNDS = 5;

	var hashResults = [];
	var recoveryResult = null;
	var groupIndex;
	var missingStoryIndex;
	var inputIndicesList;

	function makeHashStringIntoList (string) {
		return string.split('&&&&&&');
	}

	//recursively compute (bank.size choose k)
	function computeCombinationsOfSizeK (bank, k) {
		if (bank.length < k) {
			return [[]];
		} else if (bank.length === k) {
			return [bank];
		} else if (k === 1) {
			return bank.map( function (e) {return [e];} );
		} else {
			var result = [];
			var withFirst = computeCombinationsOfSizeK(bank.slice(1), k-1);
			var withOutFirst = computeCombinationsOfSizeK(bank.slice(1), k);

			for (var i=0; i<withFirst.length; i++) {
				var first = [bank[0]];
				first.push.apply(first, withFirst[i]);
				result.push(first);
			}
			withOutFirst.map( function (e) {result.push(e);} );
			return result;
		}
	}

	function compareHashToExistingOnes (hashResult) {
		//true if hashResult is found in allHashes; false otherwise
		var temp, group, hashPlusGroup, storedHash;
		//grab stored hashes from dropBox for given group
		var storedHashes = makeHashStringIntoList(
				storyMode.getGroupHashesList()[groupIndex]);

		for (var i=0; i<storedHashes.length; i++) {
			hashPlusGroup = storedHashes[i];
			temp = hashPlusGroup.split('$$$$$$');
			storedHash = temp[0];
			group = temp[1];
			if (hashResult === storedHash) {
				return [true, group];
			}
		}
		return [false, null];
	}
	function convertIndicesStringToArray (indicesString) {
		var result = [];
		for (var i=0; i<indicesString.length; i++) {
			var intString = indicesString.charAt(i);
			if (intString == 'a') {
				result.push(10);
			} else if (intString == 'b') {
				result.push(11);
			} else {
				result.push(parseInt(intString));
			}
		}
		return result;
	}
	function callbackFnForGroupHashes (hash, groupIndicesString) {
		hashResults.push(hash + '$$$$$$' + groupIndicesString);
		//string and hash seperated by '$$$$$$'
		//for DEBUGGING NOW
		//console.log('the string ' + string + ' is hashed in to ' + hash);
	}

	function callbackFnForRecovery (hash, pwGuess) {
		var index, temp, action, object;
		var boolGroupList = compareHashToExistingOnes(hash);
		if (boolGroupList[0]) {
			//if result found, store the action & object
			
			//parse group list and turn into an int list
			var groupIndicesList = 
					convertIndicesStringToArray(boolGroupList[1]);
			for (var i=0; i<groupIndicesList.length; i++) {
				index = groupIndicesList[i];
				if ( (inputIndicesList.indexOf(index) < 0) && 
					(missingStoryIndex == index) ) {
					recoveryResult = pwGuess;
					console.log(pwGuess);
					console.log('found');
					//generate recovery result page
					//temp = pwGuess.split('ing');
					action = parseInt(pwGuess.slice(1, 3));
					object = parseInt(pwGuess.slice(4, 6));
					createRecoveryResultPage(action, object);
				}
			}
		}
	}

	function generateBCryptHash (inStr, callbkFn, pwGuess, saltStr) {
		var salt;
		var round = NUM_OF_ROUNDS;
		var localBCrypt = new bCrypt();

		// generate salt using issac 
		try {
			if (saltStr == undefined) {
				salt = localBCrypt.gensalt(round);
			} else {
				salt = saltStr;
			}
		} catch (err) {
			alert('bCrypt gensalt error ' + err);
			return;
		} 

		try {
			//'' is the progressFn which does nothing
			localBCrypt.hashpw(inStr, salt, callbkFn, '', pwGuess);
		} catch (err) {
			alert('bCrypt hashpw error ' + err);
			return;
		}
	}

	function createIntStringArrayForGroup (length) {
		//this function creates a list of indices in strings given length
		//length <= 12
		var result = [];
		for (var i=0; i<length; i++) {
			if ( i < 10) {
				result.push(i.toString());
			} else if (i == 10) { //#11th story
				result.push('a');
			} else if (i == 11) { //#12th story
				result.push('b');
			} else{
				console.log('Something is wrong!');
			}
		}
		return result;
	}

	function computeHashesOfGroup (groupFullList, gpIndex) {
		var salt, groupStr, setIndicesString;
		var round = NUM_OF_ROUNDS;
		var localBCrypt = new bCrypt();

		try {
			salt = localBCrypt.gensalt(round);
		} catch (err) {
			alert('computeHashesOfGroup gensalt error ' + err);
			//?WHAT IF ERROR?
			return;
		}

		//????????
		storyMode.getGroupSaltList()[gpIndex] = salt;
		//update record
		var programRecord = programVariables.storyModeGeneralTable.query()[0];
		programRecord.set('groupSaltList', storyMode.getGroupSaltList());

		//if could use recovery mechanism;
		if (groupFullList.length > MINIMUM_STORY_COUNT) {
			var k = MINIMUM_STORY_COUNT + 1;
			var allCombinations = computeCombinationsOfSizeK(groupFullList, k);
			var indexArray = createIntStringArrayForGroup(groupFullList.length);
			var indicesCombinations = computeCombinationsOfSizeK(indexArray, k);
			for (var i=0; i<allCombinations.length; i++) {
				groupStr = ((allCombinations[i]).map( 
						function (l) {
							var act = l[ACTION_INDEX_PRI];
							var obj = l[OBJECT_INDEX_PRI];
							var action = appConstants.getStrActIndex(act);
							var object = appConstants.getStrObjIndex(obj);
							return action + object;
						})).join('');
				setIndicesString = indicesCombinations[i].join('');
				//compute hash for one set of six stories
				generateBCryptHash(groupStr, callbackFnForGroupHashes, 
						setIndicesString, salt);

			}
		}
		return;
	}

	function gatherUserInput () {
		//index is the position of the missing story in group
		var inputId, inputObj, inputAct, userInput, stroyGuess, groupGuess;
		var guessAct, guessObj;
		var inputCount = 0;
		var inputFirstHalf = '';
		var inputSecondHalf = '';
		var length = storyMode.getGroupList()[groupIndex];
		var groupSalt = storyMode.getGroupSaltList()[groupIndex];
		inputIndicesList = [];

		for (var i=0; i<length; i++) {
			inputId = i.toString();
			inputAct = $('#action-password' + inputId).val();
			inputObj = $('#object-password' + inputId).val();
			userInput = appConstants.getStrActIndex(inputAct) + 
					appConstants.getStrObjIndex(inputObj);
			if ( (userInput != '') && (missingStoryIndex!=i) ) {
				inputIndicesList.push(i);
				inputCount++;
			}
			if (i < missingStoryIndex) inputFirstHalf += userInput;
			if (i > missingStoryIndex) inputSecondHalf += userInput;
		}

		//less than minimum count cannot perform recovery
		if (inputCount < MINIMUM_STORY_COUNT) {
			//maybe fix this redirect back to recovery page?
			alert('Cannot Recover Missing Story without Five Known Ones!');
			return;
		}
		//loop through all possible actions and objects combined with known ones
		for (var i=0; i<appConstants.getActionsList().length; i++) {
			guessAct = appConstants.getObjectsList()[i];
			for (var j=0; j<appConstants.getObjectsList().length; j++) {
				guessObj = appConstants.getObjectsList()[i];
				storyGuess = appConstants.getStrActIndex(guessAct) + 
						appConstants.getStrObjIndex(guessObj);
				groupGuess = inputFirstHalf + storyGuess + inputSecondHalf;

				//no way to short-circuit since bCrypt uses a callback fn
				generateBCryptHash(groupGuess,
					callbackFnForRecovery, storyGuess, groupSalt);
			}
		}


	}

	function initializePrivateValues () {
		recoveryResult = null;
		hashResults = [];
		$("#recoveryPageDiv").html(
				"<p>Please input at least five stories. &nbsp; However, \
				only the first five will be used.</p><div id='groupStories'>\
				</div><button id='submitRecovery' type='submit' value='submit' \
				name='submit' onclick='recoveryMechanism.startRecovery()'>\
				Recover!</button></div>");
	}

	//CONTROLLER PUBLIC METHOD
	module.emptyPrivateValues = initializePrivateValues;
	module.computeHashesForGroup = computeHashesOfGroup;
	module.startRecovery = function () {
		gatherUserInput();
	}
	module.getHashResults = function () {
		return hashResults;
	}
	module.generateRecoveryPage = function (group, i, index) {
		displayRecoveryInputPage(group, i, index);
		return;
	}
	//VIEW FUNCTIONS

	//generate the recovery page used to gather user input
	function displayRecoveryInputPage (storyList, gpIndex, storyIndex) {
		var person, scene, story;
		groupIndex = gpIndex;
		missingStoryIndex = storyIndex;

		//initialize private values in case of first-time use;
		initializePrivateValues();
		var current = ''
		var head = '<ul data-role="listview" data-inset="true">';
		//??? refer back
		for (var i=0; i<storyList.length; i++){
			story = storyList[i];
			person = story[PERSON_INDEX_PUB];
			scene = story[SCENE_INDEX_PUB];	
			if (storyIndex === i) {
				//adding element for story trying to recover
				current = "id='currentItem'";
			}
			var listHtml = "\
					<li class='boarditems'" + current + 
					"><span class='pairdiv'><figure>\
					<img class=pair src='images/person/" + person + ".jpg' />\
					<figcaption><p class='storyText'>" + 
					person.split('_').join(' ') + "</p></figcaption></figure>\
					<figure><img class=pair src='images/scene/" + 
					scene.toLowerCase() + ".jpg' /><figcaption>\
					<p class='storyText'>" + scene.split('_').join(' ') + "\
					</p></figcaption></figure></span>\
					<span data-role='fieldcontain'><form action='#'>\
					<span class='boxWidget'><input type='text' \
					autocorrect='off' name='password' \
					id='action-password" + i + "' value='' \
					placeholder='doing' autofocus='autofocus' \
					tabindex='" + (2*i+1) + "'/><input type='text' \
					autocorrect='off' name='password' \
					id='object-password" + i + "' value='' \
					placeholder='what' autofocus='autofocus' \
					tabindex='" + (2*i+2) + "'/></span></form></span></li>"
			head += listHtml;
		}
		head += '</ul>';
		$('#groupStories').html(head);
		document.getElementById('submitRecovery').tabIndex=(2*i+1).toString();
		for (i=0; i<storyList.length; i++) {
			memoryGame.getVerbComboBoxWrapper('action-password'+i.toString());
			memoryGame.getObjectComboBoxWrapper('object-password'+i.toString());
		}
		document.getElementById('currentItem').style.opacity = 0.5;
		$('#action-password0').focus();
		return;
	}

	function createRecoveryResultPage(action, object) {
		var story = storyMode.getStoryBank()[missingStoryIndex];
		var person = story[PERSON_INDEX_PUB]; 
		var scene = story[SCENE_INDEX_PUB];
		var html = "\
				<div id='recoveryResultDiv'><figure><img class=clue \
				src=images/person/{0}.jpg /><figcaption>{1}</figcaption>\
				</figure>is <figure><img class=clue src=images/action/{2}1.jpg \
				/><figcaption>{3}</figcaption></figure>{8}<figure>\
				<img class=clue src=images/object/{4}1.jpg /><figcaption>{5}\
				</figcaption></figure>in/on<figure>\
				<img class=clue src=images/scene/{6}.jpg />\
				<figcaption>the {7}</figcaption></figure></div>";

		var article = (object == 'igloo' ? 'an' : 'a');

		$('#recoveryPageDiv').html(
				String.format( html, person, person.split('_').join(' '), 
						action, action, object, object, 
						scene.toLowerCase(), scene.split('_').join(' '), 
						article));

		//later instead JQuery?
		$.mobile.changePage("#recover");

	}
	
return module;

})();
