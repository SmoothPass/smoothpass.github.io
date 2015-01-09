var programVariables = (function () {
	var module = {};
	var DROPBOX_APP_KEY = '8qw6cevpayp0vyd';
	var client = new Dropbox.Client({key: DROPBOX_APP_KEY});
	var dropBoxDatastore;
	var storyBank, accounts, stories, accountIndex, securitySetting;
	var storyBankTable, accountTable, storyModeGeneralTable, generalRecord;
	var tempStartingInterval = 1000 * 60;

	function initialize() {
		client.getDatastoreManager().openDefaultDatastore(
			function (error, datastore) {
				if (error) {
					alert("Error opening default datastore: " + error);
				}
				dropBoxDatastore = datastore;
				storyBankTable = dropBoxDatastore.getTable('stories');
				accountTable = dropBoxDatastore.getTable('accounts');
				storyModeGeneralTable = 
						dropBoxDatastore.getTable('storyModeGeneral');
				generalRecord = storyModeGeneralTable.query();
				stories = storyBankTable.query();
				accounts = accountTable.query();


				if (generalRecord.length === 0) {
					// if security level has not been set 
					// go to that page and store information generated
					
					// change to usability-security scale page
					$.mobile.changePage($("#userSelect"));
					//initialize account index to be 0
					storyMode.setAccountIndex(0);

				} else if (generalRecord.length === 1) {
					generalRecord = generalRecord[0];

					// load values to storyMode module
					storyMode.setSecurityLevel(
							generalRecord.get('securityLevel'));
					storyMode.setAccountIndex(
							generalRecord.get('accountIndex'));
					storyMode.setGroupList(
							generalRecord.get('groupList').toArray());
					storyMode.setGroupHashesList(
							generalRecord.get('groupHashesList').toArray());
					storyMode.setGroupSaltList(
							generalRecord.get('groupSaltList').toArray());

					//change to storyBank page
					if (!$.mobile.activePage.is("#board")) {
						$.mobile.changePage($("#board"));
					}
				} else {
					//should never get here since generalTable only one entry
					alert("GeneralTable should only have one record!");
				}

				if (stories.length === 0) {
					storyMode.emptyStoryBank();
				} else {
					var tempBank = [];
					var story;
					for (var i=0; i<stories.length; i++) {
						story = stories[i];
						tempBank.push([story.get('person'), 
								story.get('scene')]);
					}
					storyMode.setStoryBank(tempBank);
				}

				storyMode.updateStoryBankList();
				accountPage.updateAccountList();

				//Ensure future changes update the list
				dropBoxDatastore.recordsChanged.addListener(
						storyMode.updateStoryBankList);
				dropBoxDatastore.recordsChanged.addListener(
						accountPage.updateAccountList);

				rehearsalModule.checkEachStory();
				rehearsalModule.renderRehearsalBoard();

				$('ul.rehearsalList li').on('click',
					function (e) {
						e.preventDefault();
						var textList = $(this).find(".storyText");
						var person = textList[0].innerHTML;
						var scene = textList[1].innerHTML;
						rehearsalModule.renderRehearsalPage(person, scene);
					}
				);
			}
		);
		return true;
	}

	function getGroupFromRecordIndices(start, end) {
		var group = [];
		var record;
		for (var i=start; i<end; i++) {
			record = stories[i];
			group.push([record.get('person'), 
					record.get('scene'), record.get('used')]);
		}
		return group;
	}

	function insertGeneralRecord(level, groupList, groupHashflten, grpSaltList) {
		storyModeGeneralTable.insert({
			securityLevel: level,
			accountIndex: 0,
			groupList: groupList,
			groupHashesList: groupHashflten,
			groupSaltList: grpSaltList
		});
		//everytime insert reset references
		generalRecord = storyModeGeneralTable[0];
	}

	function insertStory(personName, sceneName, usedBool, groupNum) {
		storyBankTable.insert({
			person: personName,
			scene: sceneName,
			used: usedBool,
			created: new Date(),
			initialized: new Date(),
			lastRehearsed: new Date(),
			groupNumber: groupNum,
			refCount: 0,
			refList: [],
			intervalNum: 0,
			rehearsalList: [],
			correctRehearsal: 1,
			totalRehearsal: 1,
			interval: tempStartingLevel
		});
		//insert then reset references
		stories = storyBankTable.query();
	}

	function insertAccount(accountName, storyList, index, ruleList) {
		accountTable.insert({
			account: accountName,
			created: new Date(),
			lastRehearsal: new Date(),
			storyList: storyList,
			accountIndex: index,
			rules: ruleList
		});
		//insert then reset references
		accounts = accountTable.query();
	}

	function updateStoryRefCount(accountName, accountNestedList) {
		// fill later
	}

	function stripStoryFromRecords() {
		var record;
		var records = storyBankTable.query();
		storyList = [];
		for (var i=0; i<records.length; i++) {
			record = records[i];
			storyList.push([record.get('person'), record.get('scene')]);
		}
		return storyList;
	}

	function parseStringToNestedArrays(stringOfArray) {
		var result = [];
		for (var i=0; i<stringOfArray.length(); i++) {
			var li = stringOfArray.get(i).split('|||');
			result.push(li);
		}
		return result;
	}

	function calculateMaxUnlockedStoryIndex() {
		var groupSaltList = generalRecord.get("groupSaltList").toArray();
		var groupList = generalRecord.get("groupList").toArray();
		var totalIndex = 0;
		for (var i=0; i<groupList.length; i++) {
			totalIndex += (groupSaltList[i] == '') ? 0 : groupList[i];
		}
		return totalIndex;
	}

	//CONTROLLERS
	//used by AccountPage
	module.calculateMaxUnlockedStoryIndex = function() {
		return calculateMaxUnlockedStoryIndex()
	}

	module.checkForDuplicateAccountNames = function(newAccountName) {
		var account;
		for (var i=0; i<accounts.length; i++) {
			account = accounts[i];
			if (account.get("account").toLowerCase() == newAccountName) {
				return true;
			}
		}
		return false;
	}

	module.calculateCuePairsFromList = function(cueList) {
		var record, person, scene;
		var result = [];
		for (var i=0; i<cueList.length; i++) {
			record = stories[cueList[i]-1];
			person = record.get('person');
			scene = record.get('scene');
			result.push(person + '|||' + scene);
		}
		return result;
	}

	module.insertAccount = function(account, storyList, index, ruleList) {
		insertAccount(account, storyList, index, ruleList);
		return;
	}

	module.insertStory = function(person, scene, used, floor) {
		insertStory(person, scene, used, floor);
	}

	module.insertGeneralRecord = function(level, groupList, grpHash, grpSalt) {
		insertGeneralRecord(level, groupList, grpHash, grpSalt);
		//after insert the record update reference to the general record
		generalRecord = storyModeGeneralTable.query()[0];
	}

	module.getAccounts = function() {
		return accounts;
	}

	module.getStories = function() {
		return stories;
	}

	module.getAccountIndex = function() {
		return accountIndex;
	}

	module.setAccountIndex = function(index) {
		generalRecord.set("accountIndex", index);
		return;
	}

	module.setGeneralRecordGroupSaltList = function(groupSaltList) {
		generalRecord.set("groupSaltList", groupSaltList);
		return;
	}

	module.setGeneralRecordFlattenedListAtIndex = function(index, flattened) {
		generalRecord.get("groupHashesList").set(index, flattened);
		return;
	}

	//used in StoryMode
	module.getGroupFromRecordIndices = function(startFrom, curLimit) {
		return getGroupFromRecordIndices(startFrom, curLimit);
	}

	module.initialize = function() {
		initialize();
	}

	module.isClientAuthenticated = function() {
		return client.isAuthenticated();
	}

	module.authenticateClient = function() {
		client.authenticate();
		return;
	}

	module.signOff = function() {
		client.signOff();
		//DISABLE UI
		//$('#home-game').addClass("ui-disabled");
		//$('#home-bank').addClass("ui-disabled");
		//$('#home-accounts').addClass("ui-disabled");
		location.reload();
	}

	module.deleteAllRecords = function() {
		var record;
		var records = storyBankTable.query();
		for (var i = 0; i < records.length; i++) {
			record = records[i];
			storyBankTable.get(record.getId()).deleteRecord();
		}

		records = accountTable.query();
		for (var i = 0; i < records.length; i++) {
			record = records[i];
			accountTable.get(record.getId()).deleteRecord();
		}

		records = storyModeGeneralTable.query();
		for (var i = 0; i < records.length; i++) {
			record = records[i];
			storyModeGeneralTable.get(record.getId()).deleteRecord();
		}
		return;
	}
	
	return module;
}());